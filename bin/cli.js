#!/usr/bin/env node

var program = require('commander'),
    fs = require('fs'),
    packageFile = require('../package.json'),
    mardow = require('../index.js'),
    defaults = {
	    port: 3000
    },
    serveString = 'Serve index.md on http://localhost:%s',
    port


function range (val) {
	return val.split('..').map(Number)
}

function list (val) {
	return val.split(',')
}

function checkIfExists (file) {
	return fs.readdirSync('.').indexOf('index.md') !== -1
}

program
	.option('-p --port <n>', 'Set port [default: 3000]')



program
	.command('serve')
	.description('Serve the markdown file on localhost.')
	.action(function (name) {

		var port = program.port || defaults.port

		if (typeof name === 'object')
			console.log('Usage: serve [options ...] [file]')

		else {
			console.log(serveString, port)
			mardow(name, port)
		}
	})

program
	.version(packageFile.version)
	.usage('[command] [options] [file]')
	.description('')


program.parse(process.argv)


if (!program.args.length) {

	if (checkIfExists('index.md')) {

		port = program.port || defaults.port

		console.log(serveString, port)

		mardow('./index.md', port)
	}
	else
		program.help()
}
