#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const runBackup = require('..');
const debug = require('debug')('restic-backup');

if(process.argv.length < 3) {
    process.stderr.write("Usage: restic-backup <configfile>\n");
    process.exit(1);
}

var configFile = path.resolve(process.argv[2]);

// load config

var configDefaults = {
    logs: path.resolve('logs'),
    email: null,
    restic: 'restic'
};

debug("Loading config from %s", configFile);
try {
    var userConfig = JSON.parse(fs.readFileSync(configFile));
    var config = Object.assign({}, configDefaults, userConfig);
} catch(e) {
    process.stderr.write("Failed to load config file\n\t" + e.message + "\n");
    process.exit(1);
}

runBackup(config, (err, filepath) => {
    process.stderr.write("Log: " + filepath + "\n");
    if(err) {
        process.stderr.write("Backup failed\n");
        process.exit(1);
    }
    process.stderr.write("Backup complete\n");
});
