const book = require('./book')
const _ = require('lodash')
const tasks = require('./task.json')

/**
 * @example
 * // format of task.json
 * {
 *   site:[
 *    ...bookConfigs
 *    ]
 *  }
 *
 * @example
 * // format of bookConfigs
 *  {
 *    id: '',
 *    name: '',
 *    replaceMap: {
 *      src: tgt
 *    }
 *  }
 */
_.each(tasks, (books, site) => {
  _.each(books, (bookConfig) => {
    new book[site](bookConfig).fetch()
  })
})
