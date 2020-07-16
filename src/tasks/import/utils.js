const csvReader = require('fast-csv')
const xmlConverter = require('xml-js')
const chalk = require('chalk')

const sendContent = async (content, api) => {
  try {
    api.getClient()
      .post(`spaces/${api.spaceId}/stories`, { story: content })
      .then(res => {
        console.log(`${chalk.green('✓')} ${res.data.story.name} was created `)
      })
      .catch(err => Promise.reject(err))
  } catch (error) {
    console.log(error)
  }
}

const removeJsonTextAttribute = (value, parentElement) => {
  try {
    const keyNo = Object.keys(parentElement._parent).length
    const keyName = Object.keys(parentElement._parent)[keyNo - 1]
    parentElement._parent[keyName] = !isNaN(value) ? Number(value) : value
  } catch (error) {
    console.log(error)
  }
}

/**
 * @method isCsv
 * @param  {String} ext - Extension of a file
 * @return {Boolean}
 */
const isCsv = (ext) => ext === 'csv'

/**
 * @method isXml
 * @param  {String} ext - Extension of a file
 * @return {Boolean}
 */
const isXml = (ext) => ext === 'xml'

/**
 * @method isJson
 * @param  {String} ext - Extension of a file
 * @return {Boolean}
 */
const isJson = (ext) => ext === 'json'

/**
 * @method readAndLoadCsv
 * @param  {String} stream - CSV content
 * @param  {String} typeOfContent - Content type
 * @param  {Object} api - Api object
 * @param  {Number} folderID - Storyblok folder id, default value is 0
 * @param  {String} delimiter - Csv file delimiter, default value is ';'
 * @return {Promise}
 */

const readAndLoadCsv = async (stream, typeOfContent, api, folderID = 0, delimiter = ';') => {
  console.log()
  console.log(`${chalk.blue('-')} Reading CSV file... `)
  console.log()

  csvReader.parseStream(stream, { headers: true, delimiter: delimiter })
    .on('error', error => console.error(error))
    .on('data', line => {
      const content = Object.keys(line).reduce((acc, key) => {
        acc[key] = line[key]
        return acc
      }, {})

      const story = {
        slug: line.path,
        name: line.title,
        parent_id: folderID,
        content: {
          component: typeOfContent,
          ...content
        }
      }
      return sendContent(story, api)
    })
}

/**
 * @method readAndLoadXml
 * @param  {Object} data - XML content
 * @param  {String} typeOfContent - Content type
 * @param  {Object} api - Api object
 * @param  {Number} folderID - Storyblok folder id, default value is 0
 * @return {Promise}
 */

const readAndLoadXml = async (data, typeOfContent, api, folderID = 0) => {
  console.log()
  console.log(`${chalk.blue('-')} Reading XML file... `)
  console.log()

  const options = {
    compact: true,
    trim: true,
    ignoreDoctype: true,
    textFn: removeJsonTextAttribute
  }

  const contentParsed = xmlConverter.xml2js(data, options)

  contentParsed.root.row.map(line => {
    const content = Object.keys(line).reduce((acc, key) => {
      acc[key] = line[key]
      return acc
    }, {})

    const story = {
      slug: line.path,
      name: line.title,
      parent_id: folderID,
      content: {
        component: typeOfContent,
        ...content
      }
    }

    return sendContent(story, api)
  })
}

/**
 * @method readAndLoadJson
 * @param  {Object} data - Json with content
 * @param  {String} typeOfContent - Content type
 * @param  {Object} api - Api object
 * @param  {Number} folderID - Storyblok folder id, default value is 0
 * @return {Promise}
 */

const readAndLoadJson = async (data, typeOfContent, api, folderID = 0) => {
  console.log()
  console.log(`${chalk.blue('-')} Reading JSON file... `)
  console.log()

  data = JSON.parse(data)

  for (const key in data) {
    const story = {
      slug: key,
      name: data[key].title,
      parent_id: folderID,
      content: {
        component: typeOfContent,
        ...data[key]
      }
    }
    return sendContent(story, api)
  }
}

module.exports = {
  isJson,
  isXml,
  isCsv,
  readAndLoadCsv,
  readAndLoadXml,
  readAndLoadJson
}
