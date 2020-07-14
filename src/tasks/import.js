const chalk = require('chalk')
const fs = require('fs')
const csvReader = require('fast-csv')

/**
 * @method importData
 * @param options - Array with arguments, [Name of the file, Type of content, Folder ID, Delimiter (For csv files)]
 * @param api - Pass the api instance as a parameter
 * @return {Promise}
 */

const readAndLoadCsv = async (stream, typeOfContent, api, folderID = 0, delimiter = ';') => {
  console.log()
  console.log(chalk.green('✓') + ' Reading file... ')
  console.log()

  csvReader.parseStream(stream, { headers: true, delimiter: delimiter })
    .on('error', error => console.error(error))
    .on('data', line => {
      const sourceStory = {
        slug: line.path,
        name: line.title,
        parent_id: folderID,
        content: {
          component: typeOfContent,
          title: line.title,
          text: line.text,
          image: line.image,
          category: line.category
        }
      }

      api.getClient()
        .post(`spaces/${api.spaceId}/stories`, { story: sourceStory })
        .then(res => {
          console.log(chalk.green('✓') + ` ${res.data.story.name} was created `)
        })
        .catch(err => Promise.reject(err))
    })
}

const importData = async (options, api) => {
  const {
    file,
    type,
    folder,
    delimiter
  } = options

  const dataFromFile = fs.createReadStream(file)
  await readAndLoadCsv(dataFromFile, type, api, folder, delimiter)

  return
}

module.exports = importData
