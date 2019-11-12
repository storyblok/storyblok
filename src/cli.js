#!/usr/bin/env node

const commander = require('commander')
const program = new commander.Command()

const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const inquirer = require('inquirer')

const tasks = require('./tasks')
const { getQuestions, lastStep, api, creds } = require('./utils')

clear()
console.log(chalk.cyan(figlet.textSync('Storyblok')))
console.log()
console.log()
console.log('Hi, welcome to the Storyblok CLI')
console.log()

program
  .option('-s, --space [value]', 'space ID')

// login
program
  .command('login')
  .description('Login to the Storyblok cli')
  .action(async () => {
    if (api.isAuthorized()) {
      console.log(chalk.green('✓') + ' The user has been already logged. If you want to change the logged user, you must logout and login again')
      return
    }

    try {
      const questions = getQuestions('login', {}, api)
      const { email, password } = await inquirer.prompt(questions)

      await api.login(email, password)
      console.log(chalk.green('✓') + ' Log in successfully! Token has been added to .netrc file.')
      process.exit(0)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when login the user')
      console.error(e)
      process.exit(1)
    }
  })

// logout
program
  .command('logout')
  .description('Logout from the Storyblok cli')
  .action(async () => {
    try {
      await api.logout()
      console.log('Logged out successfully! Token has been removed from .netrc file.')
      process.exit(0)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when logout the user')
      console.error(e)
    }
  })

// pull-components
program
  .command('pull-components')
  .description("Download your space's components schema as json")
  .action(async () => {
    console.log(`${chalk.blue('-')} Executing push-components task`)
    const space = program.space
    if (!space) {
      console.log(chalk.red('X') + ' Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(0)
    }

    try {
      const questions = await getQuestions('pull-components', { space }, api)

      await inquirer.prompt(questions)

      api.setSpaceId(space)
      await tasks.pullComponents(api, { space })
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when execute the pull-components task')
      console.error(e)
      process.exit(0)
    }
  })

// push-components
program
  .command('push-components <source>')
  .description("Download your space's components schema as json. The source parameter can be a URL to your JSON file or a path to it")
  .action(async (source) => {
    console.log(`${chalk.blue('-')} Executing push-components task`)
    const space = program.space

    if (!space) {
      console.log(chalk.red('X') + ' Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(0)
    }

    try {
      const questions = await getQuestions('push-components', { space }, api)

      await inquirer.prompt(questions)

      api.setSpaceId(space)
      await tasks.pushComponents(api, { source })
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when execute the push-components task')
      console.error(e)
      process.exit(0)
    }
  })

// scaffold
program
  .command('scaffold <name>')
  .description('Scaffold <name> component')
  .action(async (name) => {
    console.log(`${chalk.blue('-')} Scaffolding a component\n`)

    if (api.isAuthorized()) {
      api.accessToken = creds.get().token || null
    }

    try {
      await tasks.scaffold(api, name, program.space)
      console.log(chalk.green('✓') + ' Generated files: ')
      console.log(chalk.green('✓') + ' - views/components/_' + name + '.liquid')
      console.log(chalk.green('✓') + ' - source/scss/components/below/_' + name + '.scss')
      process.exit(0)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred execute operations to create the component')
      console.error(e)
    }
  })

// select
program
  .command('select')
  .description('Usage to kickstart a boilerplate, fieldtype or theme')
  .action(async () => {
    console.log(`${chalk.blue('-')} Select a boilerplate, fieldtype or theme to initialize\n`)

    try {
      const questions = getQuestions('select')
      const answers = await inquirer.prompt(questions)

      await lastStep(answers)
    } catch (e) {
      console.error(e)
      process.exit(0)
    }
  })

// sync
program
  .command('sync')
  .description('Sync schemas, roles, folders and stories between spaces')
  .requiredOption('--command <COMMAND>', 'Define what will be sync. Can be syncComponents, syncFolders, syncStories or syncRoles')
  .requiredOption('--source <SPACE_ID>', 'Source space id')
  .requiredOption('--target <SPACE_ID>', 'Target space id')
  .action(async (options) => {
    console.log(`${chalk.blue('-')} Sync data between spaces\n`)

    const {
      command,
      source,
      target
    } = options

    try {
      if (!api.isAuthorized()) {
        const questions = getQuestions('login', {}, api)
        const { email, password } = await inquirer.prompt(questions)

        await api.login(email, password)
        console.log(chalk.green('✓') + ' Log in successfully! Token has been added to .netrc file.')
      }

      const token = creds.get().token || null

      await tasks.sync(command, {
        token,
        source,
        target
      })

      console.log(chalk.green('✓') + ' Sync data between spaces successfully completed')
    } catch (e) {
      console.error(chalk.red('X') + ' An error ocurred when sync spaces')
      console.error(e)
      process.exit(0)
    }
  })

// quickstart
program
  .command('quickstart')
  .description('Start a project quickly')
  .action(async () => {
    try {
      const space = program.space
      const questions = getQuestions('quickstart', { space }, api)
      const answers = await inquirer.prompt(questions)
      await tasks.quickstart(api, answers, space)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when execute quickstart operations')
      console.error(e)
    }
  })

program.parse(process.argv)
