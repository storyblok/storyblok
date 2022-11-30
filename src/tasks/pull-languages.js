const fs = require('fs')
const chalk = require('chalk')

/**
 * @method pullLanguages
 * @param  {Object} api
 * @param  {Object} options { space: Number }
 * @return {Promise<Object>}
 */
const pullLanguages = async (api, options) => {
  const { space } = options

  try {
    const options = await api.getSpaceOptions()
    const languages = {
      default_lang_name: options.default_lang_name,
      languages: options.languages
    }

    const file = `languages.${space}.json`
    const data = JSON.stringify(languages, null, 2)

    console.log(`${chalk.green('✓')} We've saved your languages in the file: ${file}`)

    fs.writeFile(`./${file}`, data, (err) => {
      if (err) {
        Promise.reject(err)
        return
      }

      Promise.resolve(file)
    })
  } catch (e) {
    console.error(`${chalk.red('X')} An error ocurred in pull-languages task when load components data`)
    return Promise.reject(new Error(e))
  }
}

module.exports = pullLanguages
