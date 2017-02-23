const fsp = require('fs-promise')
const marked = require('marked')
const loadMarkdown = require('./loadMarkdown')
const assembleDataObject = require('./assembleDataObject')

module.exports = async function (mdFilePath, fileName) {
  const markdown = await loadMarkdown(mdFilePath)

  let previousLevel = 0
  const toc = []
  let firstHeading = false
  const stats = {
    code: 0,
    tables: 0,
    images: 0,
    paragraphs: 0,
  }
  let template
  let inode


  try {
    inode = fsp.statSync(fileName)
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }

  if (!inode || !inode.isDirectory()) {
    return null
  }

  const tokens = marked.lexer(markdown)

  tokens.forEach(token => {
    if (token.type === 'heading') {
      let diff = token.depth - previousLevel

      if (!firstHeading) {
        firstHeading = token.text
      }

      if (diff === 1) {
        toc.push('<ul><li><a>' + token.text + '</a></li>')
      }
      else if (diff === 0) {
        toc.push('<li><a>' + token.text + '</a></li>')
      }
      else if (diff <= -1) {

        for (; diff < 0; diff++) {
          toc.push('</ul></li>')
        }

        toc.push('<li><a href="#' + token.text + '">' +
             token.text + '</a></li>')
      }

      previousLevel = token.depth
    }
    if (token.type === 'code') {
      stats.code++
    }
    if (token.type === 'table') {
      stats.tables++
    }
    if (token.type === 'paragraph') {
      stats.paragraphs++

      // Omit paragraph if it only contains an image
      if (token.text.match(/^!\[.*]\(.+\)$/g)) {
        stats.paragraphs--
      }
    }
  })

  toc.push('</ul>')


  return new Promise((resolve, reject) => {
    marked(markdown, {}, (error, content) => {
      if (error) reject(error)

      resolve(assembleDataObject({
        markdown,
        content,
        firstHeading,
        toc,
        stats,
        template,
      }))
    })
  })
}
