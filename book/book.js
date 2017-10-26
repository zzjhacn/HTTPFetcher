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
    this.serial = cfg.serial || false
    this.charset = cfg.charset || 'GBK'
    this.type = cfg.type || 'txt'
    this.chapters = []
    this.replaceMap = cfg.replaceMap || {}
    this.path = cfg.path || 'books'
    this.name = cfg.name || ''

    let slf = this
    this._getName = cfg.name || function() {
      utils.HttpGetTxt(this.url, this.charset, (resp) => {
        return slf.parseBookName(resp)
      })
    }

    this.logs = []

    this.pb = new utils.ProgressBar('', 50)
    this._updatepb('steps - book created', 1, STEPS)
  }

  _updatepb(desc, c, t) {
    let slf = this
    this.pb.render({
      desc: `[${slf.name || ''}]${desc}`,
      completed: c,
      total: t
    })
  }

  _init(name) {
    this.name = name
    this.path = `${this.path}/${this.name}`
    this.indexPath = `${this.path}/index.json`
    this.logPath = `${this.path}/log.log`
    this.chapterDir = `${this.path}/chapters/`
    if (this.type === 'txt') {
      this.allInOnePath = `${this.path}/${this.name}合集.txt`
    }
    utils.ChkDirsSync(this.chapterDir)
    if (fs.existsSync(this.indexPath)) {
      let curr
      try {
        curr = require('../' + this.indexPath)
      } catch (e) {
        this.chapters = []
      }
      if (curr.finished === true) {
        console.log(`[${this.name}] already finished`)
        throw new Error('already finished')
      }
      this.chapters = curr.chapters
    }
  }

  _log(log) {
    this.logs.push({time: new Date(), msg: log})
  }

  _err() {
    return (e) => {
      this._log(e)
    }
  }

  fetch() {
    let slf = this

    Q(slf._getName).then((name) => {
      slf._updatepb('steps - name fetched', 2, STEPS)
      return Q(slf._init(name))
    }).then(() => {
      slf._updatepb('steps - inited', 3, STEPS)
      return slf._fetchTableOfContents()
    }).then(() => {
      slf._updatepb('steps - table of contents done', 4, STEPS)
      return slf._fetchChapters()
    }).then(() => {
      slf._updatepb('steps - contents done', 5, STEPS)
      slf._doPost()
      slf._updatepb('steps - all done', 6, STEPS)
      console.log(`\n${slf.name} fetched`)
      _.each(slf.logs, l => {
        console.log(l)
      })
    }).catch(slf._err())
  }

  _fetchTableOfContents() {
    let slf = this
    let def = Q.defer()
    utils.HttpGetTxt(this.url, this.charset, (resp) => {
      if (resp === null) {
        def.reject(`[${slf.name}]fetch table of contents error`)
      } else {
        Q(slf._parseTableOfContents(resp)).then((toc) => {
          _.each(toc, (chapter) => {
            if (_.find(slf.chapters, {url: chapter.url})) {
              return
            }
            chapter.idx = slf.chapters.length
            chapter.title = chapter.title.replace(/\//g, '_').replace(/ /g, '')
            chapter.path = `${slf.chapterDir}${utils.Prefix(chapter.idx)}_${chapter.title}.${slf.type}`
            chapter.fetched = fs.existsSync(chapter.path)
            slf.chapters.push(chapter)
          })
          slf._save()
          def.resolve()
        }).catch(slf._err())
      }
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
            if (resp === null) {
              slf._log(`[${slf.name}]fetching content of ${chapter.title} meet error`)
              r()
              return
            }
            slf._doWithContent(chapter, slf._parseContent(chapter, resp))
            slf._updatepb('fetching', ++completed, total)
            r()
          })
        }))
      } else {
        promises.push(new Promise((r) => {
          utils.HttpGet(chapter.url, (resp) => {
            if (resp === null) {
              slf._log(`[${slf.name}]fetching content of ${chapter.title} meet error`)
              r()
              return
            }
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
    fs.writeFile(chapter.path, content, this._err())
    chapter.fetched = true
    this._save()
  }

  _save() {
    fs.writeFile(this.logPath, JSON.stringify(this.logs, null, 2), this._err())

    fs.writeFile(this.indexPath, JSON.stringify(this, (k, v) => {
      if (['logs', '_getName', 'pb'].indexOf(k) > -1) {
        return undefined
      }
      return v
    }, 2), this._err())
  }

  _doPost() {
    if (this.allInOnePath) {
      exec(`> ${this.allInOnePath}`)
    }
    let fail = 0
    let succ = 0
    _.each(this.chapters, c => {
      if (c.fetched === true) {
        if (!fs.existsSync(c.path)) {
          c.fetched = false
          fail++
        } else {
          succ++;
          if (this.allInOnePath) {
            exec(`cat '${c.path}' >> '${this.allInOnePath}'`)
            exec(`echo '' >> '${this.allInOnePath}'`)
            // exec(`cp ${this.chapterDir}/*  ${this.allInOnePath}`)
          }
        }
      } else {
        fail++
      }
    })
    this.finished = (this.serial === false && fail === 0)
    this._log(`[${this.name}] failed [${fail}], successed [${succ}]`)
    this._save()
  }
}

module.exports = Book
