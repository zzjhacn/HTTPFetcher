const url = require('url')
const http = require('http')
const https = require('https')
const iconv = require('iconv-lite')
const slog = require('single-line-log').stdout

let trans = (rawData, charset) => {
  return iconv.decode(Buffer.concat([Buffer.from(rawData, 'utf16le')]), charset)
}

let proto = (_url) => {
  let u = url.parse(_url, true)
  return u.protocol === 'https:' ?
    https :
    http
}

let HttpGet = (path, charset, cb) => {
  proto(path).get(path, (res) => {
    res.setEncoding('utf16le')
    let rawData = ''
    res.on('data', (chunk) => {
      rawData += chunk
    })
    res.on('end', () => {
      try {
        cb(trans(rawData, charset))
      } catch (e) {
        console.error(e.message)
      }
    })
  })
}

class ProgressBar {
  constructor(description, bar_length) {
    this.description = description || 'Progress'
    this.length = bar_length || 25
  }

  render(opts) {
    var percent = (opts.completed / opts.total).toFixed(4)
    var cell_num = Math.floor(percent * this.length)

    var cell = ''
    for (var i = 0; i < cell_num; i++) {
      cell += '█'
    }

    var empty = ''
    for (var i = 0; i < this.length - cell_num; i++) {
      empty += '░'
    }

    var cmdText = this.description + ': ' + (100 * percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total

    slog(cmdText)
  }
}

module.exports = {
  HttpGet,
  ProgressBar
}
