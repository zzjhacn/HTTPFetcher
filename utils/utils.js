const url = require('url')
const http = require('http')
const https = require('https')
const iconv = require('iconv-lite')

let trans = (rawData, charset) => {
  return iconv.decode(Buffer.concat([Buffer.from(rawData, 'utf16le')]), charset)
}

let proto = (_url) => {
  let u = url.parse(_url, true)
  return u.protocol === 'https:' ?
    https :
    http
}

let fetch = (path, charset, cb) => {
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

module.exports = {
  fetch
}
