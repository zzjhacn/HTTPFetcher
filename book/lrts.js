const {
  JSDOM
} = require('jsdom')
const $ = require('jquery')(new JSDOM('<html></html>').window)
const _ = require('lodash')

const Book = require('./book')
const utils = require('../utils/utils')

const ROOT = 'http://www.lrts.me/ajax/playlist'

class lrts extends Book {

  constructor(cfg) {
    cfg.type = 'mp3'
    cfg.url = ROOT + '/2/' + cfg.id
    cfg.charset = 'utf8'
    super(cfg)
  }

  _parseBookName(resp) {
    let root = $(`<div>${resp}</div>`)
    return root.find('.section li div span').text().trim().split('_')[1]
  }

  _parseTableOfContents(resp) {
    let root = $(`<div>${resp}</div>`)
    let chapters = []
    let max = $((root.find('.detail div span'))[1]).text().trim()
    let slf = this
    let promises = []
    for (var i = 1; i < Number(max) + 1; i++) {
      let url = this.url + '/' + i
      let num = i
      promises.push(new Promise((r) => {
        utils.HttpGetTxt(url, slf.charset, (resp) => {
          let root = $(`<div>${resp}</div>`)
          r({
            url: root.find('.section li div input').val(),
            title: `${slf.name}_第${utils.Prefix(num)}集`,
            idx: num - 1
          })
        })
      }))
    }
    return Promise.all(promises)
  }
}

module.exports = lrts
