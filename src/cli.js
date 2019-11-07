#!/usr/bin/env node

const commander = require('commander')
const program = new commander.Command()

const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const inquirer = require('inquirer')

const tasks = require('./tasks')
const { getQuestions, lastStep, api } = require('./utils')

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
    try {
      const questions = getQuestions('login', {}, api)
      const { email, password } = await inquirer.prompt(questions)

      await api.login(email, password)
      console.log(chalk.green('✓') + 'Log in successfully! Token has been added to .netrc file.')
      process.exit(0)
    } catch (e) {
      console.log(chalk.red('X') + 'An error ocurred when login the user')
      console.error(e)
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
      console.log(chalk.red('X') + 'An error ocurred when logout the user')
      console.error(e)
    }
  })

// pull-components
program
  .command('pull-components')
  .description("Download your space's components schema as json")
  .action(async () => {
    const space = program.space
    if (!space) {
      console.log('Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(0)
    }

    try {
      const questions = await getQuestions('pull-components', { space }, api)

      await inquirer.prompt(questions)

      api.setSpaceId(space)
      await tasks.pullComponents(api, { space })
    } catch (e) {
      console.log(chalk.red('X') + 'An error ocurred when execute the pull-components task')
      console.error(e)
      process.exit(0)
    }
  })

// push-components
program
  .command('push-components <source>')
  .description("Download your space's components schema as json. The source parameter can be a URL to your JSON file or a path to it")
  .action(async (source) => {
    const space = program.space
    if (!space) {
      console.log('Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(0)
    }

    try {
      const questions = await getQuestions('push-components', { space }, api)

      await inquirer.prompt(questions)

      api.setSpaceId(space)
      await tasks.pushComponents(api, { source })
    } catch (e) {
      console.log(chalk.red('X') + 'An error ocurred when execute the push-components task')
      console.error(e)
      process.exit(0)
    }
  })

// scaffold
program
  .command('scaffold <name>')
  .description('Scaffold <name> component')
  .action(async (name) => {
    try {
      await tasks.scaffold(api, name, program.space)
      console.log(chalk.green('✓') + 'Log in successfully! Token has been added to .netrc file.')
      process.exit(0)
    } catch (e) {
      console.log(chalk.red('X') + 'An error ocurred execute operations to create the component')
      console.error(e)
    }
  })

// select
program
  .command('select')
  .description('Usage to kickstart a boilerplate, fieldtype or theme')
  .action(async () => {
    try {
      const questions = getQuestions('select')
      const answers = await inquirer.prompt(questions)

      lastStep(answers)
    } catch (e) {
      console.error(e)
      process.exit(0)
    }
  })

// sync
program
  .command('sync')
  .description('Sync schemas, roles, folders and stories between spaces')
  .requiredOption('--token <TOKEN>', 'Your OAuth token from your Storyblok settings')
  .requiredOption('--command <COMMAND>', 'Define what will be sync. Can be syncComponents, syncFolders, syncStories or syncRoles')
  .requiredOption('--source <SPACE_ID>', 'Source space id')
  .requiredOption('--target <SPACE_ID>', 'Target space id')
  .action(async (options) => {
    const {
      token,
      command,
      source,
      target
    } = options

    try {
      await tasks.sync(command, {
        token,
        source,
        target
      })
    } catch (e) {
      console.error(chalk.red('X') + 'An error ocurred when sync spaces')
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
      const questions = getQuestions('quickstart', {}, api)
      const answers = await inquirer.prompt(questions)
      tasks.quickstart(api, answers, program.space)
    } catch (e) {
      console.log(chalk.red('X') + 'An error ocurred when execute quickstart operations')
      console.error(e)
    }
  })

program.parse(process.argv)
