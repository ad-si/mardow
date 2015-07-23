'use strict'

module.exports = function (words) {

	var histogram = [],
		dict = {},
		i = 1,
		word

	words.forEach(function (word) {

		if (dict.hasOwnProperty(word))
			dict[word] = Number(dict[word]) + 1
		else
			dict[word] = 1
	})


	for (word in dict)
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
