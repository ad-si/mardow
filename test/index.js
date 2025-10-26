import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

import loadMarkdown from "../source/loadMarkdown.js"
import expect from "unexpected"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const mdFilePath = path.join(__dirname, "include/main.md")
const expected = `# Include Test

This tests the inclusion of files.

Include 1 was included!

Include 2 was included!

Recursive include was included.

Recursive: Include 1 was included!

Recursive: Include 2 was included!


`

loadMarkdown(mdFilePath)
  .then(expandedMarkdown => {
    expect(expandedMarkdown, "to equal", expected)
  })
  .catch(error => console.error(error))
