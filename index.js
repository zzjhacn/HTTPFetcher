const book = require('./book')
const _ = require('lodash')
// const tasks = require('./task.json')

const tasks = {
  "biqumo": [{
    "id": "3_3407",
    "name": "天影2",
    "replaceMap": {
      "6尘": "陆尘"
    }
  }],
  "lrts": [{
    "id": "229",
    "name": "货币战争2"
  }]
}


// format of task.json
// {
//   site:[
//     ...bookConfigs
//   ]
// }
// format of bookConfigs
// {
//   id: '',
//   name: '',
//   replaceMap: {
//     src: tgt
//   }
// }
_.each(tasks, (books, site) => {
  _.each(books, (bookConfig) => {
    new book[site](bookConfig).fetch()
  })
})


// new book.lrts({
//   "id": "229",
//   "name": "货币战争2"
// }).fetch()
// new book.biqumo(tasks.biqumo[0]).fetch()
