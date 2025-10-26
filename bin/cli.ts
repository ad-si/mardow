#!/usr/bin/env bun

import { program } from "commander"
import fs from "fs"
import packageFile from "../package.json" with { type: "json" }
import mardow from "../index.js"

const defaults = {
  port: 8642,
}
const serveString = "Serve %s on http://localhost:%s"


// function range (val) {
//   return val
//     .split('..')
//     .map(Number)
// }

// function list (val) {
//   return val.split(',')
// }


program
  .option("-p --port <n>", "Set port [default: 8642]")
  .command("serve [file]")
  .description("Serve the markdown file on localhost.")
  .action((filePath?: string) => {
    // eslint-disable-next-line dot-notation
    const port = Number(program.opts()["port"]) || defaults.port

    if (!filePath) {
      console.info("Usage: serve [options ...] [file]")
    }
    else if (!fs.existsSync(filePath)) {
      console.error(filePath + " does not exist!")
    }
    else {
      console.info(serveString, filePath, port)
      mardow(filePath, port)
    }
  })

program
  .version(packageFile.version)
  .usage("[command] [options] [file]")
  .description("")


program.parse(process.argv)


if (!program.args.length) {
  if (fs.existsSync("index.md")) {
    // eslint-disable-next-line dot-notation
    const port = Number(program.opts()["port"]) || defaults.port

    console.info(serveString, "index.md", port)

    mardow("./index.md", port)
  }
  else {
    program.help()
  }
}
