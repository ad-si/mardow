/* globals jQuery, infoObj */

const doc = window.document
const headings = doc.querySelectorAll("h1,h2,h3,h4,h5,h6")
const map = {
  h1: "ul ul",
  h2: "ul ul ul",
  h3: "ul ul ul ul",
  h4: "ul ul ul ul ul",
  h5: "ul ul ul ul ul ul",
  h6: "ul ul ul ul ul ul ul",
}


for (let levels = 1; levels <= 6; levels++) {
  const button = doc.createElement("button")

  button.appendChild(doc.createTextNode("h" + levels))
  button.addEventListener("click", (event) => {
    event.preventDefault()

    Array
      .from(doc.querySelectorAll("aside ul"))
      .forEach(list => list.style.display = "inherit")

    Array
      .from(
        doc.querySelectorAll("aside " + map[event.target.textContent]),
      )
      .forEach(list => list.style.display = "none")
  })

  document
    .querySelector("#toc menu")
    .appendChild(button)
}


// headings is levels NodeList => forEach not possible
for (let index = 0; index < headings.length; index++) {
  const $heading = jQuery(headings[index])

  $heading
    .prepend('<span class="fa fa-link"></span>')
    .attr("id", $heading[0].id)
    .find("span")
    .click(() => {
      doc.location.hash = $heading[0].id
    })
}


jQuery("article img")
  .each((index, image) => {
    const figure = jQuery(
      `<figure><figcaption>
        ${image.alt}
      </figcaption></figure>`,
    )

    jQuery(image)
      .after(figure)

    jQuery(image)
      .prependTo(figure)
  })

document
  .getElementById("display-info")
  .addEventListener("click", () => {
    alert(
      [
        `Paragraphs: ${infoObj.paragraphs}`,
        `Lines: ${infoObj.lines}`,
        `  Lines (including empty lines): ${infoObj.allLines}`,
        `Words: ${infoObj.words}`,
        `  Words (including one-character words): ${infoObj.allWords}`,
        `Characters: ${infoObj.chars}`,
        "",
        `Images: ${infoObj.images}`,
        `Tables: ${infoObj.tables}`,
        `Code snippets: ${infoObj.code}`,
        `Math formulas: ${infoObj.math}`,
      ]
        .join("\n"),
    )
  })

document
  .getElementById("toggle-sidebar")
  .addEventListener("click", () => {
    const toc = doc.querySelector("#toc")
    const style = window.getComputedStyle(toc)

    toc.style.display = style.display === "none"
      ? "inline-block"
      : "none"
  })


// Add outlines when tab key is used (accessibility improvement)
document.body.addEventListener("keyup", event => {
  const tabKey = 9
  if (event.which === tabKey) {
    document
      .getElementById("wrapcontent")
      .classList
      .remove("no-focus-outline")
  }
})


// Highlight active sidebar link when clicking on TOC links or heading anchors
function updateActiveTocLink () {
  // Remove active class from all TOC links
  doc
    .querySelectorAll("#toc a")
    .forEach(link => {
      link.classList.remove("active")
    })

  // Get current hash (without the #)
  const hash = window.location.hash.substring(1)

  if (hash) {
    // Find and highlight the corresponding TOC link
    const activeLink = doc.querySelector(`#toc a[href="#${hash}"]`)
    if (activeLink) {
      activeLink.classList.add("active")
    }
  }
}

// Wait for DOM to be fully loaded before initializing
if (doc.readyState === "loading") {
  doc.addEventListener("DOMContentLoaded", updateActiveTocLink)
}
else {
  // DOM is already loaded
  updateActiveTocLink()
}

// Update active link when hash changes (clicking TOC links or heading icons)
window.addEventListener("hashchange", updateActiveTocLink)

