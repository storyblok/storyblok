const fs = require('fs')
const chalk = require('chalk')
const ghdownload = require('github-download')
const replace = require('./replace')

const lastStep = answers => {
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
        process.exit(0)
      }
    })
    .on('end', function () {
      var finalStep = 'gulp'
      
      if (answers.type == 'Fieldtype' || answers.type == 'quickstart') {
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

module.exports = lastStep