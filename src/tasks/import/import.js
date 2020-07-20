const chalk = require('chalk')
const fs = require('fs')
const {
  csvParser,
  xmlParser,
  jsonParser,
  sendContent,
  discoverExtension
} = require('./utils')

/**
 * @method importData
 * @param options - Array with arguments, [Name of the file, Type of content, Folder ID, Delimiter (For csv files)]
 * @param api - Pass the api instance as a parameter
 * @return {Promise}
 */

const importFiles = async (api, options) => {
  const {
    file,
    type,
    folder,
    delimiter
  } = options

  if (!api) {
    console.log(chalk.red('X') + 'Api instance is required to make the request')
    return []
  }

  const extension = discoverExtension(file)
  if (extension === 'csv') {
    const dataFromFile = fs.createReadStream(file)
    const convertData = await csvParser(dataFromFile, type, folder, delimiter)
      .then(res => {
        sendContent(api, res)
      })
      .catch(err => {
        console.error(`${chalk.red('X')} An error occurred while converting the file`)
        return Promise.reject(new Error(err))
      })
    return convertData
  }
  if (extension === 'xml') {
    const dataFromFile = fs.readFileSync(file)
    const convertData = await xmlParser(dataFromFile, type, folder)
      .then(res => {
        sendContent(api, res)
      })
      .catch(err => {
        console.error(`${chalk.red('X')} An error occurred while converting the file`)
        return Promise.reject(new Error(err))
      })
    return convertData
  }
  if (extension === 'json') {
    const dataFromFile = fs.readFileSync(file, 'utf-8')
    const convertData = await jsonParser(dataFromFile, type, folder)
      .then(res => {
        sendContent(api, res)
      })
      .catch(err => {
        console.error(`${chalk.red('X')} An error occurred while converting the file`)
        return Promise.reject(new Error(err))
      })
    return convertData
  }

  console.log(chalk.red('X') + ' The file extension is not supported. ')
}
module.exports = importFiles
