const url = require('url')
const http = require('http')
const https = require('https')
const iconv = require('iconv-lite')
const slog = require('single-line-log').stdout
const async = require('async')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const max_processors = 20

let trans = (buff, charset) => {
  if (buff === null) {
    return null
  }
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
  // console.log(`requesting ${path}`)
  let req = proto(path).get(path, (res) => {
    var fileBuff = []
    res
      .on('data', (chunk) => {
        fileBuff.push(new Buffer(chunk))
      })
      .on('end', () => {
        try {
          cb(Buffer.concat(fileBuff))
        } catch (e) {
          // cb(null)
          // console.error(e)
        }
      })
      .on('error', e => {
        // console.log('resp meet error')
        // console.error(e)
        cb(null)
        // throw e
      })
  })
  req.on('error', (e) => {
    // console.log('req meet error')
    // console.error(e)
    cb(null)
    // throw new Error(e)
  })
}, max_processors)

q.error = (e, t) => {
  // console.error('q meet error')
  // console.log(t)
  // console.error(e)
}

class ProgressBar {
  constructor(description, bar_length) {
    this.description = description || 'Progress'
    this.length = bar_length || 25
    this.max = this.length
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

    let cmdText = `${opts.desc || this.description}: ${(100 * percent).toFixed(2)}%${txt}${opts.completed}/${opts.total} (${q.running()}/${q.length()} tasks running...)`
    this.max = Math.max(this.max, cmdText.length)

    slog(_.padEnd(cmdText, this.max, ' '))
    // console.log(cmdText)
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

let ChkDirs = (dir, cb) => {
  fs.exists(dir, function(exists) {
    if (exists) {
      cb()
    } else {
      ChkDirs(path.dirname(dir), () => {
        fs.mkdir(dir, cb)
      })
    }
  })
}

let ChkDirsSync = (dir) => {
  if (fs.existsSync(dir)) {
    return true
  } else {
    if (ChkDirsSync(path.dirname(dir))) {
      fs.mkdirSync(dir)
      return true
    }
  }
}

let Exception = (e) => {
  console.error(e)
}

module.exports = {
  HttpGet,
  HttpGetTxt,
  Prefix,
  ProgressBar,
  ChkDirsSync,
  ChkDirs,
  Exception
}
