export default words => {
  const histogram = []
  const dict = {}
  let index = 1

  words.forEach(word => {
    if (Object.hasOwn(dict, word)) {
      dict[word] = Number(dict[word]) + 1
    }
    else {
      dict[word] = 1
    }
  })


  for (const word in dict) {
    if (Object.hasOwn(dict, word)) {
      histogram.push({
        nr: index,
        word,
        count: dict[word],
      })

      index++
    }
  }

  histogram
    .sort((valueA, valueB) => {
      return valueA.count - valueB.count
    })

  return histogram
}
