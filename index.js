'use strict'

var marked = require('marked'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	mustache = require('mustache'),
	http = require('http'),
	stylus = require('stylus'),

	wordHistogram = require('./source/word-histogram')


/** Please stop reading!
 * This is the ugliest code I've ever written.
 * I don't want anybody to see it! ^^
 */


marked.setOptions({
	breaks: true,
	sanitize: false,
	langPrefix: 'lang-'
})


function wordFilter (n) {
	return n !== '' && n.length !== 1
}

function removePunctuation (word) {
	return word.replace(/['";:,.\/?\\-]/g, '')
}

function assembleDataObject (passedData) {

	var markdown = passedData.markdown,
		content = passedData.content,
		firstHeading = passedData.firstHeading,
		toc = passedData.toc,
		stats = passedData.stats,
		template = passedData.template,

		images = markdown.match(/!\[.*]\(.+\)/g),
		words = markdown
			.split(/\s/g)
			.filter(wordFilter)
			.map(removePunctuation),
		data = {}

	//TODO: wordHistogram(words)

	data.title = firstHeading
	data.toc = toc.join('')
	data.content = content

	data.lines = markdown
		.split(/\n/g)
		.filter(function (n) {
			return n !== ''
		})
		.length
	data.allLines = markdown.split('\n').length
	data.words = words.filter(wordFilter).length
	data.allWords = markdown
		.split(/\s/g)
		.filter(function (n) {
			return n !== ''
		})
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

function imageMiddleware (request, response) {

	var uri = url.parse(request.url).pathname,
		fileName = path.join(process.cwd(), uri),
		fileExtension = fileName.split('.').pop(),
		imageTypes = [
			'gif',
			'jpeg',
			'jpg',
			'png',
			'svg'
		],
		isImage = imageTypes.indexOf(fileExtension) !== -1


	if (isImage) {
		fs.readFile(
			path.dirname(request.mdFilePath) + uri,
			function (err, file) {

				var contentType

				if (err) {
					response.writeHead(500, {'Content-Type': 'text/plain'})
					response.write(err + '\n')
					response.end()
				}
				else {
					contentType = 'image/' + fileExtension

				if (fileExtension === 'svg')
					contentType = 'svg+xml'

					response.writeHead(200, {'Content-Type': contentType})
					response.end(file, 'binary')
				}
			}
		)
		return true
	}
}

function faviconMiddleware (request, response) {

	var uri = url.parse(request.url).pathname,
		fileName = path.join(process.cwd(), uri),
		fileExtension = fileName.split('.').pop()


	if (fileExtension === 'ico') {
		fs.readFile(__dirname + '/img/favicon.png', function (err, file) {

			if (err) throw err

			response.writeHead(200, {'Content-Type': 'image/png'})
			response.end(file, 'binary')
		})
		return true
	}
}

function javascriptMiddleware (request, response) {

	var uri = url.parse(request.url).pathname,
		fileName = path.join(process.cwd(), uri),
		fileExtension = fileName.split('.').pop()


	if (fileExtension === 'js') {
		fs.readFile(
			path.join(__dirname, uri),
			'utf8',
			function (err, file) {

				if (err) {
					response.writeHead(500, {'Content-Type': 'text/plain'})
					response.write(err + '\n')
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
}

function cssMiddleware (request, response) {

	var uri = url.parse(request.url).pathname,
		fileName = path.join(process.cwd(), uri),
		fileExtension = fileName.split('.').pop()


	if (fileExtension === 'css') {

		if(fs.existsSync(__dirname + uri))
			fs.readFile(__dirname + uri, 'utf8', function (err, file) {

				if (err) {
					response.writeHead(500, {'Content-Type': 'text/plain'})
					response.write(err + '\n')
				}
				else {
					response.writeHead(200, {'Content-Type': 'text/css'})
					response.write(file, 'utf8')
				}

				response.end()
			})

		else
			fs.readFile(
				(__dirname + '/styl/screen.styl'),
				'utf8',
				function (err, stylusString) {

					if (err) throw err

					stylus(stylusString)
						//.set('compress', true)
						//.use(nib())
						//.import('nib')
						//.define('url', stylus.url())
						.import(__dirname + '/styl/tomorrow-night.styl')
						.render(function (err, css) {

							if (err) throw err

							response.writeHead(200, {
								'Content-Type': 'text/css'
							})
							response.write(css.replace(/\n/g, ''))
							response.end()
						})
				})

		return true
	}
}

function markdownMiddleware (request, response) {

	var uri = url.parse(request.url).pathname,
		fileName = path.join(process.cwd(), uri),
		fileExtension = fileName.split('.').pop(),
		markdown = fs.readFileSync(request.mdFilePath, 'utf8'),
		tokens = marked.lexer(markdown),
		previousLevel = 0,
		toc = [],
		firstHeading = false,
		stats = {
			code: 0,
			tables: 0,
			images: 0,
			paragraphs: 0
		},
		template


	if (!fs.statSync(fileName).isDirectory())
		return null

	tokens.forEach(function (token) {

		if (token.type === 'heading') {

			var diff = token.depth - previousLevel

			if (!firstHeading)
				firstHeading = token.text


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
		if (token.type === 'code')
			stats.code++
		if (token.type === 'table')
			stats.tables++
		if (token.type === 'paragraph') {

			stats.paragraphs++

			// Omit paragraph if it only contains an image
			if (token.text.match(/^!\[.*]\(.+\)$/g))
				stats.paragraphs--
		}
	})

	toc.push('</ul>')


	marked(markdown, {}, function (err, content) {

		if (err) throw err

		response.writeHead(200, {
			'Content-Type': 'text/html'
		})
		response.write(assembleDataObject({
			markdown: markdown,
			content: content,
			firstHeading: firstHeading,
			toc: toc,
			stats: stats,
			template: template
		}), 'utf8')
		response.end()
	})

	return true
}

function server (mdPath) {

	return function (request, response) {

		request.mdFilePath = mdPath

		if (faviconMiddleware(request, response))
			return

		if (imageMiddleware(request, response))
			return

		if (javascriptMiddleware(request, response))
			return

		if (cssMiddleware(request, response))
			return

		if (markdownMiddleware(request, response))
			return


		response.writeHead(404, {'Content-Type': 'text/plain'})
		response.write('404 Not Found\n')
		response.end()

	}
}


module.exports = function (mdPath, port) {

	//stylusString = fs.readFileSync(__dirname + '/styl/screen.styl', 'utf8'),

	http
		.createServer(server(mdPath))
		.listen(port)
}
