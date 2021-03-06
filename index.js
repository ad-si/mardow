const url = require('url')
const path = require('path')
const express = require('express')
const favicon = require('serve-favicon')
const app = express()

const stylus = require('stylus')

const md2html = require('./source/md2html')
// const wordHistogram = require('./source/word-histogram')


module.exports = (mdPath, port) => {
  const getPath = (name) => path.join(__dirname, name)
  const getModulePath = (name) => path.join(__dirname, 'node_modules', name)

  app.use(favicon(getPath('public/images/favicon.png')))

  // Host files which might be relevant to the markdown file (e.g. images)
  // TODO: Better separate user content and mardow files as
  //   mardow files currently overwrite user files with same path
  app.use(express.static(process.cwd()))

  app.use(express.static(getPath('public')))

  app.use('/styles', express.static(getModulePath('highlight.js/styles')))
  app.use('/styles', express.static(getModulePath('font-awesome/css')))
  app.use('/fonts', express.static(getModulePath('font-awesome/fonts')))
  app.use(stylus.middleware(getPath('public/styles')))

  app.use('/scripts', express.static(getModulePath('highlight.js/lib')))
  app.use('/scripts', express.static(getModulePath('mathjax')))
  app.use('/scripts', express.static(getModulePath('jquery/dist')))

  app.use(express.static(mdPath))

  app.get('/', (request, response) => {
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
