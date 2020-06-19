const chalk = require('chalk')
const { isEmpty } = require('lodash')

const {
  getPathToFile,
  checkFileExists,
  processMigration,
  getStoriesByComponent,
  getNameOfMigrationFile
} = require('./utils')

/**
 * @method runMigration
 * @param  {Object} api       API instance
 * @param  {String} component component name
 * @param  {String} field     field name
 * @param  {{ isDryrun?: boolean, migrationPath?: string }} options disable execution
 * @return {Promise<{ executed: boolean, motive?: string }>}
 */
const runMigration = async (api, component, field, options = {}) => {
  const migrationPath = options.migrationPath || null
  try {
    const fileName = getNameOfMigrationFile(component, field)
    const pathToFile = getPathToFile(fileName, migrationPath)
    const fileExists = await checkFileExists(pathToFile)

    if (!fileExists) {
      throw new Error(`The migration to combination ${fileName} doesn't exists`)
    }

    console.log(
      `${chalk.blue('-')} Getting the user defined migration function`
    )
    const migrationFn = require(pathToFile)

    if (typeof migrationFn !== 'function') {
      throw new Error("The migration file doesn't export a function")
    }

    console.log(
      `${chalk.blue('-')} Getting stories for ${component} component`
    )
    const stories = await getStoriesByComponent(api, component)

    if (isEmpty(stories)) {
      console.log(`${chalk.blue('-')} There are no stories for component ${component}!`)
      return Promise.resolve({
        executed: false,
        motive: 'NO_STORIES'
      })
    }

    for (const story of stories) {
      try {
        console.log(
          `${chalk.blue('-')} Processing story #${story.name}`
        )
        const storyData = await api.getSingleStory(story.id)
        await processMigration(storyData.content, component, migrationFn)

        if (!options.isDryrun) {
          console.log(
            `${chalk.blue('-')} Updating story #${story.name}`
          )
          const url = `stories/${story.id}`
          const payload = {
            story: storyData,
            forceUpdate: '1'
          }
          await api.put(url, payload)
          console.log(
            `${chalk.blue('-')} Story updated with success!`
          )
        }
      } catch (e) {
        console.error(`${chalk.red('X')} An error occurred when try to execute migration and update the story: ${e.message}`)
      }

      console.log()
    }

    console.log(`${chalk.green('✓')} The migration was executed with success!`)
    return Promise.resolve({
      executed: true
    })
  } catch (e) {
    return Promise.reject(e)
  }
}

module.exports = runMigration
