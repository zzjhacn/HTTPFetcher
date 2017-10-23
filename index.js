const biqumo = require('./biqumo/')
const lrts = require('./lrts/')
const _ = require('lodash')
const async = require('async')

const tasks = require('./task.json')

let qb = async.queue((b, cb) => {
  b.start = new Date()
  new biqumo(b.id, b.name).fetch(b.replaceMap || {})
  cb()
}, 1)

_.each(tasks.biqumo, (b) => {
  qb.push(b, () => {})
})

let ql = async.queue((b, cb) => {
  b.start = new Date()
  new lrts(b.type || '2', b.id, b.name).fetch()
  cb()
}, 1)

_.each(tasks.lrts, (b) => {
  ql.push(b, () => {})
})
