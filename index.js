const fs = require('fs')
const url = require('url')
const path = require('path')

const marked = require('marked')
const mustache = require('mustache')
const http = require('http')
const stylus = require('stylus')

// const wordHistogram = require('./source/word-histogram')

/** Please stop reading!
 * This is the ugliest code I've ever written.
 * I don't want anybody to see it! ^^
 */

marked.setOptions({
  breaks: true,
  sanitize: false,
  langPrefix: 'lang-',
})


function wordFilter (word) {
  return word !== '' &&
    word.length !== 1
}

function removePunctuation (word) {
  return word.replace(/['";:,.\/?\\-]/g, '')
}

function assembleDataObject (passedData) {
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
  data.toc = toc.join('')
  data.content = content

  data.lines = markdown
    .split(/\n/g)
    .filter(line => line !== '')
    .length
  data.allLines = markdown.split('\n').length
  data.words = words.filter(wordFilter).length
  data.allWords = markdown
    .split(/\s/g)
    .filter(word => word !== '')
    .length
  data.chars = markdown.length
  data.images = images ? images.length : 0
  data.code = stats.code
  data.tables = stats.tables
  data.paragraphs = stats.paragraphs
  data.math = markdown.split('´').length - 1


  template = fs.readFileSync(
    path.join(__dirname, '/templates/index.html'),
    'utf8'
  )

  return mustache.render(template, data)
}

function insertIncludes (markdown, filePath) {

  let includeSection

  // eslint-disable-next-line no-cond-assign
  while (includeSection = markdown.match(/\<\!--include (.+)--\>/i)) {
    markdown = markdown.replace(
      includeSection[0],
      fs.readFileSync(
        path.resolve(
          filePath,
          '..',
          includeSection[1] + '.md'
        )
      )
    )
  }

  return markdown
}

function imageMiddleware (request, response) {
  const uri = url.parse(request.url).pathname
  const fileName = path.join(process.cwd(), uri)
  const fileExtension = fileName
    .split('.')
    .pop()
  const imageTypes = [
    'gif',
    'jpeg',
    'jpg',
    'png',
    'svg',
  ]
  const isImage = imageTypes.indexOf(fileExtension) !== -1

  if (!isImage) return

  fs.readFile(
    path.dirname(request.mdFilePath) + uri,
    (error, file) => {
      let contentType

      if (error) {
        response.writeHead(500, {'Content-Type': 'text/plain'})
        response.write(error + '\n')
        response.end()
      }
      else {
        contentType = 'image/' + fileExtension
      }

      if (fileExtension === 'svg') {
        contentType = 'svg+xml'

        response.writeHead(200, {'Content-Type': contentType})
        response.end(file, 'binary')
      }
    }
  )
  return true
}

function faviconMiddleware (request, response) {
  const uri = url.parse(request.url).pathname
  const fileName = path.join(process.cwd(), uri)
  const fileExtension = fileName
    .split('.')
    .pop()

  if (fileExtension !== 'ico') return

  fs.readFile(__dirname + '/img/favicon.png', (error, file) => {
    if (error) throw error

    response.writeHead(200, {'Content-Type': 'image/png'})
    response.end(file, 'binary')
  })
  return true
}

function javascriptMiddleware (request, response) {
  const uri = url.parse(request.url).pathname
  const fileName = path.join(process.cwd(), uri)
  const fileExtension = fileName
    .split('.')
    .pop()

  if (fileExtension !== 'js') return

  fs.readFile(
    path.join(__dirname, uri),
    'utf8',
    (error, file) => {
      if (error) {
        response.writeHead(500, {'Content-Type': 'text/plain'})
        response.write(error + '\n')
      }
      else {
        response.writeHead(
          200,
          {'Content-Type': 'application/x-javascript'}
        )
        response.write(file, 'utf8')
      }

      response.end()
    }
  )
  return true
}

function cssMiddleware (request, response) {
  const uri = url.parse(request.url).pathname
  const fileName = path.join(process.cwd(), uri)
  const fileExtension = fileName
    .split('.')
    .pop()


  if (fileExtension !== 'css') return

  if (fs.existsSync(__dirname + uri)) {
    fs.readFile(__dirname + uri, 'utf8', (error, file) => {
      if (error) {
        response.writeHead(500, {'Content-Type': 'text/plain'})
        response.write(error + '\n')
      }
      else {
        response.writeHead(200, {'Content-Type': 'text/css'})
        response.write(file, 'utf8')
      }

      response.end()
    })
  }

  else {
    fs.readFile(
      __dirname + '/styl/screen.styl',
      'utf8',
      (error, stylusString) => {
        if (error) throw error

        stylus(stylusString)
          // .set('compress', true)
          // .use(nib())
          // .import('nib')
          // .define('url', stylus.url())
          .import(__dirname + '/styl/tomorrow-night.styl')
          .render((renderError, css) => {
            if (renderError) throw renderError

            response.writeHead(200, {
              'Content-Type': 'text/css',
            })
            response.write(css.replace(/\n/g, ''))
            response.end()
          })
      })
  }

  return true
}

function markdownMiddleware (request, response) {
  const uri = url.parse(request.url).pathname
  const fileName = path.join(process.cwd(), uri)
  // const fileExtension = fileName.split('.').pop()
  let markdown = fs.readFileSync(request.mdFilePath, 'utf8')
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
    inode = fs.statSync(fileName)
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }

  if (!inode || !inode.isDirectory()) {
    return null
  }
  markdown = insertIncludes(markdown, request.mdFilePath)

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


  marked(markdown, {}, (error, content) => {
    if (error) throw error

    response.writeHead(200, {
      'Content-Type': 'text/html',
    })
    response.write(assembleDataObject({
      markdown,
      content,
      firstHeading,
      toc,
      stats,
      template,
    }), 'utf8')
    response.end()
  })

  return true
}

function errorMiddleware (request, response) {
  response.writeHead(404, {'Content-Type': 'text/plain'})
  response.write('404 Not Found\n')
  response.end()
}


function server (mdPath) {
  return (request, response) => {
    request.mdFilePath = mdPath

    if (faviconMiddleware(request, response)) return
    if (imageMiddleware(request, response)) return
    if (javascriptMiddleware(request, response)) return
    if (cssMiddleware(request, response)) return
    if (markdownMiddleware(request, response)) return

    errorMiddleware(request, response)
  }
}


module.exports = (mdPath, port) => {
  // stylusString = fs.readFileSync(__dirname + '/styl/screen.styl', 'utf8'),

  http
    .createServer(server(mdPath))
    .listen(port)
}
