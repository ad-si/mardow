const path = require('path')

const loadMarkdown = require('../source/loadMarkdown')
const mdFilePath = path.join(__dirname, 'include/main.md')
const expect = require('unexpected')
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
    expect(expandedMarkdown, 'to equal', expected)
  })
  .catch(error => console.error(error))
