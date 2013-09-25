var marked = require('marked'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	mustache = require('mustache'),
	http = require('http'),
	stylus = require('stylus')


marked.setOptions({
	breaks: true,
	sanitize: false,
	langPrefix: 'lang-'
})

module.exports = function (mdPath) {

	var data = {},
		template,
		markdown,
		html,
		content,
		server
	//stylusString = fs.readFileSync(__dirname + '/styl/screen.styl', 'utf8'),

	server = function (request, response) {

		var uri = url.parse(request.url).pathname,
			filename = path.join(process.cwd(), uri),
			fileExtension = filename.split('.').pop(),
			stats = {
				code: 0,
				tables: 0,
				images: 0,
				paragraphs: 0
			},
			tokens,
			toc = []

		if (fileExtension === 'css') {

			fs.readFile(
				__dirname + '/styl/screen.styl',
				'utf8',
				function (err, stylusString) {

					if (err) throw err

					stylus(stylusString)
						.set('compress', true)
						//.use(nib())
						//.import('nib')
						//.define('url', stylus.url())
						.render(function (err, css) {

							if (err) throw err

							response.writeHead(200, {
								"Content-Type": "text/css"
							})
							response.write(css.replace(/\n/g, ''))
							response.end()
						})
				})
		}
		else if (fileExtension === 'js') {

			fs.readFile(__dirname + '/js/index.js', 'utf8', function (err, file) {

				if (!err) {
					response.writeHead(200, {"Content-Type": "application/x-javascript"})
					response.write(file, "utf8")
				}
				else {
					response.writeHead(500, {"Content-Type": "text/plain"})
					response.write(err + "\n")
				}

				response.end()
			})
		}
		else {

			fs.exists(filename, function (exists) {

				if (exists) {

					if (fs.statSync(filename).isDirectory()) {

						markdown = fs.readFileSync(mdPath, 'utf8')
						tokens = marked.lexer(markdown)

						var previousLevel = 0

						tokens.forEach(function (token) {

							if (token.type === 'heading') {

								var diff = token.depth - previousLevel

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
							if(token.type === 'code')
								stats.code++
							if(token.type === 'table')
								stats.tables++
							if(token.type === 'paragraph'){

								stats.paragraphs++

								// Omit paragraph if it only contains an image
								if(token.text.match(/^!\[.*]\(.+\)$/g))
									stats.paragraphs--
							}

						})

						toc.push('</ul>')

						function wordFilter(n){
							return n !== '' && n.length !== 1
						}


						marked(markdown, {}, function (err, content) {

							if (err) throw err

							data.title = 'Mardow'
							data.toc = toc.join('')
							data.content = content

							data.lines = markdown.split(/\n/g).filter(function(n){return n !== ''}).length
							data.allLines = markdown.split('\n').length
							data.words = markdown.split(/\s/g).filter(wordFilter).length
							data.allWords = markdown.split(/\s/g).filter(function(n){return n !== ''}).length
							data.chars = markdown.length
							data.images = markdown.match(/!\[.*]\(.+\)/g).length
							data.code = stats.code
							data.tables = stats.tables
							data.paragraphs = stats.paragraphs
							data.math = markdown.split("´").length - 1


							template = fs.readFileSync(__dirname + '/templates/index.html', 'utf8')
							html = mustache.render(template, data)

							response.writeHead(200, {
								"Content-Type": "text/html"
							})
							response.write(html, "utf8")
							response.end()
						})
					}
					else if (fileExtension === 'png') {
						fs.readFile(filename, 'binary', function (err, file) {

							if (!err) {
								response.writeHead(200, {"Content-Type": "image/png"})
								response.write(file, "binary")
							}
							else {
								response.writeHead(500, {"Content-Type": "text/plain"})
								response.write(err + "\n")
							}

							response.end()
						})
					}
				}
				else {
					response.writeHead(404, {"Content-Type": "text/plain"})
					response.write("404 Not Found\n")
					response.end()
				}
			})
		}
	}

	http
		.createServer(server)
		.listen(3000)
}