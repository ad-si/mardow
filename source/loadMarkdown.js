const fsp = require('fs-promise')
const Path = require('@datatypes/path')


module.exports = function replaceIncludes (filePath) {
  const mdIncludeRegex = /!\[.+\]\(.+\.md\)/gi
  let expandedMarkdown = ''

  if (!filePath) return

  return fsp
    .readFile(String(filePath), 'utf8')
    .then(fileContent => {
      expandedMarkdown = fileContent

      return Array.from(
        // Remove duplicate entries
        new Set(fileContent.match(mdIncludeRegex))
      )
    })
    .then(matches => matches
      .map(matchedString => {
        const fileNameMatch = matchedString.match(/\((.+)\)$/i)
        const newFilePath = Path.fromString(
          `${filePath}/../${fileNameMatch[1]}`
        )

        return replaceIncludes(newFilePath)
          .then(expandedContent => {
            expandedMarkdown = expandedMarkdown
              .replace(matchedString, expandedContent)
          })
      })
    )
    .then(includePromises => Promise.all(includePromises))
    .then(() => expandedMarkdown)
}
