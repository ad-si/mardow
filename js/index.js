const jQuery = require('jquery')
const hljs = require('hljs')

const links = document.querySelectorAll('aside a')
const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6')
// const images = document.querySelectorAll('article img')
const map = {
  h1: 'ul ul',
  h2: 'ul ul ul',
  h3: 'ul ul ul ul',
  h4: 'ul ul ul ul ul',
  h5: 'ul ul ul ul ul ul',
  h6: 'ul ul ul ul ul ul ul',
}

function convertToSlug (text) {
  // TODO: Combining characters / Unicode normalisation
  /* eslint-disable id-length */
  const dict = {
    ä: 'ae',
    ö: 'oe',
    ü: 'ue',
    ß: 'ss',
  }
  /* eslint-enable */

  return String(text)
    .toLowerCase()
    .split('')
    .map(character => dict[character] || character)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^\w-]+/g, '')
}

for (let levels = 1; levels <= 6; levels++) {
  const button = document.createElement('button')

  button.appendChild(document.createTextNode('h' + levels))
  button.addEventListener('click', () => {
    const lists = document.querySelectorAll('aside ' + map[this.textContent])
    const allLists = document.querySelectorAll('aside ul')

    for (let index = 0; index < allLists.length; index++) {
      allLists[index].style.display = 'inherit'
    }
    for (let index = 0; index < lists.length; index++) {
      lists[index].style.display = 'none'
    }
  })

  document
    .querySelector('#toc menu')
    .appendChild(button)

}


// headings is levels NodeList => forEach not possible
for (let index = 0; index < headings.length; index++) {
  // TODO: Prevent id-collisions
  const $heading = jQuery(headings[index])

  $heading
    .prepend('<span class="glyphicon glyphicon-link"></span>')
    .attr('id', convertToSlug($heading.text()))
    .find('span')
    .click(() => {
      document.location.hash = this.parentNode.id
    })
}


for (let index = 0; index < links.length; index++) {
  links[index].addEventListener('click', function () {
    location.hash = convertToSlug(this.textContent)
  })
}

jQuery('article img')
  .each(() => {
    const figure = jQuery(
      `<figure><figcaption>
        ${this.alt}
      </figcaption></figure>`
    )

    jQuery(this)
      .after(figure)

    jQuery(this)
      .prependTo(figure)
  })

document
  .querySelector('#toolbar .info')
  .addEventListener('click', () => {
    const infoObj = {}
    alert(
      `Paragraphs:${'\t'.repeat(6)}${infoObj.paragraphs}
      Lines:${'\t'.repeat(7)}${infoObj.lines}
      Lines (inclusive empty new lines):${'\t'.repeat(2)}${infoObj.allLines}
      Words:${'\t'.repeat(7)}${infoObj.words}
        Words (inclusive one-character words):\t${infoObj.allWords}
      Characters:\t\t\t\t\t\t${infoObj.chars}

      Images:${'\t'.repeat(7)}${infoObj.images}
      Tables:${'\t'.repeat(7)}${infoObj.tables}
      Code Snippets:${'\t'.repeat(6)}${infoObj.code}
      Math formulas:${'\t'.repeat(6)}${infoObj.math}`
    )
  })

document
  .querySelector('#toolbar .th-list')
  .addEventListener('click', () => {
    const toc = document.querySelector('#toc')
    const style = window.getComputedStyle(toc)

    toc.style.display = style.display === 'none'
      ? 'inline-block'
      : 'none'
  })

hljs.initHighlighting()
