const fs = require('fs')
const chalk = require('chalk')

/**
 * @method pullComponents
 * @param  {Object} api
 * @param  {Object} options { space: Number }
 * @return {Promise<Object>}
 */
const pullComponents = (api, options) => {
  const { space } = options

  return api
    .getComponents()
    .then(components => {
      const file = `components.${space}.json`
      const data = JSON.stringify({ components }, null, 2)

      console.log(`${chalk.green('✓')} We've saved your components in the file: ${file}`)

      fs.writeFile(`./${file}`, data, err => {
        if (err) {
          Promise.reject(err)
          return
        }

        Promise.resolve(file)
      })
    })
    .catch(err => {
      console.error(`${chalk.red('X')} An error ocurred in pull-components task when load components data`)
      return Promise.reject(new Error(err))
    })
}

module.exports = pullComponents
