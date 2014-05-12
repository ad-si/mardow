#!/usr/bin/env node

var program = require('commander'),
	fs = require('fs'),
	packageFile = require('../package.json'),
	mardow = require('../index.js'),
	defaults = {
		port: 3000
	}

function range(val) {
	return val.split('..').map(Number)
}

function list(val) {
	return val.split(',')
}

function checkIfExists(file){
	return fs.readdirSync('.').indexOf('index.md') !== -1
}

program
	.option('-p --port <n>', 'Set port [default: 3000]')

program
	.command('serve')
	.description('Serve the markdown file on localhost.')
	.action(function (name) {

		if(typeof name === 'object')
			console.log('Usage: serve [options ...] [file]')

		else {
			console.log('Serve ' + name)
			mardow(name, program.port || defaults.port)
		}
	})

program
	.version(packageFile.version)
	.usage('[command] [options] [file]')
	.description('')


program.parse(process.argv)


if (!program.args.length){

	if(checkIfExists('index.md')){

		console.log('Serve index.md')

		mardow('./index.md', program.port || defaults.port)
	}
	else
		program.help()
}