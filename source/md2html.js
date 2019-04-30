const fsp = require('fs-promise')
const marked = require('marked')
const hljs = require('highlight.js')

const loadMarkdown = require('./loadMarkdown')
const assembleDataObject = require('./assembleDataObject')

marked.setOptions({
  breaks: true,
  sanitize: false,
  langPrefix: 'lang-',
  highlight: (code, lang) => {
    if (['', 'txt', 'text', 'plain'].includes(lang)) {
      lang = 'plaintext'
    }
    return hljs.highlight(lang, code).value
  },
})


module.exports = async function (mdFilePath, fileName) {
  const markdown = await loadMarkdown(mdFilePath)

  // Must be recreated for each request as it has an internal state
  // to detect duplicate ids
  const slugger = new marked.Slugger()

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

      const anchorId = slugger.slug(token.text)
      const anchor = `<a href="#${anchorId}">${token.text}</a>`

      if (diff === 1) {
        toc.push(`<ul><li>${anchor}</li>`)
      }
      else if (diff === 0) {
        toc.push(`<li>${anchor}</li>`)
      }
      else if (diff <= -1) {

        for (; diff < 0; diff++) {
          toc.push('</ul></li>')
        }

        toc.push(`<li>${anchor}</li>`)
      }

      previousLevel = token.depth
    }
    else if (token.type === 'code') {
      stats.code++
    }
    else if (token.type === 'table') {
      stats.tables++
    }
    else if (token.type === 'paragraph') {
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
