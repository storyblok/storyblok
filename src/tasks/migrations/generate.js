const chalk = require('chalk')
const inquirer = require('inquirer')

const {
  getPathToFile,
  checkFileExists,
  getInquirerOptions,
  createMigrationFile,
  checkComponentExists,
  getNameOfMigrationFile
} = require('./utils')

/**
 * @method generateMigration
 * @param  {Object} api       API instance
 * @param  {String} component component name
 * @param  {String} field     field name
 * @return {Promise<{fileName: string, created: boolean}>}
 */
const generateMigration = async (api, component, field) => {
  try {
    const componentExists = await checkComponentExists(api, component)

    if (!componentExists) {
      throw new Error('The component does not exists')
    }

    const fileName = getNameOfMigrationFile(component, field)
    const pathToFile = getPathToFile(fileName)
    const fileExists = await checkFileExists(pathToFile)

    if (fileExists) {
      console.log(`${chalk.yellow('!')} The file to migration already exists.`)

      const questions = getInquirerOptions('file-exists')
      const answer = await inquirer.prompt(questions)

      if (!answer.choice) {
        console.log(`${chalk.blue('-')} The file will not overwrite`)

        return Promise.resolve({
          fileName,
          created: false
        })
      }
    }

    await createMigrationFile(fileName, field)

    console.log(`${chalk.green('✓')} File created with success. Check the file ${fileName} in migrations folder`)

    return Promise.resolve({
      fileName,
      created: true
    })
  } catch (e) {
    return Promise.reject(e)
  }
}

module.exports = generateMigration
