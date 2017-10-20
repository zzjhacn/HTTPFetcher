const {
  JSDOM
} = require('jsdom')
const $ = require('jquery')(new JSDOM('<html></html>').window)
const _ = require('lodash')
const Book = require('../book')

const ROOT = 'http://www.biqumo.com'


const biqumoReplaceMap = {
  '天才壹秒.*?\n': '',
  '天才一秒.*m.biqumo.com': '',
  '手机用户.*m.biqumo.com': '',
  '【.*?】': '',
  ' ': ''
}

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

  parseBody(chapter, resp, replaceMap) {
    let root = $(resp)
    let ctx = root.find('.content .showtxt').text().trim()
    let map = _.extend(biqumoReplaceMap, replaceMap)
    _.each(map, (v, k) => {
      ctx = ctx.replace(new RegExp(k, 'g'), replaceMap[v]||'')
    })
    return '\n\n' + chapter.title + '\n\n' + ctx
  }
}

module.exports = biqumo;
