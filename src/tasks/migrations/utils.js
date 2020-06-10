const fs = require('fs-extra')
const chalk = require('chalk')

const { parseError } = require('../../utils')
const migrationTemplate = require('../templates/migration-file')
const MIGRATIONS_DIRECTORY = `${process.cwd()}/migrations`

const getPathToFile = fileName => `${MIGRATIONS_DIRECTORY}/${fileName}`

/**
 * @method getNameOfMigrationFile
 * @param  {String} component name of component
 * @param  {String} field     name of component's field
 * @return {String}
 *
 * @example
 * getNameOfMigrationFile('product', 'price') // change_product_price
 */
const getNameOfMigrationFile = (component, field) => {
  return `change_${component}_${field}.js`
}

/**
 * @method checkComponentExists
 * @param  {Object} api       API Object
 * @param  {String} component name of component
 * @return {Promise<Boolean>}
 */
const checkComponentExists = async (api, component) => {
  try {
    const components = await api.getComponents()

    return Promise.resolve(components.some(_comp => {
      return _comp.name === component
    }))
  } catch (e) {
    const error = parseError(e)
    console.error(`${chalk.red('X')} An error ocurred when load the components from space: ${error.message}`)

    return Promise.reject(error.error)
  }
}

/**
 * @method checkFileExists
 * @param  {String} fileName
 * @return {Promise<Boolean>}
 */
const checkFileExists = async (fileName) => {
  return new Promise((resolve, reject) => {
    const PATH = getPathToFile(fileName)

    fs.pathExists(PATH, (_, exists) => resolve(exists))
  })
}

/**
 * @method createMigrationFile
 * @param  {String} fileName
 * @return {Promise<Boolean>}
 */
const createMigrationFile = (fileName) => {
  return new Promise((resolve, reject) => {
    console.log(`${chalk.blue('-')} Creating the migration file in migrations folder`)

    fs.outputFile(getPathToFile(fileName), migrationTemplate, err => {
      if (err) {
        reject(err)
      }

      resolve(true)
    })
  })
}

/**
 * @method getInquirerOptions
 * @param  {String} type
 * @return {Array}
 */
const getInquirerOptions = (type) => {
  if (type === 'file-exists') {
    return [{
      type: 'confirm',
      name: 'choice',
      message: 'Do you want to continue? (This will overwrite the content of the file!)'
    }]
  }

  return []
}

module.exports = {
  checkFileExists,
  getInquirerOptions,
  createMigrationFile,
  checkComponentExists,
  getNameOfMigrationFile
}
