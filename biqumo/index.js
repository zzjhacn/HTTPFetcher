const {
  JSDOM
} = require('jsdom')
const $ = require('jquery')(new JSDOM('<html></html>').window)
const _ = require('lodash')
const Book = require('../book')

const ROOT = 'http://www.biqumo.com'

class biqumo extends Book {

  constructor(path, name) {
    super(ROOT + '/' + path + '/', name)
  }

  parseTitle(resp) {
    let root = $(resp)
    return root.find('dt').text().trim()
  }

  parseMenu(resp) {
    let root = $(resp)
    let menus = []
    let idx = 0;
    root.find('dd a').each(function() {
      menus.push({
        url: ROOT + $(this).prop('href'),
        title: $(this).text(),
        idx: idx++
      })
    })
    return menus
  }

  parseBody(chapter, resp) {
    let root = $(resp)
    let ctx = root.find('.content .showtxt').text().trim()
    ctx = ctx.replace(/6尘/g, '陆尘').replace(/天才壹秒.*?\n/gm, '').replace(/天才一秒.*?\n/g, '').replace(/天才一秒.*m.biqumo.com/gm, '').replace(/手机用户.*m.biqumo.com/gm, '').replace(/【.*?】/gm, '').replace(/ /g, '')
    return '\n\n' + chapter.title + '\n\n' + ctx
  }
}

module.exports = biqumo;
