const url = require('url')
const http = require('http')
const https = require('https')
const iconv = require('iconv-lite')
const slog = require('single-line-log').stdout
const async = require('async')

let trans = (buff, charset) => {
  return iconv.decode(buff, charset)
}

let proto = (_url) => {
  let u = url.parse(_url, true)
  return u.protocol === 'https:' ?
    https :
    http
}

let Prefix = (id, l) => {
  return ('' + (Math.pow(10, l || 4) + id)).substring(1)
}

let q = async.queue((path, cb) => {
  proto(path).get(path, (res) => {
    var fileBuff = []
    res.on('data', (chunk) => {
      fileBuff.push(new Buffer(chunk))
    })
    res.on('end', () => {
      try {
        cb(Buffer.concat(fileBuff))
      } catch (e) {
        console.error(e.message)
      }
    })
  })
}, 20)

class ProgressBar {
  constructor(description, bar_length) {
    this.description = description || 'Progress'
    this.length = bar_length || 25
  }

  render(opts) {
    let percent = (opts.completed / opts.total).toFixed(4)
    let cell_num = Math.floor(percent * this.length)

    let txt = ''
    for (var i = 0; i < cell_num; i++) {
      txt += '█'
    }

    for (var i = 0; i < this.length - cell_num; i++) {
      txt += '░'
    }

    let cmdText = `${opts.desc || this.description}: ${(100 * percent).toFixed(2)}%${txt}${opts.completed}/${opts.total}(${q.running()}/${q.length()} processors running...)`
    slog(cmdText)
  }
}

let HttpGet = (path, cb) => {
  q.push(path, cb)
}

let HttpGetTxt = (path, charset, cb) => {
  HttpGet(path, (resp) => {
    cb(trans(resp, charset))
  })
}

module.exports = {
  HttpGet,
  HttpGetTxt,
  Prefix,
  ProgressBar
}
