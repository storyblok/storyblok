const chalk = require('chalk')

/**
 * @method listSpaces
 * @param api - Pass the api instance as a parameter
 * @return {Promise}
 */

const listSpaces = async (api) => {
  console.log()
  console.log(chalk.green('✓') + ' Loading spaces...')
  console.log()

  if (!api) {
    console.log(chalk.red('X') + 'Api instance is required to make the request')
    return []
  }

  const spaces = await api.getAllSpaces()
    .then(res => res)
    .catch(err => Promise.reject(err))

  if (!spaces) {
    console.log(chalk.red('X') + ' No spaces were found for this user ')
    return []
  }

  spaces.map(space => {
    console.log(`${space.name} (id: ${space.id})`)
  })

  return spaces
}

module.exports = listSpaces
