import url from "url"
import path from "path"
import express from "express"
import favicon from "serve-favicon"
import { fileURLToPath } from "url"
import { dirname } from "path"

import stylus from "stylus"

import md2html from "./source/md2html.js"
// import wordHistogram from './source/word-histogram.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

export default function mardow (mdPath, port) {
  function getPath (name) {
    return path.join(__dirname, name)
  }
  function getModulePath (name) {
    return path.join(__dirname, "node_modules", name)
  }

  app.use(favicon(getPath("public/images/favicon.png")))

  // Host files which might be relevant to the markdown file (e.g. images)
  // TODO: Better separate user content and mardow files as
  //   mardow files currently overwrite user files with same path
  app.use(express.static(process.cwd()))

  app.use(express.static(getPath("public")))

  app.use("/styles", express.static(getModulePath("highlight.js/styles")))
  app.use("/styles", express.static(getModulePath("font-awesome/css")))
  app.use("/fonts", express.static(getModulePath("font-awesome/fonts")))
  app.use(stylus.middleware(getPath("public/styles")))

  app.use("/scripts", express.static(getModulePath("highlight.js/lib")))
  app.use("/scripts", express.static(getModulePath("mathjax")))
  app.use("/scripts", express.static(getModulePath("jquery/dist")))

  app.use(express.static(mdPath))

  app.get("/", (request, response) => {
    const uri = url.parse(request.url).pathname
    const fileName = path.join(process.cwd(), uri)

    md2html(mdPath, fileName)
      .then(html => response.send(html))
      .catch(error => console.error(error))
  })

  app.listen(port, () => {
    console.info(`Mardow is listening on http://localhost:${port}`)
  })
}
