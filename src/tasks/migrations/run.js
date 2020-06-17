const chalk = require('chalk')
const { isEmpty } = require('lodash')

const {
  getPathToFile,
  checkFileExists,
  processMigration,
  getStoriesByComponent,
  getNameOfMigrationFile
} = require('./utils')

const generateMigration = async (api, component, field, isDryrun) => {
  try {
    const fileName = getNameOfMigrationFile(component, field)
    const fileExists = await checkFileExists(fileName)

    if (!fileExists) {
      throw new Error(`The migration to combination ${fileName} doesn't exists`)
    }

    console.log(
      `${chalk.blue('-')} Getting the user defined migration function`
    )
    const migrationFunctionPath = getPathToFile(fileName)
    const migrationFn = require(migrationFunctionPath)

    if (typeof migrationFn !== 'function') {
      throw new Error("The migration file doesn't export a function")
    }

    console.log(
      `${chalk.blue('-')} Getting stories for ${component} component`
    )
    const stories = await getStoriesByComponent(api, component)

    if (isEmpty(stories)) {
      console.log(`${chalk.blue('-')} There are no stories for component ${component}!`)
      return Promise.resolve(true)
    }

    for (const story of stories) {
      try {
        console.log(
          `${chalk.blue('-')} Processing story #${story.name}`
        )
        const storyData = await api.getSingleStory(story.id)
        await processMigration(storyData.content, component, migrationFn)

        if (!isDryrun) {
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
    return Promise.resolve(true)
  } catch (e) {
    return Promise.reject(e)
  }
}

module.exports = generateMigration
