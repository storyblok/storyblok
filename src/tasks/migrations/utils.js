const onChange = require('on-change')
const { isArray, isPlainObject, has, isEmpty, template, truncate } = require('lodash')
const fs = require('fs-extra')
const chalk = require('chalk')

const { parseError } = require('../../utils')
const migrationTemplate = require('../templates/migration-file')
const MIGRATIONS_DIRECTORY = `${process.cwd()}/migrations`
const MIGRATIONS_ROLLBACK_DIRECTORY = `${process.cwd()}/migrations/rollback`

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
    console.error(`${chalk.red('X')} An error occurred when loading the components from space: ${error.message}`)

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
 * @param  {String} storyFullSlug  the full slug of the containing story
 * @return {Promise<Boolean>}
 */
const processMigration = async (content = {}, component = '', migrationFn, storyFullSlug) => {
  // I'm processing the component that I want
  if (content.component === component) {
    const watchedContent = onChange(
      content,
      showMigrationChanges
    )

    await migrationFn(watchedContent, storyFullSlug)
  }

  for (const key in content) {
    const value = content[key]

    if (isArray(value)) {
      try {
        await Promise.all(
          value.map(_item => processMigration(_item, component, migrationFn, storyFullSlug))
        )
      } catch (e) {
        console.error(e)
      }
    }

    if (isPlainObject(value) && has(value, 'component')) {
      try {
        await processMigration(value, component, migrationFn, storyFullSlug)
      } catch (e) {
        console.error(e)
      }
    }

    if (isPlainObject(value) && value.type === 'doc' && value.content) {
      value.content.filter(item => item.type === 'blok').forEach(async (item) => {
        try {
          await processMigration(item.attrs.body, component, migrationFn, storyFullSlug)
        } catch (e) {
          console.error(e)
        }
      })
    }
  }

  return Promise.resolve(true)
}

/**
 * @method urlTofRollbackMigrationFile
 * @param  {String}   component name of the component to rollback
 * @param  {String}   field     name of the field to rollback
 * @return {String}
 */

const urlTofRollbackMigrationFile = (component, field) => {
  return `${MIGRATIONS_ROLLBACK_DIRECTORY}/${getNameOfRollbackMigrationFile(component, field)}`
}

/**
 * @method getNameOfRollbackMigrationFile
 * @param  {String}   component name of the component to rollback
 * @param  {String}   field     name of the field to rollback
 * @return {String}
 */

const getNameOfRollbackMigrationFile = (component, field) => {
  return `rollback_${component}_${field}.json`
}

/**
 * @method createRollbackFile
 * @param  {Array}   stories    array containing stories for rollback
 * @return {Promise}
 */

const createRollbackFile = async (stories, component, field) => {
  try {
    if (!fs.existsSync(MIGRATIONS_ROLLBACK_DIRECTORY)) {
      fs.mkdir(MIGRATIONS_ROLLBACK_DIRECTORY)
    }

    const url = urlTofRollbackMigrationFile(component, field)

    if (fs.existsSync(url)) {
      fs.unlinkSync(url)
    }

    fs.writeFile(url, JSON.stringify(stories, null, 2), { flag: 'a' }, (error) => {
      if (error) {
        console.log(`${chalk.red('X')} The rollback file could not be created: ${error}`)
        return error
      }
      console.log(`${chalk.green('✓')} The rollback file has been created in migrations/rollback/!`)
    })
    return Promise.resolve({
      component: component,
      created: true
    })
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * @method checkExistenceFilesInRollBackDirectory
 * @param  {String}   path      path of the rollback folder directories
 * @param  {String}   component name of the components to be searched for in the rollback folder
 * @param  {String}   field     name of the field to be searched for in the rollback folder
 * @return {Promisse<Array>}
 */

const checkExistenceFilesInRollBackDirectory = (path, component, field) => {
  if (!fs.existsSync(path)) {
    console.log(`
        ${chalk.red('X')} The path for which the rollback files should be contained does not exist`
    )
    return Promise.reject(new Error({ error: 'Path not found' }))
  }

  const files = fs.readdirSync(path).map(file => file)

  const file = files.filter((name) => {
    const splitedName = name.split('_')
    if (splitedName[1] === component && splitedName[2] === `${field}.json`) {
      return name
    }
  })
  return Promise.resolve(file)
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
  getNameOfMigrationFile,
  createRollbackFile,
  checkExistenceFilesInRollBackDirectory,
  urlTofRollbackMigrationFile,
  getNameOfRollbackMigrationFile
}
