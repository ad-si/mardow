var marked = require('marked'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    mustache = require('mustache'),
    http = require('http'),
    stylus = require('stylus')


/** Please stop reading!
 * This is the ugliest code I've ever written.
 * I don't want anybody to see it! ^^
 */


marked.setOptions({
	breaks: true,
	sanitize: false,
	langPrefix: 'lang-'
})

module.exports = function (mdPath, port) {

	var data = {},
	    template,
	    markdown,
	    html,
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
		    toc = [],
		    firstHeading = false

		if (fileExtension === 'css') {

			fs.readFile(
					__dirname + '/styl/screen.styl',
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
								"Content-Type": "text/css"
							})
							response.write(css.replace(/\n/g, ''))
							response.end()
						})
				})
		}
		else if (fileExtension === 'js') {

			fs.readFile(filename, 'utf8', function (err, file) {

				if (err) {
					response.writeHead(500, {"Content-Type": "text/plain"})
					response.write(err + "\n")
				}
				else {
					response.writeHead(200, {"Content-Type": "application/x-javascript"})
					response.write(file, "utf8")
				}

				response.end()
			})
		}
		else if (fileExtension === 'png' ||
		         fileExtension === 'gif' ||
		         fileExtension === 'jpeg' ||
		         fileExtension === 'jpg') {

			fs.readFile(path.dirname(mdPath) + uri, function (err, file) {

				if (err) {
					response.writeHead(500, {"Content-Type": "text/plain"})
					response.write(err + "\n")
					response.end()
				}
				else {
					response.writeHead(200, {"Content-Type": "image/" + fileExtension})
					response.end(file, 'binary')
				}
			})
		}
		else {

			fs.exists(filename, function (exists) {

				if (!exists) {
					response.writeHead(404, {"Content-Type": "text/plain"})
					response.write("404 Not Found\n")
				}
				else {

					if (fs.statSync(filename).isDirectory()) {

						markdown = fs.readFileSync(mdPath, 'utf8')
						tokens = marked.lexer(markdown)

						var previousLevel = 0

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

						function wordFilter (n) {
							return n !== '' && n.length !== 1
						}

						function removePunctuation (word) {
							return word.replace(/['";:,.\/?\\-]/g, '')
						}

						function wordHistogram (words) {

							var histogram = [],
							    dict = {},
							    i = 1

							words.forEach(function (word) {

								if (dict.hasOwnProperty(word))
									dict[word] = Number(dict[word]) + 1
								else
									dict[word] = 1
							})


							for (var word in dict)
								if (dict.hasOwnProperty(word)) {
									histogram.push({
										nr: i,
										word: word,
										count: dict[word]
									})

									i++
								}

							histogram
								.sort(function (a, b) {
									return a.count - b.count
								})

							return histogram
						}


						marked(markdown, {}, function (err, content) {

							if (err) throw err

							var images = markdown.match(/!\[.*]\(.+\)/g),
							    words = markdown
								    .split(/\s/g)
								    .filter(wordFilter)
								    .map(removePunctuation)

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
							data.math = markdown.split("´").length - 1


							template = fs.readFileSync(__dirname +
							                           '/templates/index.html', 'utf8')
							html = mustache.render(template, data)

							response.writeHead(200, {
								"Content-Type": "text/html"
							})
							response.write(html, "utf8")
						})
					}
					else if (fileExtension === 'png' || fileExtension === 'jpg') {
						fs.readFile(filename, 'binary', function (err, file) {

							if (!err) {
								response.writeHead(200, {"Content-Type": "image/png"})
								response.write(file, "binary")
							}
							else {
								response.writeHead(500, {"Content-Type": "text/plain"})
								response.write(err + "\n")
							}
						})
					}
				}

				response.end()
			})
		}
	}

	http
		.createServer(server)
		.listen(port)
}
