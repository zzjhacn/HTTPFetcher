const fs = require('fs')
const _ = require('lodash')
const async = require('async')
const exec = require('child_process').exec
const Q = require('q')

const utils = require('../utils/utils')

const STEPS = 6

class Book {

  constructor(cfg) {
    this.url = cfg.url
    this.fetchTime = cfg.fetchTime || new Date()
    this.charset = cfg.charset || 'GBK'
    this.type = cfg.type || 'txt'
    this.chapters = []
    this.replaceMap = cfg.replaceMap || {}
    this.path = cfg.path || 'books'

    let slf = this
    this._getName = cfg.name || function() {
      utils.HttpGetTxt(this.url, this.charset, (resp) => {
        return slf.parseBookName(resp)
      })
    }

    this.pb = new utils.ProgressBar('', 50)
    this._updatepb('steps - book created', 1, STEPS)
  }

  _updatepb(desc, c, t) {
    let slf = this
    this.pb.render({
      desc: `[${slf.name}]${desc}`,
      completed: c,
      total: t
    })
  }

  _init(name) {
    this.name = name
    this.path = `${this.path}/${this.name}`
    this.indexPath = `${this.path}/index.json`
    this.chapterDir = `${this.path}/chapters/`
    if (this.type === 'txt') {
      this.allInOnePath = `${this.path}/${this.name}合集.txt`
    }
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path)
      fs.mkdirSync(this.chapterDir)
    }
    if (fs.existsSync(this.indexPath)) {
      this.chapters = require('../' + this.indexPath).chapters
    }
  }

  fetch() {
    let slf = this

    Q(slf._getName)
      .then((name) => {
        slf._updatepb('steps - name fetched', 2, STEPS)
        return Q(slf._init(name))
      })
      .then(() => {
        slf._updatepb('steps - inited', 3, STEPS)
        return slf._fetchTableOfContents()
      })
      .then(() => {
        slf._updatepb('steps - table of contents done', 4, STEPS)
        return slf._fetchChapters()
      })
      .then(() => {
        slf._updatepb('steps - contents done', 5, STEPS)
        slf._doPost()
        slf._updatepb('steps - all done', 6, STEPS)
        console.log(`\n${slf.name} fetched`)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  _fetchTableOfContents() {
    let slf = this
    let def = Q.defer()
    utils.HttpGetTxt(this.url, this.charset, (resp) => {
      Q(slf._parseTableOfContents(resp))
        .then((toc) => {
          _.each(toc, (chapter) => {
            if (_.find(slf.chapters, {
                url: chapter.url
              })) {
              return
            }
            chapter.idx = slf.chapters.length
            chapter.path = `books/${slf.name}/chapters/${utils.Prefix(chapter.idx)}_${chapter.title}.${slf.type}`
            slf.chapters.push(chapter)
          })
          fs.writeFile(slf.indexPath, JSON.stringify(slf, null, 2), () => {})
          def.resolve()
        })
    })
    return def.promise
  }

  _fetchChapters() {
    let slf = this
    let total = this.chapters.length
    let completed = 0
    let promises = []
    _.each(this.chapters, (chapter) => {
      if (chapter.fetched === true) {
        ++completed
        return
      }
      if (slf.type === 'txt') {
        promises.push(new Promise((r) => {
          utils.HttpGetTxt(chapter.url, slf.charset, (resp) => {
            slf._doWithContent(chapter, slf._parseContent(chapter, resp))
            slf._updatepb('fetching', ++completed, total)
            r()
          })
        }))
      } else {
        promises.push(new Promise((r) => {
          utils.HttpGet(chapter.url, (resp) => {
            slf._doWithContent(chapter, resp)
            slf._updatepb('fetching', ++completed, total)
            r()
          })
        }))
      }
    })
    return Q.all(promises)
  }

  _doWithContent(chapter, content) {
    fs.writeFile(chapter.path, content, () => {})
    chapter.fetched = true
  }

  _doPost() {
    fs.writeFile(this.indexPath, JSON.stringify(this, null, 2), () => {})
    if (this.allInOnePath) {
      exec(`cat ${this.chapterDir}/* > ${this.allInOnePath}`)
    }
  }
}

module.exports = Book
