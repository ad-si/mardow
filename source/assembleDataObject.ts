import fs from "fs"
import path from "path"
import mustache from "mustache"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function wordFilter (word: string): boolean {
  return word !== "" &&
    word.length !== 1
}

function removePunctuation (word: string): string {
  return word.replace(/['";:,./?\\-]/g, "")
}

interface PassedData {
  markdown: string
  content: string
  firstHeading: string | boolean
  toc: string[]
  stats: {
    code: number
    tables: number
    images: number
    paragraphs: number
  }
  template?: string
}

interface DataObject {
  title: string | boolean
  toc: string
  content: string
  lines: number
  allLines: number
  words: number
  allWords: number
  chars: number
  images: number
  code: number
  tables: number
  paragraphs: number
  math: number
}

export default function assembleData (passedData: PassedData): string {
  const markdown = passedData.markdown
  const content = passedData.content
  const firstHeading = passedData.firstHeading
  const toc = passedData.toc
  const stats = passedData.stats
  let template = passedData.template

  const images = markdown.match(/!\[.*]\(.+\)/g)
  const words = markdown
    .split(/\s/g)
    .filter(wordFilter)
    .map(removePunctuation)
  const data: DataObject = {
    title: "",
    toc: "",
    content: "",
    lines: 0,
    allLines: 0,
    words: 0,
    allWords: 0,
    chars: 0,
    images: 0,
    code: 0,
    tables: 0,
    paragraphs: 0,
    math: 0,
  }

  //  TODO: wordHistogram(words)

  data.title = firstHeading
  data.toc = toc.join("")
  data.content = content

  data.lines = markdown
    .split(/\n/g)
    .filter(line => line !== "")
    .length
  data.allLines = markdown.split("\n").length
  data.words = words.filter(wordFilter).length
  data.allWords = markdown
    .split(/\s/g)
    .filter(word => word !== "")
    .length
  data.chars = markdown.length
  data.images = images ? images.length : 0
  data.code = stats.code
  data.tables = stats.tables
  data.paragraphs = stats.paragraphs
  data.math = markdown.split("´").length - 1


  template = fs.readFileSync(
    path.join(__dirname, "../templates/index.html"),
    "utf8",
  )

  return mustache.render(template, data)
}
