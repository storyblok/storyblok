const chalk = require('chalk')
const { isEmpty, cloneDeep, isEqual } = require('lodash')

const {
  getPathToFile,
  checkFileExists,
  processMigration,
  getStoriesByComponent,
  getNameOfMigrationFile,
  createRollbackFile
} = require('./utils')

/**
 * @method isStoryPublishedWithoutChanges
 * @param  {Object} story
 * @return {Boolean}
 */
const isStoryPublishedWithoutChanges = story => {
  return story.published && !story.unpublished_changes
}

/**
 * @method isStoryWithUnpublishedChanges
 * @param  {Object} story
 * @return {Boolean}
 */
const isStoryWithUnpublishedChanges = story => {
  return story.published && story.unpublished_changes
}

/**
 * @typedef {'all'|'published'|'published-with-changes'} PublishOptions
 *
 * @typedef {Object} RunMigrationOptions
 * @property {boolean} isDryrun indicates the function will be execute or not
 * @property {string}  migrationPath indicates where is the location to migration function
 * @property {PublishOptions} publish
 * @property {string}  publishLanguages
 * /

/**
 * @method runMigration
 * @param  {Object} api       API instance
 * @param  {String} component component name
 * @param  {String} field     field name
 * @param  {RunMigrationOptions} options disable execution
 * @return {Promise<{ executed: boolean, motive?: string }>}
 */
const runMigration = async (api, component, field, options = {}) => {
  const migrationPath = options.migrationPath || null
  const publish = options.publish || null
  const publishLanguages = options.publishLanguages || null

  try {
    const fileName = getNameOfMigrationFile(component, field)
    const pathToFile = getPathToFile(fileName, migrationPath)
    const fileExists = await checkFileExists(pathToFile)
    const rollbackData = []

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
          `${chalk.blue('-')} Processing story ${story.full_slug}`
        )
        const storyData = await api.getSingleStory(story.id)
        const oldContent = cloneDeep(storyData.content)

        await processMigration(storyData.content, component, migrationFn, story.full_slug)

        const isChangeContent = !isEqual(oldContent, storyData.content)

        // to prevent api unnecessary api executions
        if (!options.isDryrun && isChangeContent) {
          console.log(
            `${chalk.blue('-')} Updating story ${story.full_slug}`
          )
          const url = `stories/${story.id}`

          // create a rollback object
          rollbackData.push({
            id: storyData.id,
            full_slug: storyData.full_slug,
            content: oldContent
          })

          const payload = {
            story: storyData,
            force_update: '1'
          }

          if (publish === 'published' && isStoryPublishedWithoutChanges(storyData)) {
            payload.publish = '1'
          }

          if (publish === 'published-with-changes' && isStoryWithUnpublishedChanges(story)) {
            payload.publish = '1'
          }

          if (publish === 'all') {
            payload.publish = '1'
          }

          if (!isEmpty(publishLanguages)) {
            payload.lang = publishLanguages
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

    // send file of rollback to save in migrations/rollback directory
    if (!isEmpty(rollbackData)) {
      await createRollbackFile(rollbackData, component, field)
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
