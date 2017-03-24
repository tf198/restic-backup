restic-backup
=============

Restic backup script with email.
Runs on Linux and Windows.

Usage
-----

	restic-backup <configfile>

Config
------

Ensure you apply appropriate permissions (600).


	{
		"restic": "/usr/local/bin/restic",
		"logs": "/var/log/backups",
		"defaults": {
			"password": "<REPO PASSWORD>",
			"repo": "/mnt/backup/repo"
		},
		"targets": [
			{
				"source": "/home/bob"
			}	
		],
		"email": {
			"server": {
				"host": "mail.example.com",
				"secure": false,
				"port": 587,
				"auth": {
					"user": "bob",
					"pass": "<password>"
				}
			},
			"message": {
				"from": "backup@example.com",
				"to": "bob@example.com"
			}
		}
	}

restic
:	Path to executable
logs
:	Optional folder to store logs in
defaults
:	Get merged into each target so you can avoid specifying in each target.
targets
:	**source**, **repo**, **password**
email
:	If specified then the log will be sent as an attachment along with the result of the backup
	**server** and **message** sections are as described in **nodemailer** documentation
