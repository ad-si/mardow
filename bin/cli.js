#!/usr/bin/env node

const program = require('commander')
const fs = require('fs')
const packageFile = require('../package.json')
const mardow = require('../index.js')
const defaults = {
  port: 3000,
}
const serveString = 'Serve %s on http://localhost:%s'


// function range (val) {
//   return val
//     .split('..')
//     .map(Number)
// }

// function list (val) {
//   return val.split(',')
// }


program
  .option('-p --port <n>', 'Set port [default: 3000]')
  .command('serve')
  .description('Serve the markdown file on localhost.')
  .action(filePath => {
    const port = program.port || defaults.port

    if (typeof filePath === 'object') {
      console.info('Usage: serve [options ...] [file]')
    }
    else if (!fs.existsSync(filePath)) {
      console.error(filePath + ' does not exist!')
    }
    else {
      console.info(serveString, filePath, port)
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
    const port = program.port || defaults.port

    console.info(serveString, 'index.md', port)

    mardow('./index.md', port)
  }
  else {
    program.help()
  }
}
