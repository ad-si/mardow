#!/usr/bin/env bun

import { program, Help, Command, Option } from "commander"
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

// Custom help class to show commands before options
class CustomHelp extends Help {
  override formatHelp (cmd: Command, helper: Help): string {
    const termWidth = helper.padWidth(cmd, helper)
    const output = [`Usage: ${helper.commandUsage(cmd)}`, ""]

    if (cmd.description()) {
      output.push(cmd.description(), "")
    }

    // Commands section BEFORE options
    const commandList = helper.visibleCommands(cmd)
      .map((subCmd: Command) => {
        return helper.formatItem(
          helper.subcommandTerm(subCmd),
          termWidth,
          helper.subcommandDescription(subCmd),
          helper,
        )
      })
    if (commandList.length > 0) {
      output.push(...helper.formatItemList("Commands:", commandList, helper))
      output.push("")
    }

    // Options section AFTER commands
    const optionList = helper.visibleOptions(cmd)
      .map((option: Option) => {
        return helper.formatItem(
          helper.optionTerm(option),
          termWidth,
          helper.optionDescription(option),
          helper,
        )
      })
    if (optionList.length > 0) {
      output.push(...helper.formatItemList("Options:", optionList, helper))
      output.push("")
    }

    return output.join("\n")
  }
}

program
  .version(packageFile.version)
  .usage("[command] [options] [file]")
  .description("")
  .createHelp = () => new CustomHelp()


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
