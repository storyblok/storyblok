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

  return new Promise((resolve, reject) => {
    api.get('components', (res) => {
      if (res.status !== 200) {
        console.log(chalk.red('X') + 'An error ocurred in pull-components task')
        console.log(res.body)
        reject(res.body)
        return
      }

      const file = `components.${space}.json`
      const data = JSON.stringify(res.body, null, 2)

      console.log(`${chalk.green('✓')} We've saved your components in the file: ${file}`)

      fs.writeFile(`./${file}`, data, err => {
        if (err) {
          reject(err)
          return
        }

        resolve(file)
      })
    })
  })
}

module.exports = pullComponents
