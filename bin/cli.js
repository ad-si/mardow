#!/usr/bin/env node

var program = require('commander'),
    fs = require('fs'),
    packageFile = require('../package.json'),
    mardow = require('../index.js'),
    defaults = {
	    port: 3000
    },
    serveString = 'Serve %s on http://localhost:%s',
    port


function range (val) {
	return val.split('..').map(Number)
}

function list (val) {
	return val.split(',')
}


program
	.option('-p --port <n>', 'Set port [default: 3000]')


program
	.command('serve')
	.description('Serve the markdown file on localhost.')
	.action(function (filePath) {

		var port = program.port || defaults.port

		if (typeof filePath === 'object')
			console.log('Usage: serve [options ...] [file]')

		else if (!fs.existsSync(filePath))
			console.error(filePath + ' does not exist!')

		else {
			console.log(serveString, filePath, port)
			mardow(filePath, port)
		}
	})

program
	.version(packageFile.version)
	.usage('[command] [options] [file]')
	.description('')


program.parse(process.argv)


if (!program.args.length) {

	if (fs.existsSync('index.md')) {

		port = program.port || defaults.port

		console.log(serveString, 'index.md', port)

		mardow('./index.md', port)
	}
	else
		program.help()
}
