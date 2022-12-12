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
const { SYNC_TYPES, COMMANDS } = require('./constants')

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
  .command(COMMANDS.LOGIN)
  .description('Login to the Storyblok cli')
  .action(async (options) => {
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

// getUser
program
  .command('user')
  .description('Get the currently logged in user')
  .action(async () => {
    if (api.isAuthorized()) {
      try {
        const user = await api.getUser()
        console.log(chalk.green('✓') + ` Hi ${user.friendly_name}, you current logged in with: ${creds.get().email}`)
      } catch (e) {
        console.log(chalk.red('X') + ` Please check if your current region matches your user's region: ${e.message}.`)
      } finally {
        process.exit(0)
      }
    }
    console.log(chalk.red('X') + ' There is currently no user logged.')
  })

// logout
program
  .command(COMMANDS.LOGOUT)
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

// pull-languages
program
  .command('pull-languages')
  .description("Download your space's languages schema as json")
  .action(async () => {
    console.log(`${chalk.blue('-')} Executing pull-languages task`)
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
      await tasks.pullLanguages(api, { space })
    } catch (e) {
      console.log(chalk.red('X') + ' An error occurred when executing the pull-languages task: ' + e.message)
      process.exit(1)
    }
  })

// pull-components
program
  .command(COMMANDS.PULL_COMPONENTS)
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
      errorHandler(e, COMMANDS.PULL_COMPONENTS)
    }
  })

// push-components
program
  .command(COMMANDS.PUSH_COMPONENTS + ' <source>')
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
      errorHandler(e, COMMANDS.PUSH_COMPONENTS)
    }
  })

// delete-component
program
  .command('delete-component <component>')
  .description('Delete a single component on your space.')
  .action(async (component) => {
    console.log(`${chalk.blue('-')} Executing delete-component task`)
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
      await tasks.deleteComponent(api, { comp: component })
    } catch (e) {
      console.log(chalk.red('X') + ' An error occurred when executing the delete-component task: ' + e.message)
      process.exit(1)
    }
  })

// delete-components
program
  .command('delete-components <source>')
  .description('Delete all components in your space that occur in your source file.')
  .option('-r, --reverse', 'Delete all components in your space that do not appear in your source.', false)
  .option('--dryrun', 'Does not perform any delete changes on your space.')
  .action(async (source, options) => {
    console.log(`${chalk.blue('-')} Executing delete-components task`)
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
      await tasks.deleteComponents(api, { source, dryRun: !!options.dryrun, reversed: !!options.reverse })
    } catch (e) {
      console.log(chalk.red('X') + ' An error occurred when executing the delete-component task: ' + e.message)
      process.exit(1)
    }
  })

// scaffold
program
  .command(COMMANDS.SCAFFOLD + ' <name>')
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
  .command(COMMANDS.SELECT)
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
  .command(COMMANDS.SYNC)
  .description('Sync schemas, roles, folders and stories between spaces')
  .requiredOption('--type <TYPE>', 'Define what will be sync. Can be components, folders, stories, datasources or roles')
  .requiredOption('--source <SPACE_ID>', 'Source space id')
  .requiredOption('--target <SPACE_ID>', 'Target space id')
  .action(async (options) => {
    console.log(`${chalk.blue('-')} Sync data between spaces\n`)

    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      const {
        type,
        source,
        target
      } = options

      const _types = type.split(',') || []
      _types.forEach(_type => {
        if (!SYNC_TYPES.includes(_type)) {
          throw new Error(`The type ${_type} is not valid`)
        }
      })

      const token = creds.get().token || null

      await tasks.sync(_types, {
        api,
        token,
        source,
        target
      })

      console.log('\n' + chalk.green('✓') + ' Sync data between spaces successfully completed')
    } catch (e) {
      errorHandler(e, COMMANDS.SYNC)
    }
  })

// quickstart
program
  .command(COMMANDS.QUICKSTART)
  .description('Start a project quickly')
  .action(async () => {
    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

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
  .command(COMMANDS.GENERATE_MIGRATION)
  .description('Generate a content migration file')
  .requiredOption('-c, --component <COMPONENT_NAME>', 'Name of the component')
  .requiredOption('-f, --field <FIELD_NAME>', 'Name of the component field')
  .action(async (options) => {
    const { field = '' } = options
    const { component = '' } = options

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
  .command(COMMANDS.RUN_MIGRATION)
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
  .command(COMMANDS.ROLLBACK_MIGRATION)
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
  .command(COMMANDS.SPACES)
  .description('List all spaces of the logged account')
  .action(async () => {
    try {
      if (!api.isAuthorized()) {
        await api.processLogin()
      }

      await tasks.listSpaces(api)
    } catch (e) {
      console.log(chalk.red('X') + ' An error ocurred to listing spaces: ' + e.message)
      process.exit(1)
    }
  })

// import data
program
  .command(COMMANDS.IMPORT)
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

function errorHandler (e, command) {
  if (/404/.test(e.message)) {
    console.log(chalk.yellow('/!\\') + ' If your space was created under US or CN region, you must provide the region us or cn upon login.')
  } else {
    console.log(chalk.red('X') + ' An error occurred when executing the ' + command + ' task: ' + e || e.message)
  }
  process.exit(1)
}
