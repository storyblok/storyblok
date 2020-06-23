const onChange = require('on-change')
const { isArray, isPlainObject, has, isEmpty, template, truncate } = require('lodash')
const fs = require('fs-extra')
const chalk = require('chalk')

const { parseError } = require('../../utils')
const migrationTemplate = require('../templates/migration-file')
const MIGRATIONS_DIRECTORY = `${process.cwd()}/migrations`

/**
 * @method getPathToFile
 * @param  {String} fileName      name of the file
 * @param  {String} migrationPath migrations folder
 * @return {String}
 *
 * @example
 * // path/to/migrations/change_teaser_subtitle.js
 * getPathToFile('change_teaser_subtitle.js')
 *
 * // ./migrations/change_teaser_subtitle.js
 * getPathToFile('change_teaser_subtitle.js', './migrations')
 */
const getPathToFile = (fileName, migrationPath = null) => {
  const pathTo = isEmpty(migrationPath) ? MIGRATIONS_DIRECTORY : migrationPath

  return `${pathTo}/${fileName}`
}

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
 * @param  {String} filePath
 * @return {Promise<Boolean>}
 */
const checkFileExists = async (filePath) => fs.pathExists(filePath)

/**
 * @method createMigrationFile
 * @param  {String} fileName path to file
 * @param  {String} field    name of the field
 * @return {Promise<Boolean>}
 */
const createMigrationFile = (fileName, field) => {
  console.log(`${chalk.blue('-')} Creating the migration file in migrations folder`)

  // use lodash.template to replace the occurrences of fieldname
  const compile = template(migrationTemplate, {
    interpolate: /{{([\s\S]+?)}}/g
  })
  const outputMigrationFile = compile({
    fieldname: field
  })

  return fs.outputFile(getPathToFile(fileName), outputMigrationFile)
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
 * @method showMigrationChanges
 * @param  {String} path      field name
 * @param  {unknown} value    updated value
 * @param  {unknown} oldValue previous value
 */
const showMigrationChanges = (path, value, oldValue) => {
  // It was created a new field
  if (oldValue === undefined) {
    // truncate the string with more than 30 characters
    const _value = truncate(value)

    console.log(`  ${chalk.green('-')} Created field "${chalk.green(path)}" with value "${chalk.green(_value)}"`)
    return
  }

  // It was removed the field
  if (value === undefined) {
    console.log(`  ${chalk.red('-')} Removed the field "${chalk.red(path)}"`)
    return
  }

  // It was updated the value
  if (value !== oldValue) {
    // truncate the string with more than 30 characters
    const _value = truncate(value)
    const _oldValue = truncate(oldValue)

    console.log(`  ${chalk.blue('-')} Updated field "${chalk.blue(path)}" from "${chalk.blue(_oldValue)}" to "${chalk.blue(_value)}"`)
  }
}

/**
 * @method processMigration
 * @param  {Object}   content component structure from Storyblok
 * @param  {String}   component    name of the component that is processing
 * @param  {Function} migrationFn  the migration function defined by user
 * @param  {Boolean}  isDryrun     if true, watch changes
 * @return {Promise<Boolean>}
 */
const processMigration = async (content = {}, component = '', migrationFn, isDryrun) => {
  // I'm processing the component that I want
  if (content.component === component) {
    if (isDryrun) {
      const watchedContent = onChange(
        content,
        showMigrationChanges
      )

      migrationFn(watchedContent)
    } else {
      migrationFn(content)
    }
  }

  for (const key in content) {
    const value = content[key]

    if (isArray(value)) {
      try {
        await Promise.all(
          value.map(_item => processMigration(_item, component, migrationFn, isDryrun))
        )
      } catch (e) {
        console.error(e)
      }
    }

    if (isPlainObject(value) && has(value, 'component')) {
      try {
        await processMigration(value, component, migrationFn, isDryrun)
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
  showMigrationChanges,
  getStoriesByComponent,
  getComponentsFromName,
  getNameOfMigrationFile
}
