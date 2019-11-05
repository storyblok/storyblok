#!/usr/bin/env node

var chalk = require('chalk')
var clear = require('clear')
var figlet = require('figlet')
var inquirer = require('inquirer')
var parseArgs = require('minimist')

const api = require('./utils/api')
const lastStep = require('./utils/last-step')
const getOptions = require('./utils/get-options')

var pushComponents = require('./tasks/push-components')
var pullComponents = require('./tasks/pull-components')
var deleteTemplates = require('./tasks/delete-templates')
var scaffold = require('./tasks/scaffold')
const quickstart = require('./tasks/quickstart')

clear()
console.log(chalk.cyan(figlet.textSync('Storyblok')))
console.log()
console.log()
console.log('Hi, welcome to the Storyblok CLI')
console.log()

var subcommand = 'quickstart'
var cliAttribute = ''
var argv = parseArgs(process.argv.slice(2))

// TODO: refactor to use a function
if (typeof argv._[0] !== 'undefined') {
  subcommand = argv._[0]

  if (typeof argv._[1] !== 'undefined') {
    cliAttribute = argv._[1]
  }
}

const questions = getOptions(subcommand, argv, api)

if (subcommand === 'logout') {
  api.logout()
  console.log('Logged out successfully! Token has been removed from .netrc file.')
  console.log()
  process.exit(0)
}

const processAnswers = answers => {
  if (subcommand === 'quickstart') {
    answers.type = 'quickstart'
  }

  switch (subcommand) {
    case 'quickstart':
      var spaceId = argv.space
      quickstart(api, answers, spaceId)

      break
    case 'push-components':
      if (!argv.space) {
        console.log('Please provide the space id as argument --space=YOUR_SPACE_ID.')
        process.exit(0)
      }

      api.setSpaceId(argv.space)
      pushComponents(api, argv)

      break
    case 'pull-components':
      if (!argv.space) {
        console.log('Please provide the space id as argument --space=YOUR_SPACE_ID.')
        process.exit(0)
      }

      api.setSpaceId(argv.space)
      pullComponents(api, argv)

      break
    case 'delete-templates':
      if (!argv.space) {
        console.log('Please provide the space id as argument --space=YOUR_SPACE_ID.')
        process.exit(0)
      }

      api.setSpaceId(argv.space)
      deleteTemplates(api, argv)

      break
    case 'scaffold':
      if (!cliAttribute.length) {
        console.log('Second cli argument is missing.')
        process.exit(0)
      }

      scaffold(api, argv)

      break
    case 'login':
      console.log('Logged in successfully! Token has been added to .netrc file.')
      console.log()

      break
    default:
      lastStep(answers)
  }
}

inquirer
  .prompt(questions)
  .then(processAnswers)
