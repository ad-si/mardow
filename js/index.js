!function (window, document) {

	var links = document.querySelectorAll('aside a'),
		headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6'),
		images = document.querySelectorAll('article img'),
		i,
		a,
		map = {
			h1: 'ul ul',
			h2: 'ul ul ul',
			h3: 'ul ul ul ul',
			h4: 'ul ul ul ul ul',
			h5: 'ul ul ul ul ul ul',
			h6: 'ul ul ul ul ul ul ul'
		}

	for (a = 1; a <= 6; a++)
		!function () {

			var button = document.createElement('button')

			button.appendChild(document.createTextNode('h' + a))
			button.addEventListener('click', function () {

				var lists = document.querySelectorAll('aside ' + map[this.textContent]),
					allLists = document.querySelectorAll('aside ul')

				for (i = 0; i < allLists.length; i++)
					allLists[i].style.display = 'inherit'

				for (i = 0; i < lists.length; i++)
					lists[i].style.display = 'none'
			})

			document
				.querySelector('#toc menu')
				.appendChild(button)

		}()


	for (i = 0; i < headings.length; i++) {

		headings[i].id = headings[i]
			.textContent
			.toLowerCase()
			.replace(/\s/g, '-')
	}


	for (i = 0; i < links.length; i++) {

		links[i].addEventListener('click', function () {

			location.hash = this
				.textContent
				.toLowerCase()
				.replace(/\s/g, '-')
		})
	}

	console.time('Replace img with figure')

	$('article img').each(function () {

		var figure = $('<figure><figcaption>' + this.alt +'</figcaption></figure>')

		$(this).after(figure)
		$(this).prependTo(figure)
	})

	console.timeEnd('Replace img with figure')

	document
		.querySelector('#toolbar .info')
		.addEventListener('click', function () {

			var chars = document
				.querySelector('article')
				.innerHTML
				.length

			alert(
				'Paragraphs:\t\t\t\t\t\t' + info.paragraphs + '\n' +
					'Lines:\t\t\t\t\t\t\t' + info.lines + '\n' +
					'Lines (inclusive empty new lines):\t\t' + info.allLines + '\n' +
					'Words:\t\t\t\t\t\t\t' + info.words + '\n' +
					'Words (inclusive one-character words):\t' + info.allWords + '\n' +
					'Characters:\t\t\t\t\t\t' + info.chars + '\n' +
					'\n' +
					'Images:\t\t\t\t\t\t\t' + info.images + '\n' +
					'Tables:\t\t\t\t\t\t\t' + info.tables + '\n' +
					'Code Snippets:\t\t\t\t\t\t' + info.code + '\n' +
					'Math formulas:\t\t\t\t\t\t' + info.math
			)
		})


}(window, document)