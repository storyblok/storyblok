#!/usr/bin/env node

var chalk = require('chalk')
var clear = require('clear')
var figlet = require('figlet')
var inquirer = require('inquirer')
var parseArgs = require('minimist')

var api = require('./api')
const lastStep = require('./lib/last-step')

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
if (typeof argv._[0] != 'undefined') {
  subcommand = argv._[0]

  if (typeof argv._[1] != 'undefined') {
    cliAttribute = argv._[1]
  }
}

var questions = []
var email = ''

// TODO: refactor to use a function
if (['select'].indexOf(subcommand) > -1) {
  console.log()
  console.log()

  subcommand = 'select';

  questions = [
    {
      type: 'input',
      name: 'name',
      message: 'How should your Project be named?',
      validate: function (value) {
        if (value.length > 0) {
          return true
        }
        return 'Please enter a valid name for your project:'
      },
      filter: function (val) {
        return val.replace(/\s+/g, '-').toLowerCase()
      }
    },
    {
      type: 'list',
      name: 'type',
      message: 'Select the type of your project:',
      choices: [
        'Theme (Storyrenderer/Hosted)',
        'Boilerplate (Selfhosted)',
        'Fieldtype'
      ]
    },
    {
      type: 'list',
      name: 'theme',
      message: 'We got some Themes prepared for you:',
      choices: [
        'Creator Theme (Blueprint) [https://github.com/storyblok/creator-theme]',
        'City Theme [https://github.com/storyblok/city-theme]',
        'Nexo Theme [https://github.com/storyblok/nexo-theme]',
        'Custom Theme [We will ask you about your Github URL]'
      ],
      when: function (answers) {
        return answers.type == 'Theme (Storyrenderer/Hosted)'
      }
    },
    {
      type: 'input',
      name: 'custom_theme_url',
      message: 'What is your github theme URL? Tip: should look like: "https://github.com/storyblok/city-theme"',
      when: function (answers) {
        return answers.theme == 'Custom Theme [We will ask you about your Github URL]'
      }
    },
    {
      type: 'list',
      name: 'theme',
      message: 'We got some Boilerplates prepared for you:',
      choices: [
        'PHP - Silex Boilerplate [https://github.com/storyblok/silex-boilerplate]',
        'JavaScript - NodeJs Boilerplate [https://github.com/storyblok/nodejs-boilerplate]',
        'Ruby - Sinatra Boilerplate [https://github.com/storyblok/sinatra-boilerplate]',
        'Python - Django Boilerplate [https://github.com/storyblok/django-boilerplate]',
        'JavaScript - VueJs Boilerplate [https://github.com/storyblok/vuejs-boilerplate]',
        'Custom Boilerplate [We will ask you about your Github URL]'
      ],
      when: function (answers) {
        return answers.type == 'Boilerplate (Selfhosted)'
      }
    },
    {
      type: 'input',
      name: 'custom_theme_url',
      message: 'What is your github boilerplate URL? Tip: should look like: "https://github.com/storyblok/silex-boilerplate"',
      when: function (answers) {
        return answers.theme == 'Custom Boilerplate [We will ask you about your Github URL]'
      }
    },
    {
      type: 'input',
      name: 'spaceId',
      message: 'What is your space ID? Tip: You can find the space ID in the dashboard on https://app.storyblok.com:',
      when: function (answers) {
        return answers.type == 'Theme (Storyrenderer/Hosted)'
      }
    },
    {
      type: 'input',
      name: 'spaceDomain',
      message: 'What is your domain? Example: city.me.storyblok.com:',
      when: function (answers) {
        return answers.type == 'Theme (Storyrenderer/Hosted)'
      },
      filter: function (val) {
        return val.replace(/https:/g, '').replace(/\//g, '')
      }
    },
    {
      type: 'input',
      name: 'themeToken',
      message: 'What is your theme token?',
      when: function (answers) {
        return answers.type == 'Theme (Storyrenderer/Hosted)'
      }
    }
  ]

} else if (['logout'].indexOf(subcommand) > -1) {
  api.logout();
  console.log('Logged out successfully! Token has been removed from .netrc file.');
  console.log();
  process.exit(0);

} else if (['delete-templates', 'pull-components', 'push-components', 'scaffold', 'login'].indexOf(subcommand) > -1) {

  var loginQuestions = [
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address:',
      validate: function (value) {
        email = value
        if (value.length > 0) {
          return true
        }
        return 'Please enter a valid email:'
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      validate: function (value) {
        var done = this.async();

        api.login(email, value, (data) => {
          if (data.status == 200) {
            done(null, true)
          } else {
            done('Password seams to be wrong. Please try again:')
          }
        })
      }
    }
  ]
  
  questions = []

  if (!api.isAuthorized()) {
    questions = loginQuestions
  }

} else {
  console.log()
  console.log()

  subcommand = 'quickstart'
  questions = [
    {
      type: 'list',
      name: 'has_account',
      message: 'Do you have already a Storyblok account?',
      choices: [
        'No',
        'Yes'
      ],
      when: function (answers) {
        return !api.isAuthorized() && !argv.space
      }
    },
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address:',
      validate: function (value) {
        email = value
        if (value.length > 0) {
          return true
        }
        return 'Please enter a valid email:'
      },
      when: function (answers) {
        return !api.isAuthorized()
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Define your password:',
      validate: function (value) {
        var done = this.async();

        api.signup(email, value, (data) => {
          if (data.status == 200) {
            done(null, true)
          } else {
            done('Failed: ' + JSON.stringify(data.body) + '. Please try again:')
          }
        })
      },
      when: function (answers) {
        return answers.has_account == 'No'
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      validate: function (value) {
        var done = this.async();

        api.login(email, value, (data) => {
          if (data.status == 200) {
            done(null, true)
          } else {
            done('Password seams to be wrong. Please try again:')
          }
        })
      },
      when: function (answers) {
        return answers.has_account == 'Yes' || (!api.isAuthorized() && !answers.has_account)
      }
    },
    {
      type: 'input',
      name: 'name',
      message: 'How should your Project be named?',
      validate: function (value) {
        if (value.length > 0) {
          return true
        }
        return 'Please enter a valid name for your project:'
      },
      filter: function (val) {
        return val.replace(/\s+/g, '-').toLowerCase()
      },
      when: function (answers) {
        return !argv.space
      }
    }
  ]
}


inquirer.prompt(questions).then(function (answers) {
  if (subcommand == 'quickstart') {
    answers.type = 'quickstart'
  }

  switch (subcommand) {
    case 'quickstart':
      var spaceId = argv.space
      quickstart(api, answers, spaceId)

      break;
    case 'push-components':
      if (!argv.space) {
        console.log('Please provide the space id as argument --space=YOUR_SPACE_ID.')
        process.exit(0)
      }

      api.setSpaceId(argv.space)
      pushComponents(api, argv)


      break;
    case 'pull-components':
      if (!argv.space) {
        console.log('Please provide the space id as argument --space=YOUR_SPACE_ID.')
        process.exit(0)
      }

      api.setSpaceId(argv.space)
      pullComponents(api, argv)

      break;
    case 'delete-templates':
      if (!argv.space) {
        console.log('Please provide the space id as argument --space=YOUR_SPACE_ID.')
        process.exit(0)
      }

      api.setSpaceId(argv.space)
      deleteTemplates(api, argv)

      break;
    case 'scaffold':
      if (!cliAttribute.length) {
        console.log('Second cli argument is missing.')
        process.exit(0)
      }

      scaffold(api, argv)

      break;
    case 'login':
      console.log('Logged in successfully! Token has been added to .netrc file.')
      console.log()

      break;
    default:
      lastStep(answers)
  }
})
