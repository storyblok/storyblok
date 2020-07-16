const chalk = require('chalk')
const fs = require('fs')
const {
  readAndLoadCsv,
  readAndLoadXml,
  readAndLoadJson,
  isCsv,
  isJson,
  isXml
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

  let extensionOfFile = file.split('.')
  extensionOfFile = extensionOfFile[extensionOfFile.length - 1]

  if (isCsv(extensionOfFile)) {
    const stream = fs.createReadStream(file)
    return await readAndLoadCsv(stream, type, api, folder, delimiter)
  } else if (isXml(extensionOfFile)) {
    const dataFromFile = fs.readFileSync(file)
    return await readAndLoadXml(dataFromFile, type, api, folder)
  } else if (isJson(extensionOfFile)) {
    const dataFromFile = fs.readFileSync(file, 'utf-8')
    return await readAndLoadJson(dataFromFile, type, api, folder)
  } else {
    console.log(chalk.red('X') + ' The file extension is not supported. ')
  }
}

module.exports = importFiles
