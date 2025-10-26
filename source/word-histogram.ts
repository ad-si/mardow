interface WordEntry {
  nr: number
  word: string
  count: number
}

export default function wordHistogram (words: string[]): WordEntry[] {
  const histogram: WordEntry[] = []
  const dict: Record<string, number> = {}
  let index = 1

  words.forEach((word: string) => {
    if (Object.hasOwn(dict, word)) {
      dict[word] = Number(dict[word]) + 1
    }
    else {
      dict[word] = 1
    }
  })


  for (const word in dict) {
    if (Object.hasOwn(dict, word)) {
      const count = dict[word]
      if (count !== undefined) {
        histogram.push({
          nr: index,
          word,
          count,
        })

        index++
      }
    }
  }

  histogram
    .sort((valueA: WordEntry, valueB: WordEntry) => {
      return valueA.count - valueB.count
    })

  return histogram
}
