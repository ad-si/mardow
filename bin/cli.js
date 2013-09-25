#!/usr/bin/env node

var program = require('commander'),
	fs = require('fs'),
	pjson = require('../package.json'),
	mardow = require('../index.js')

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
	.command('serve')
	.description('Serve the markdown file on localhost.')
	.action(function (cmd) {
		console.log('Usage: serve [options ...] [file]')
	})

program
	.version(pjson.version)
	.usage('[command] [options] [file]')
	.description('')


program.parse(process.argv)

if (!program.args.length){

	if(checkIfExists('index.md')){

		console.log('Serve index.md')

		mardow('./index.md')
	}
	else
		program.help()
}