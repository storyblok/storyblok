const chalk = require('chalk')
const fs = require('fs-extra')
const MIGRATIONS_ROLLBACK_DIRECTORY = `${process.cwd()}/migrations/rollback`
const {
  checkExistenceFilesInRollBackDirectory,
  urlTofRollbackMigrationFile
} = require('./utils')

/**
 * @method rollbackMigration
 * @param  {Object}   api       api instance
 * @param  {String}   component name of the component to rollback
 * @param  {String}   field     name of the field to rollback
 * @return {Promise}
 */

const rollbackMigration = async (api, field, component) => {
  if (!fs.existsSync(MIGRATIONS_ROLLBACK_DIRECTORY)) {
    console.log(`
        ${chalk.red('X')} To execute the rollback-migration command you need to have changed some component with the migrations commands.`
    )
    return
  }

  console.log(
    `${chalk.blue('-')} Checking if the rollback files exist`
  )

  try {
    checkExistenceFilesInRollBackDirectory(MIGRATIONS_ROLLBACK_DIRECTORY, component, field)
      .then(data => {
        if (!data) {
          return console.log(`${chalk.red('X')} Rollback file for component ${chalk.blue(component)} and field ${chalk.blue(field)} was not found`)
        }
      })

    console.log()
    console.log(
      `${chalk.blue('-')} Starting rollback...`
    )
    console.log()

    let rollbackContent = await fs.readFile(urlTofRollbackMigrationFile(component, field), 'utf-8')
    rollbackContent = JSON.parse(rollbackContent)

    for (const story of rollbackContent) {
      console.log(
        `${chalk.blue('-')} Restoring data from "${chalk.blue(story.full_slug)}" ...`
      )
      await api.put(`stories/${story.id}`, {
        story: { content: story.content },
        force_update: '1'
      })
      console.log(
        `  ${chalk.blue('-')} ${story.full_slug} data has been restored!`
      )
      console.log()
    }

    console.log(
      `${chalk.green('✓')} The roolback-migration was executed with success!`
    )
    return Promise.resolve({ rollback: true })
  } catch (err) {
    console.log(`${chalk.red('X')} The rollback-migration command was not successfully executed: ${err}`)
    return Promise.reject(err)
  }
}

module.exports = rollbackMigration
