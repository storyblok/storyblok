const { isArray, isPlainObject, has } = require('lodash')
const fs = require('fs-extra')
const chalk = require('chalk')

const { parseError } = require('../../utils')
const migrationTemplate = require('../templates/migration-file')
const MIGRATIONS_DIRECTORY = `${process.cwd()}/migrations`

/**
 * @method getPathToFile
 * @param  {String} fileName
 * @return {String}
 *
 * @example
 * // path/to/migrations/change_teaser_subtitle.js
 * getPathToFile('change_teaser_subtitle.js')
 */
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
 * @method getComponentsFromName
 * @param  {Object} api       API Object
 * @param  {String} component name of component
 * @return {Promise<Array>}
 */
const getStoriesByComponent = async (api, componentName) => {
  try {
    const stories = await api.getStories({
      contain_component: componentName
    })

    return stories
  } catch (e) {
    const error = parseError(e)
    console.error(`${chalk.red('X')} An error ocurred when load the stories filtering by component ${componentName}: ${error.message}`)

    return Promise.reject(error.error)
  }
}

/**
 * @method getComponentsFromName
 * @param  {Object} api       API Object
 * @param  {String} component name of component
 * @return {Promise<Object>}
 */
const getComponentsFromName = async (api, componentName) => {
  try {
    const components = await api.getComponents()

    const found = components.filter(_comp => {
      return _comp.name === componentName
    })

    if (found.length > 0) {
      return Promise.resolve(found[0])
    }

    return {}
  } catch (e) {
    const error = parseError(e)
    console.error(`${chalk.red('X')} An error ocurred when load the components from space: ${error.message}`)

    return Promise.reject(error.error)
  }
}

/**
 * @method checkComponentExists
 * @param  {Object} api       API Object
 * @param  {String} component name of component
 * @return {Promise<Boolean>}
 */
const checkComponentExists = async (api, component) => {
  try {
    const componentData = await getComponentsFromName(api, component)

    return Promise.resolve(Object.keys(componentData).length > 0)
  } catch (e) {
    const error = parseError(e)
    return Promise.reject(error.error)
  }
}

/**
 * @method checkFileExists
 * @param  {String} fileName
 * @return {Promise<Boolean>}
 */
const checkFileExists = async (fileName) => {
  const PATH = getPathToFile(fileName)

  return fs.pathExists(PATH)
}

/**
 * @method createMigrationFile
 * @param  {String} fileName
 * @return {Promise<Boolean>}
 */
const createMigrationFile = (fileName) => {
  console.log(`${chalk.blue('-')} Creating the migration file in migrations folder`)

  return fs.outputFile(getPathToFile(fileName), migrationTemplate)
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

/**
 * processMigration
 * @param {Object}   content component structure from Storyblok
 * @param {String}   component    name of the component that is processing
 * @param {Function} migrationFn  the migration function defined by user
 */
const processMigration = async (content = {}, component = '', migrationFn) => {
  // I'm processing the component that I want
  if (content.component === component) {
    migrationFn(content)
  }

  for (const key in content) {
    const value = content[key]

    if (isArray(value)) {
      try {
        await Promise.all(
          value.map(_item => processMigration(_item, component, migrationFn))
        )
      } catch (e) {
        console.error(e)
      }
    }

    if (isPlainObject(value) && has(value, 'component')) {
      try {
        await processMigration(value, component, migrationFn)
      } catch (e) {
        console.error(e)
      }
    }
  }

  return Promise.resolve(true)
}

module.exports = {
  getPathToFile,
  checkFileExists,
  processMigration,
  getInquirerOptions,
  createMigrationFile,
  checkComponentExists,
  getStoriesByComponent,
  getComponentsFromName,
  getNameOfMigrationFile
}
