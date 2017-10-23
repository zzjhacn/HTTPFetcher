const {
  JSDOM
} = require('jsdom')
const $ = require('jquery')(new JSDOM('<html></html>').window)
const _ = require('lodash')
const Book = require('../book')
const {
  exec
} = require('child_process')

const ROOT = 'http://www.lrts.me/ajax/playlist'

class lrts extends Book {

  constructor(type, path, name) {
    super(ROOT + '/' + type + '/' + path, name, 'utf8')
  }

  parseTitle(resp) {
    let root = $(`<div>${resp}</div>`)
    return root.find('.section li div span').text().trim().split('_')[1]
  }

  title(i) {
    let prefix = ('' + (10000 + i)).substring(1)
    return this.name + '_第' + prefix + '集'
  }

  parseMenu(resp) {
    let root = $(`<div>${resp}</div>`)
    let menus = []
    let max = $((root.find('.detail div span'))[1]).text().trim()
    for (var i = 1; i < Number(max) + 1; i++) {
      menus.push({
        url: this.url + '/' + i,
        title: this.title(i),
        idx: i - 1
      })
    }
    return menus
  }

  parseBody(chapter, resp, replaceMap) {
    let root = $(`<div>${resp}</div>`)
    let ctx = root.find('.section li div input').val()
    chapter.r_url = ctx
    let cmd = ' wget ' + ctx + ' -O ' + this.chapterDir() + chapter.title + '.mp3 \n'
    // exec(cmd)
    return cmd
  }

  doPost() {
    // let cmd = 'sh ' + this.allInOnePath()
    // exec(cmd)
  }
}

module.exports = lrts
