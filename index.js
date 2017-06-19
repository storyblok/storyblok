#!/usr/bin/env node --harmony

var chalk = require('chalk')
var clear = require('clear')
var figlet = require('figlet')
var fs = require('fs')
var path = require('path')
var inquirer = require('inquirer')
var ghdownload = require('github-download')
var replace = require('./replace')
var api = require('./api')
var pushComponents = require('./tasks/push-components.js')
var pullComponents = require('./tasks/pull-components.js')

clear()
console.log(chalk.cyan(figlet.textSync('Storyblok')))
console.log()
console.log()
console.log('Hi, welcome to the Storyblok CLI')
console.log()

var subcommand = 'default'
var cliAttribute = ''

if (typeof process.argv[1] != 'undefined' && typeof process.argv[2] != 'undefined') {
  subcommand = process.argv[2]

  if (typeof process.argv[3] != 'undefined') {
    cliAttribute = process.argv[3]
  }
}

var questions = []
var email = ''

if (subcommand == 'quickstart') {
  console.log()
  console.log()

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
        return cliAttribute == ''
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
        return answers.has_account == 'Yes' || cliAttribute != ''
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
        return cliAttribute == ''
      }
    }
  ]

} else if (subcommand == 'pull-components' || subcommand == 'push-components') {
  
  questions = [
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
    },
    {
      type: 'input',
      name: 'spaceId',
      message: 'Insert the space ID where you want to execute this command:',
      validate: function (value) {
        if (value.length > 0) {
          return true
        }
        return 'Please enter a valid id:'
      }
    }
  ]

} else {
  console.log()
  console.log('No direct input command available - starting with default questions: ')
  console.log()
  
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
}


inquirer.prompt(questions).then(function (answers) {
  if (subcommand == 'quickstart') {
    answers.type = 'quickstart'
  }

  var lastStep = function () {
    var regex = /\[(.*?)\]/;
    var gitRepo = '';

    if (answers.type == 'Theme (Storyrenderer/Hosted)' || answers.type == 'Boilerplate (Selfhosted)') {
      if (answers.custom_theme_url) {
        gitRepo = answers.custom_theme_url + '.git'
      } else {
        gitRepo = regex.exec(answers.theme)[1] + '.git'
      }
    }

    if (answers.type == 'Fieldtype') {
      gitRepo = 'https://github.com/storyblok/storyblok-fieldtype.git'
    }

    if (answers.type == 'quickstart') {
      gitRepo = 'https://github.com/storyblok/quickstart.git'
    }

    var outputDir = './' + answers.name

    console.log(chalk.green('✓') + ' - The github repository ' + gitRepo + ' will be cloned now...')
    ghdownload(gitRepo, outputDir)
      .on('error', function (err) {
        if (err.code == 'ENOTEMPTY') {
          console.log()
          console.log(chalk.red('  Oh Snap! It seems that you already have a project with the name: ' + answers.name))
          console.log()
        } else {
          console.log()
          console.log(chalk.red('  We never had this kind of issue - Sorry for that!'))
          console.log(chalk.red('  Could you send us the error below as a stackoverflow question?'))
          console.log(chalk.red('  That would be great! :)'))
          console.log(chalk.red('  Don\'t forget to mark it with the tag `storyblok` so will can find it.'))
          console.log()
          console.error(err)
          exit(0);
        }
      })
      .on('end', function () {
        var finalStep = 'gulp'
        if (answers.type == 'Fieldtype') {
          finalStep = 'npm run dev'
        }

        console.log(chalk.green('✓') + ' - ' + chalk.white('Your Storyblok project is ready for you!'))
        console.log()
        console.log(chalk.white('  Execute the following command to start Storyblok:'))
        console.log(chalk.cyan('  cd ./' + answers.name + ' && npm install && ' + finalStep))
        console.log()
        console.log(chalk.white('  If you need more help, just try asking a question on stackoverflow'))
        console.log(chalk.white('  with the [storyblok] tag or live-chat with us on www.storyblok.com'))
        console.log()

        if (answers.type == 'Theme (Storyrenderer/Hosted)' || answers.type == 'quickstart') {
          fs.renameSync(outputDir + '/_token.js', outputDir + '/token.js')

          if (answers.themeToken) {
            replace(outputDir + '/token.js', { 'INSERT_TOKEN': answers.themeToken })
          }

          var spaceConfig = {}

          if (answers.spaceId) {
            spaceConfig['INSERT_SPACE_ID'] = answers.spaceId
          }

          if (answers.spaceDomain) {
            spaceConfig['INSERT_YOUR_DOMAIN'] = answers.spaceDomain
          }

          if (answers.loginToken) {
            spaceConfig['TEMP_QUICKSTART_TOKEN'] = answers.loginToken
          }

          replace(outputDir + '/config.js', spaceConfig)
        }
      })
  }

  switch (subcommand) {
    case 'quickstart':
      var space_id = ''  
      var parameter = cliAttribute.split('=')
      if (parameter.length > 1 && parameter[0] == 'space') {
        try {
          space_id = parseInt(parameter[1])
        } catch (e) {
          console.log(chalk.red('Your space id should be a number - maybe check your input again'))
          exit(401)
        } 
      } else {
        console.log(chalk.red('It seems as we don\'t know your parameter "' + cliAttribute + '" - you may want to try this: '))
        console.log(chalk.white('storyblok quickstart space=YOUR_SPACE_ID'))
        exit(402)
      }
      switch (parameter[0]) {
        case 'space':
          console.log('  Your project will be initialized now...')

          api.put('spaces/' + space_id + '/', {
            space: {
              environments: [{ name: 'Dev', location: 'http://localhost:4440/' }]
            }
          }, (space_res) => {
            answers.name = space_res.body.space.name.replace(/\s+/g, '-').toLowerCase()
            if (space_res.status == 200) {
              console.log(chalk.green('✓') + ' - Space ' + answers.name + ' updated with dev environment in Storyblok')

              api.post('tokens', {}, (tokens_res) => {
                console.log(chalk.green('✓') + ' - Configuration for your Space was loaded')
                answers.loginToken = tokens_res.body.key

                api.setSpaceId(space_res.body.space.id)
                api.get('api_keys', (keys_res) => {
                  if (keys_res.status == 200) {
                    answers.spaceId = space_res.body.space.id
                    answers.spaceDomain = space_res.body.space.domain.replace('https://', '')
                      .replace('/', '')

                    var tokens = keys_res.body.api_keys.filter((token) => {
                      return token.access == 'theme'
                    })

                    answers.themeToken = tokens[0].token

                    console.log(chalk.green('✓') + ' - Development Environment configured (./' + answers.name + '/config.js' + ')')
                    
                    lastStep()
                  } else {
                    console.log(keys_res.body)
                  }
                })
              })
            } else {
              console.log(space_res.body)
            }
          })

          break;
        default:

          console.log('  Your project will be created now...')

          api.post('spaces', {
            create_demo: false,
            dup_id: 40288,
            space: {
              name: answers.name,
              environments: [{ name: 'Dev', location: 'http://localhost:4440/' }]
            }
          }, (space_res) => {
            if (space_res.status == 200) {
              console.log(chalk.green('✓') + ' - Space ' + answers.name + ' has been created in Storyblok')
              console.log(chalk.green('✓') + ' - Story "home" has been created in your Space')

              api.post('tokens', {}, (tokens_res) => {
                console.log(chalk.green('✓') + ' - Configuration for your Space was loaded')
                answers.loginToken = tokens_res.body.key

                api.setSpaceId(space_res.body.space.id)
                api.get('api_keys', (keys_res) => {
                  if (keys_res.status == 200) {
                    answers.spaceId = space_res.body.space.id
                    answers.spaceDomain = space_res.body.space.domain.replace('https://', '')
                      .replace('/', '')

                    var tokens = keys_res.body.api_keys.filter((token) => {
                      return token.access == 'theme'
                    })

                    answers.themeToken = tokens[0].token

                    console.log(chalk.green('✓') + ' - Development Environment configured (./' + answers.name + '/config.js' + ')')
                    
                    lastStep()
                  } else {
                    console.log(keys_res.body)
                  }
                })
              })
            } else {
              console.log(space_res.body)
            }
          })
          break;
      }

      break;
    case 'push-components':
      api.setSpaceId(answers.spaceId)
      pushComponents(api, cliAttribute)

      break;
    case 'pull-components':
      api.setSpaceId(answers.spaceId)
      pullComponents(api, cliAttribute)

      break;
    default:
      lastStep()
  }

})
