#!/usr/bin/env node

const commander = require('commander')
const program = new commander.Command()

const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const inquirer = require('inquirer')

const updateNotifier = require('update-notifier')
const pkg = require('../package.json')

const tasks = require('./tasks')
const { getQuestions, lastStep, api, creds } = require('./utils')
const { SYNC_TYPES } = require('./constants')

clear()
console.log(chalk.cyan(figlet.textSync('Storyblok')))
console.log()
console.log()
console.log('Hi, welcome to the Storyblok CLI')
console.log()

// non-intrusive notify users if an update available
const notifyOptions = {
  isGlobal: true
}

updateNotifier({ pkg })
  .notify(notifyOptions)

program.version(pkg.version)

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
      await api.processLogin()
      process.exit(0)
    } catch (e) {
      console.log(chalk.red('X') + ' An error occurred when logging the user: ' + e.message)
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
      console.log(chalk.red('X') + ' An error occurred when logging out the user: ' + e.message)
      process.exit(1)
    }
  })

// pull-components
program
  .command('pull-components')
  .description("Download your space's components schema as json")
  .action(async () => {
    console.log(`${chalk.blue('-')} Executing pull-components task`)
    const space = program.space
    if (!space) {
      console.log(chalk.red('X') + ' Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(0)
    }

    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      api.setSpaceId(space)
      await tasks.pullComponents(api, { space })
    } catch (e) {
      console.log(chalk.red('X') + ' An error occurred when executing the pull-components task: ' + e.message)
      process.exit(1)
    }
  })

// push-components
program
  .command('push-components <source>')
  .option('-p, --presets-source <presetsSource>', 'Path to presets file')
  .description("Download your space's components schema as json. The source parameter can be a URL to your JSON file or a path to it")
  .action(async (source, options) => {
    console.log(`${chalk.blue('-')} Executing push-components task`)
    const space = program.space
    const presetsSource = options.presetsSource

    if (!space) {
      console.log(chalk.red('X') + ' Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(0)
    }

    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }
      api.setSpaceId(space)
      await tasks.pushComponents(api, { source, presetsSource })
    } catch (e) {
      console.log(chalk.red('X') + ' An error occurred when executing the push-components task: ' + e.message)
      process.exit(1)
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
      console.log(chalk.red('X') + ' An error occurred when executing operations to create the component: ' + e.message)
      process.exit(1)
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
      console.error(chalk.red('X') + ' An error ocurred when execute the select command: ' + e.message)
      process.exit(1)
    }
  })

// sync
program
  .command('sync')
  .description('Sync schemas, roles, folders and stories between spaces')
  .requiredOption('--type <TYPE>', 'Define what will be sync. Can be components, folders, stories, datasources or roles')
  .requiredOption('--source <SPACE_ID>', 'Source space id')
  .requiredOption('--target <SPACE_ID>', 'Target space id')
  .option('--token <OAUTH_TOKEN>', 'OAUTH token to use for authorization')
  .action(async (options) => {
    console.log(`${chalk.blue('-')} Sync data between spaces\n`)

    const {
      type,
      source,
      target,
      token
    } = options

    try {
      const _types = type.split(',') || []

      _types.forEach(_type => {
        if (!SYNC_TYPES.includes(_type)) {
          throw new Error(`The type ${_type} is not valid`)
        }
      })

      if (!token) {
        if (!api.isAuthorized()) {
          await api.processLogin()
        }
        token = creds.get().token || null
      }

      await tasks.sync(_types, {
        token,
        source,
        target
      })

      console.log('\n' + chalk.green('✓') + ' Sync data between spaces successfully completed')
    } catch (e) {
      console.error(chalk.red('X') + ' An error ocurred when syncing spaces: ' + e.message)
      process.exit(1)
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
      console.log(chalk.red('X') + ' An error ocurred when execute quickstart operations: ' + e.message)
      process.exit(1)
    }
  })

program
  .command('generate-migration')
  .description('Generate a content migration file')
  .requiredOption('-c, --component <COMPONENT_NAME>', 'Name of the component')
  .requiredOption('-f, --field <FIELD_NAME>', 'Name of the component field')
  .action(async (options) => {
    const field = options.field || ''
    const component = options.component || ''

    const space = program.space
    if (!space) {
      console.log(chalk.red('X') + ' Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(1)
    }

    console.log(`${chalk.blue('-')} Creating the migration file in ./migrations/change_${component}_${field}.js\n`)

    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      api.setSpaceId(space)
      await tasks.generateMigration(api, component, field)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when generate the migration file: ' + e.message)
      process.exit(1)
    }
  })

program
  .command('run-migration')
  .description('Run a migration file')
  .requiredOption('-c, --component <COMPONENT_NAME>', 'Name of the component')
  .requiredOption('-f, --field <FIELD_NAME>', 'Name of the component field')
  .option('--dryrun', 'Do not update the story content')
  .option('--publish <PUBLISH_OPTION>', 'Publish the content. It can be: all, published or published-with-changes')
  .option('--publish-languages <LANGUAGES>', 'Publish specific languages')
  .action(async (options) => {
    const field = options.field || ''
    const component = options.component || ''
    const isDryrun = !!options.dryrun
    const publish = options.publish || null
    const publishLanguages = options.publishLanguages || ''

    const space = program.space
    if (!space) {
      console.log(chalk.red('X') + ' Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(1)
    }

    const publishOptionsAvailable = [
      'all',
      'published',
      'published-with-changes'
    ]
    if (publish && !publishOptionsAvailable.includes(publish)) {
      console.log(chalk.red('X') + ' Please provide a correct publish option: all, published, or published-with-changes')
      process.exit(1)
    }

    console.log(`${chalk.blue('-')} Processing the migration ./migrations/change_${component}_${field}.js\n`)

    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      api.setSpaceId(space)
      await tasks.runMigration(
        api,
        component,
        field,
        { isDryrun, publish, publishLanguages }
      )
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when run the migration file: ' + e.message)
      process.exit(1)
    }
  })

program
  .command('rollback-migration')
  .description('Rollback-migration a migration file')
  .requiredOption('-c, --component <COMPONENT_NAME>', 'Name of the component')
  .requiredOption('-f, --field <FIELD_NAME>', 'Name of the component field')
  .action(async (options) => {
    const field = options.field || ''
    const component = options.component || ''
    const space = program.space
    if (!space) {
      console.log(chalk.red('X') + ' Please provide the space as argument --space YOUR_SPACE_ID.')
      process.exit(1)
    }

    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      api.setSpaceId(space)

      await tasks.rollbackMigration(api, field, component)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred when run rollback-migration: ' + e.message)
      process.exit(1)
    }
  })

// list spaces
program
  .command('spaces')
  .description('List all spaces of the logged account')
  .action(async () => {
    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      await tasks.listSpaces(api)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred to listing sapces : ' + e.message)
      process.exit(1)
    }
  })

// import data
program
  .command('import')
  .description('Import data from other systems and relational databases.')
  .requiredOption('-f, --file <FILE_NAME>', 'Name of the file')
  .requiredOption('-t, --type <TYPE>', 'Type of the content')
  .option('-fr, --folder <FOLDER_ID>', '(Optional) This is a Id of folder in storyblok')
  .option('-d, --delimiter <DELIMITER>', 'If you are using a csv file, put the file delimiter, the default is ";"')
  .action(async (options) => {
    const space = program.space

    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      if (!space) {
        console.log(chalk.red('X') + ' Please provide the space as argument --space <SPACE_ID>.')
        return
      }

      api.setSpaceId(space)
      await tasks.importFiles(api, options)

      console.log(
        `${chalk.green('✓')} The import process was executed with success!`
      )
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred to import data : ' + e.message)
      process.exit(1)
    }
  })

program.parse(process.argv)

if (program.rawArgs.length <= 2) {
  program.help()
}
