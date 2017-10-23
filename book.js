const fs = require('fs')
const {
  HttpGet,
  ProgressBar
} = require('./utils/utils')
const _ = require('lodash')
const async = require('async')
const {
  exec
} = require('child_process')

class Book {

  constructor(url, name, charset = 'GBK') {
    this.url = url
    this.name = name
    this.fetchTime = new Date()
    this.chapters = []
    this.charset = charset
  }

  path() {
    return `books/${this.name}`
  }

  menuPath() {
    return `books/${this.name}/menus.json`
  }

  chapterDir() {
    return `books/${this.name}/chapters/`
  }

  chapterPath(chapter) {
    let prefix = ('' + (10001 + chapter.idx)).substring(1)
    return `books/${this.name}/chapters/${prefix}${chapter.title}.txt`
  }

  allInOnePath() {
    return `books/${this.name}/${this.name}合集.txt`
  }

  parseTitle() {
    throw new Error('not impled')
  }

  parseMenu() {
    throw new Error('not impled')
  }

  parseBody() {
    throw new Error('not impled')
  }

  doPost() {

  }

  mergeMenu() {
    let slf = this
    let e = fs.existsSync(slf.menuPath())
    if (!e) {
      return
    }
    let obook
    try {
      obook = require('./' + slf.menuPath())
    } catch (e) {
      obook = {
        chapters: []
      }
    }
    let diff = _.differenceBy(slf.chapters, obook.chapters, 'url')
    slf.chapters = obook.chapters.concat(diff)
  }

  fetch(replaceMap) {
    let slf = this

    HttpGet(this.url, this.charset, (resp) => {
      slf.name = slf.name || slf.parseTitle(resp)
      if (!fs.existsSync(slf.path())) {
        fs.mkdirSync(slf.path())
        fs.mkdirSync(slf.chapterDir())
      }
      slf.chapters = slf.parseMenu(resp)
      slf.mergeMenu()
      fs.writeFile(slf.menuPath(), JSON.stringify(slf, null, 2), () => {})
      slf.fetchChapters(replaceMap)
    })
  }

  fetchChapters(replaceMap) {
    let slf = this
    let pb = new ProgressBar(this.name, 50);

    let start = new Date()
    let q = async.queue((c, cb) => {
      // console.log(`Fetching chapter[${c.idx}] <${c.title}> from url [${c.url}]. local path ${slf.chapterPath(c)}`)
      HttpGet(c.url, slf.charset, cb)
    }, 20)

    q.drain = () => {
      console.log(`\n${slf.name} done in [${(new Date() - start)}] ms`)
      fs.writeFile(slf.menuPath(), JSON.stringify(slf, null, 2), () => {})
      let cmd = 'cat ' + slf.chapterDir() + '0* > ' + slf.allInOnePath()
      exec(cmd)
      slf.doPost()
    }

    q.empty = function() {
      // console.log('\nNo more tasks wating after [' + (new Date() - start) + '] ms')
    }

    let total = 0
    let completed = 0

    _.each(slf.chapters, (c) => {
      if (c.fetched && c.fetched === true) {
        return
      }
      total++
      q.push(c, (resp) => {
        let text = slf.parseBody(c, resp, replaceMap || {})
        pb.render({
          completed: ++completed,
          total: total
        })
        fs.writeFile(slf.chapterPath(c), text, () => {})
        c.fetched = true
      })
    })
  }
}
module.exports = Book;
