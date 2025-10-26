import fs from "fs"
import path from "path"
import mustache from "mustache"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function wordFilter (word) {
  return word !== "" &&
    word.length !== 1
}

function removePunctuation (word) {
  return word.replace(/['";:,./?\\-]/g, "")
}

export default function assembleData (passedData) {
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
  const data = {}

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
