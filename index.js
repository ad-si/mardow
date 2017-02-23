const fs = require('fs')
const url = require('url')
const path = require('path')
const http = require('http')

const marked = require('marked')
const stylus = require('stylus')

const md2html = require('./source/md2html')
// const wordHistogram = require('./source/word-histogram')

marked.setOptions({
  breaks: true,
  sanitize: false,
  langPrefix: 'lang-',
})


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

  md2html(request.mdFilePath, fileName)
    .then(html => {
      response.writeHead(200, {'Content-Type': 'text/html'})
      response.end(html)
    })
    .catch(error => console.error(error))

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
