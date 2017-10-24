const {
  JSDOM
} = require('jsdom')
const $ = require('jquery')(new JSDOM('<html></html>').window)
const _ = require('lodash')

const Book = require('./book')

const ROOT = 'http://www.biqumo.com'
const biqumoReplaceMap = {
  '天才壹秒.*?\n': '',
  '天才一秒.*m.biqumo.com': '',
  '手机用户.*m.biqumo.com': '',
  '【.*?】': '',
  ' ': ''
}

class biqumo extends Book {

  constructor(cfg) {
    cfg.url = ROOT + '/' + cfg.id + '/'
    cfg.path = 'books/biqumo'
    super(cfg)
  }

  _parseBookName(resp) {
    let root = $(resp)
    return root.find('dt').text().trim()
  }

  _parseTableOfContents(resp) {
    let root = $(resp)
    let chapters = []
    let idx = 0;
    root.find('dd a').each(function() {
      chapters.push({
        url: ROOT + $(this).prop('href'),
        title: $(this).text(),
        idx: idx++
      })
    })
    return chapters
  }

  _parseContent(chapter, resp) {
    let root = $(resp)
    let ctx = root.find('.content .showtxt').text().trim()
    let map = _.extend(biqumoReplaceMap, this.replaceMap || {})
    _.each(map, (v, k) => {
      ctx = ctx.replace(new RegExp(k, 'g'), v)
    })
    return ctx
  }

  _doWithContent(chapter, content) {
    super._doWithContent(chapter, chapter.title + '\n\n' + content)
  }
}

module.exports = biqumo;
