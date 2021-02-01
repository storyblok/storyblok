const chalk = require('chalk')
const {
  convertFile,
  sendContent,
  discoverExtension
} = require('./utils')

/**
 * @typedef {Object} ImportDataOptions
 * @property {string} type Type of content
 * @property {string} folder Folder ID
 * @property {string} delimiter Delimiter (For csv files)
 * @property {string} file path to file
 *
 * @method importData
 * @param {Object} api - Pass the api instance as a parameter
 * @param {ImportDataOptions} options
 * @return {Promise}
 */
const importFiles = async (api, options) => {
  const { file } = options

  if (!api) {
    console.log(chalk.red('X') + 'Api instance is required to make the request')
    return []
  }

  try {
    const extension = discoverExtension(file)
    const dataFromFile = await convertFile(file, extension, options)

    await sendContent(api, dataFromFile)
  } catch (e) {
    console.log(
      `${chalk.red('X')} An error ocurrend when process file and send it ${e.message}`
    )
    return Promise.reject(e)
  }
}
module.exports = importFiles
