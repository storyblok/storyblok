const chalk = require('chalk')
const inquirer = require('inquirer')

const {
  checkFileExists,
  getInquirerOptions,
  createMigrationFile,
  checkComponentExists,
  getNameOfMigrationFile
} = require('./utils')

const generateMigration = async (api, component, field) => {
  try {
    const componentExists = await checkComponentExists(api, component)

    if (!componentExists) {
      throw new Error('The component does not exists')
    }

    const fileName = getNameOfMigrationFile(component, field)
    const fileExists = await checkFileExists(fileName)

    if (fileExists) {
      console.log(`${chalk.yellow('!')} The file to migration already exists.`)

      const questions = getInquirerOptions('file-exists')
      const answer = await inquirer.prompt(questions)

      if (!answer.choice) {
        console.log(`${chalk.blue('-')} The file was not overwrite`)
        return Promise.resolve(true)
      }
    }

    await createMigrationFile(fileName)

    console.log(`${chalk.green('✓')} File created with success. Check the file ${fileName} in migrations folder`)
  } catch (e) {
    console.log('Deu erro')
    return Promise.reject(e)
  }
}

module.exports = generateMigration
