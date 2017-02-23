# Mardow

The ultimate markdown viewer.


## Installation

```sh
npm install --global mardow
```


## Get Started

```sh
mardow --help
```


## Features

- Uses [marked](https://github.com/chjj/marked) to convert markdown to html
- The acute accent is used to mark asciimath parts
  which will get rendered by MathJax.
  So e.g. ´f(x) = 1/x^2´ will get rendered with the proper math layout.
  (**Attention**: Make sure to escape ambiguous characters
  like "_" from the markdown parser with a backslash "\\")
