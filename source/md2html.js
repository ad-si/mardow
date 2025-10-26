import fsp from "fs-promise"
import { marked } from "marked"
import hljs from "highlight.js"

import loadMarkdown from "./loadMarkdown.js"
import assembleDataObject from "./assembleDataObject.js"

marked.use({
  breaks: true,
  gfm: true,
  hooks: {
    preprocess (markdown) {
      return markdown
    },
  },
})

// Configure highlight.js integration
marked.use({
  renderer: {
    code (token) {
      const codeString = token.text || token
      const lang = token.lang || ""
      let language = lang
      if (["", "txt", "text", "plain"].includes(lang)) {
        language = "plaintext"
      }
      const highlighted = hljs.highlight(String(codeString), { language }).value
      return `<pre><code class="lang-${language}">${highlighted}</code></pre>`
    },
  },
})


export default async function (mdFilePath, fileName) {
  const markdown = await loadMarkdown(mdFilePath)

  // Must be recreated for each request as it has an internal state
  // to detect duplicate ids
  const slugs = new Map()
  function slug (text) {
    const base = text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
    let id = base
    let count = 1
    while (slugs.has(id)) {
      id = `${base}-${count++}`
    }
    slugs.set(id, true)
    return id
  }

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
    if (error.code !== "ENOENT") {
      throw error
    }
  }

  if (!inode || !inode.isDirectory()) {
    return null
  }

  const tokens = marked.lexer(markdown)

  tokens.forEach(token => {
    if (token.type === "heading") {
      let diff = token.depth - previousLevel

      if (!firstHeading) {
        firstHeading = token.text
      }

      const anchorId = slug(token.text)
      const anchor = `<a href="#${anchorId}">${token.text}</a>`

      if (diff === 1) {
        toc.push(`<ul><li>${anchor}</li>`)
      }
      else if (diff === 0) {
        toc.push(`<li>${anchor}</li>`)
      }
      else if (diff <= -1) {

        for (; diff < 0; diff++) {
          toc.push("</ul></li>")
        }

        toc.push(`<li>${anchor}</li>`)
      }

      previousLevel = token.depth
    }
    else if (token.type === "code") {
      stats.code++
    }
    else if (token.type === "table") {
      stats.tables++
    }
    else if (token.type === "paragraph") {
      stats.paragraphs++

      // Omit paragraph if it only contains an image
      if (token.text.match(/^!\[.*]\(.+\)$/g)) {
        stats.paragraphs--
      }
    }
  })

  toc.push("</ul>")

  const content = await marked.parse(markdown)

  return assembleDataObject({
    markdown,
    content,
    firstHeading,
    toc,
    stats,
    template,
  })
}
