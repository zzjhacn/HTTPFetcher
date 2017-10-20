const biqumo = require('./biqumo/')
const _ = require('lodash')
const async = require('async')

const biqumoList = require('./.biqumo.list.json')

let start = new Date()
let q = async.queue((b, cb) => {
  b.start = new Date()
  new biqumo(b.id, b.name).fetch(b.replaceMap || {})
  cb()
}, 1)

_.each(biqumoList, (b) => {
  q.push(b, () => {})
})
