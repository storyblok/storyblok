#!/usr/bin/env node --harmony

var chalk = require('chalk')
var clear = require('clear')
var figlet = require('figlet')
var fs = require('fs')
var path = require('path')
var inquirer = require('inquirer')
var ghdownload = require('github-download')

clear()
console.log(chalk.cyan(figlet.textSync('Storyblok')))
console.log()
console.log()
console.log('Hi, welcome to the Storyblok CLI')
console.log()

var questions = [
  {
    type: 'input',
    name: 'name',
    message: 'How should we call your new project?',
    validate: function (value) {
      if (value.length > 0) {
        return true
      }
      return 'Please enter a valid folder name for your project'
    },
    filter: function (val) {
      return val.replace(/\s+/g, '-').toLowerCase()
    }
  },
  {
    type: 'list',
    name: 'type',
    message: 'What do you wish to start with?',
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
      'Creater Theme (Blueprint) [https://github.com/storyblok/creator-theme]',
      'City Theme [https://github.com/storyblok/city-theme]',
      'Nexo Theme [https://github.com/storyblok/nexo-theme]'
    ],
    when: function (answers) {
      return answers.type == 'Theme (Storyrenderer/Hosted)'
    }
  },
  {
    type: 'list',
    name: 'theme',
    message: 'We got some Boilerplates prepared for you:',
    choices: [
      'Silex Boilerplate [https://github.com/storyblok/silex-boilerplate]',
      'NodeJs Boilerplate [https://github.com/storyblok/nodejs-boilerplate]'
    ],
    when: function (answers) {
      return answers.type == 'Boilerplate (Selfhosted)'
    }
  }
]

inquirer.prompt(questions).then(function (answers) {
  var regex = /\[(.*?)\]/;
  var gitRepo = '';
  if (answers.type == 'Theme (Storyrenderer/Hosted)' || answers.type == 'Boilerplate (Selfhosted)') {
    gitRepo = regex.exec(answers.theme)[1] + '.git'
  }
  if (answers.type == 'Fieldtype') {
    gitRepo = 'https://github.com/storyblok/storyblok-fieldtype.git'
  }

  var outputDir = './' + answers.name

  ghdownload(gitRepo, outputDir)
    .on('error', function (err) {
      if (err.code == 'ENOTEMPTY') {
        console.log()
        console.log(chalk.red('  Oh Snap! Seems that you already have a project with the name: ' + answers.name))
        console.log()
      } else {
        console.log()
        console.log(chalk.red('  We never had this kind of issue - Sorry for that!'))
        console.log(chalk.red('  Could you send us the error below on stackoverflow question'))
        console.log(chalk.red('  with the storyblok tag? - would be great! :)'))
        console.log()
        console.error(err)
        exit(0);
      }
    })
    .on('end', function () {
      console.log()
      console.log(chalk.cyan('  Your storyblok project is now ready for you:'))
      console.log()
      console.log(chalk.green('  ' + process.cwd() + '/' + answers.name))
      console.log()
      console.log(chalk.cyan('  Now it\'s your turn. Have a look at the README.md and enjoy!'))
      console.log()
      console.log(chalk.white('  If you need more help, just try asking a question on stackoverflow'))
      console.log(chalk.white('  with the [storyblok] tag - we will be there ;)'))
      console.log()
    })
})