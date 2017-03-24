const fs = require('fs');
const os = require('os');
const path = require('path');
const async = require('async');
const spawn = require('child_process').spawn;
const debug = require('debug')('restic-backup');
const util = require('util');

function runBackup(config, cb) {
    // set up logging
    var logger = debug;
    var logFile = null;
    var logStream = process.stderr;
    var cleanUp = () => {} // noop


    if(config.logs) {
        var logName = new Date().toISOString().substring(0, 19) + ".log";
        var logFile = path.join(config.logs, logName);
        debug("Using logfile: %s", logFile);

        logStream = fs.createWriteStream(logFile);

        logger = function() {
            debug.apply(null, arguments);
            logStream.write(util.format.apply(null, arguments) + "\n");
        }

        cleanup = () => {
            logStream.close();
        };
    }

    var cmdOpts = {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
    };

    var transporter = null;

    if(config.email) {
        transporter = require('nodemailer').createTransport(config.email.server);
    }

    async.eachSeries(config.targets, (target, next) => {

        target = Object.assign(target, config.defaults);

        if(!target.source || !target.repo) return next(new Error("Missing source or repo"));
        logger("Backing up %s", target.source);
        logger("Repo: %s", target.repo);

        cmdOpts.env['RESTIC_PASSWORD'] = target.password;

        var args = ["backup", "-r", target.repo, target.source];

        var p = spawn(config.restic, args, cmdOpts);

        p.stdout.on('data', (data) => logStream.write("> " + data.toString()));
        p.stderr.on('data', (data) => logStream.write("! " + data.toString()));

        p.on('close', (code) => {
            if(code != 0) return next(new Error(`Error backing up ${target.source} [${code}]`));

            logger("Finished %s\n\n--------------", target.source);
            next();
        });

        p.on('error', (err) => {
            console.error("ERROR", err);
            next(err);
        });


    }, (backupErr) => {

        var result = 0;

        if(backupErr) {
            logger(backupErr.stack);
            debug("See %s", logFile);
            result = 1;
        } else {
            logger("Finished");
        }

        if(config.email) {
            const message = Object.assign({
                subject: ((backupErr) ? "RESTIC BACKUP FAILED" : "Restic backup") + " on " + os.hostname(),
                text: (backupErr) ? backupErr.stack : "Backup succeeded",
                attachments: [
                    {filename: logName, path: logFile}
                ]
            }, config.email.message);

            transporter.sendMail(message, (mailErr, info) => {
                if(mailErr) {
                    logger("Failed to send email: %s", err.message);
                    console.error("ERROR", err);
                    result = 1;
                } else {
                    logger("Sent email: %j", info);
                }
                cleanUp();
                cb(backupErr || mailErr, logFile);
            });
        } else {
            cleanUp();
            cb(backupErr, logFile);
        }

    });
}

module.exports = runBackup;
