const chalk = require('chalk')
const fs = require('fs')
const csvReader = require('fast-csv')

/**
 * @method importData
 * @param opts - Array with arguments, [Name of the file, Type of content, Folder ID]
 * @param api - Pass the api instance as a parameter
 * @return {Promise}
 */

const readCsv = async (stream, typeOfContent, folderID = 0, api, delimiter = ';') => {
  csvReader.parseStream(stream, { headers: true, delimiter: delimiter })
    .on('data', (line) => {
      const story = {
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

      return api.post(`spaces/${75070}/stories/`, { story })
        .then(res => {
          console.log(`Success: ${res.data.story.name} was created.`)
        }).catch(err => {
          console.log(`Error: ${err}`)
        })
    })
    .on('end', () => {
      return
    })
}

const importData = async (opts, api) => {
  const fileName = opts[0] || ''
  const typeOfContent = opts[1] || ''
  const folderID = opts[2] !== undefined ? opts[2] : ''

  const dataFromFile = fs.createReadStream(fileName)

  return await readCsv(dataFromFile, typeOfContent, folderID, api)

}

module.exports = importData
