import fs from "fs"
import { marked, type Token } from "marked"
import hljs from "highlight.js"

import loadMarkdown from "./loadMarkdown.js"
import assembleDataObject from "./assembleDataObject.js"

marked.use({
  breaks: true,
  gfm: true,
  hooks: {
    preprocess (markdown: string): string {
      return markdown
    },
  },
})

interface Stats {
  code: number
  tables: number
  images: number
  paragraphs: number
}

export default async function md2html (
  mdFilePath: string,
  fileName: string,
): Promise<string | null> {
  const markdown = await loadMarkdown(mdFilePath)
  if (!markdown) return null

  // Must be recreated for each request as it has an internal state
  // to detect duplicate ids
  const slugs = new Map<string, boolean>()
  function slug (text: string): string {
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

  // Configure custom heading renderer to add IDs
  marked.use({
    renderer: {
      code (token: { text?: string, lang?: string }): string {
        const codeString = token.text || ""
        const lang = token.lang || ""
        let language = lang
        if (["", "txt", "text", "plain"].includes(lang)) {
          language = "plaintext"
        }
        const highlighted = hljs
          .highlight(String(codeString), { language }).value
        return `<pre><code class="lang-${language}">${highlighted}</code></pre>`
      },
      heading (token: { text: string, depth: number }): string {
        const text = token.text
        const level = token.depth
        const id = slug(text)
        return `<h${level} id="${id}">${text}</h${level}>`
      },
    },
  })

  let previousLevel = 0
  const toc: string[] = []
  let firstHeading: string | boolean = false
  const stats: Stats = {
    code: 0,
    tables: 0,
    images: 0,
    paragraphs: 0,
  }
  let template: string | undefined
  let inode: fs.Stats | undefined


  try {
    inode = fs.statSync(fileName)
  }
  catch (error: unknown) {
    const nodeError = error as { code?: string }
    if (nodeError.code !== "ENOENT") {
      throw error
    }
  }

  if (!inode || !inode.isDirectory()) {
    return null
  }

  const tokens = marked.lexer(markdown)

  tokens.forEach((token: Token) => {
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

  // Reset slugs map so heading renderer generates same IDs as TOC
  slugs.clear()

  const content = await marked.parse(markdown)

  const dataObject: {
    markdown: string
    content: string
    firstHeading: string | boolean
    toc: string[]
    stats: Stats
    template?: string
  } = {
    markdown,
    content,
    firstHeading,
    toc,
    stats,
  }

  if (template !== undefined) {
    dataObject.template = template
  }

  return assembleDataObject(dataObject)
}
