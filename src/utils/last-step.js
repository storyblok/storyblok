/* eslint-disable camelcase */

const fs = require('fs')
const chalk = require('chalk')
const ghdownload = require('git-clone')
const replace = require('./replace')

const getFinalStep = type => {
  if (type === 'Fieldtype' || type === 'quickstart') {
    return 'npm run dev'
  }

  return 'gulp'
}

const getRepository = (type, theme, custom_theme_url) => {
  const regex = /\[(.*?)\]/
  if (type === 'Theme (Storyrenderer/Hosted)' || type === 'Boilerplate (Selfhosted)') {
    if (custom_theme_url) {
      return custom_theme_url + '.git'
    } else {
      return regex.exec(theme)[1] + '.git'
    }
  }

  if (type === 'Fieldtype') {
    return 'https://github.com/storyblok/storyblok-fieldtype.git'
  }

  return 'https://github.com/storyblok/quickstart.git'
}

const lastStep = answers => {
  return new Promise((resolve, reject) => {
    const {
      type,
      theme,
      spaceId,
      name,
      custom_theme_url,
      themeToken,
      spaceDomain,
      loginToken
    } = answers

    const gitRepo = getRepository(type, theme, custom_theme_url)
    const outputDir = './' + name

    console.log(chalk.green('✓') + ' - The github repository ' + gitRepo + ' will be cloned now...')

    ghdownload(gitRepo, outputDir, async (err) => {
      if(err) {
        if (err.code === 'ENOTEMPTY') {
          console.log(chalk.red('  Oh Snap! It seems that you already have a project with the name: ' + name))
          reject(new Error('This repository already has been cloned'))
          process.exit(0)
        }

        console.log(chalk.red('X We never had this kind of issue - Sorry for that!'))
        console.log(chalk.red('X Could you send us the error below as a stackoverflow question?'))
        console.log(chalk.red('X That would be great! :)'))
        console.log(chalk.red('X Don\'t forget to mark it with the tag `storyblok` so will can find it.'))

        return reject(err)
      } else {
        const finalStep = getFinalStep(type)

        console.log(chalk.green('✓') + ' - ' + chalk.white('Your Storyblok project is ready for you!'))
        console.log(chalk.white('  Execute the following command to start Storyblok:'))
        console.log(chalk.cyan('  cd ./' + name + ' && npm install && ' + finalStep))
        console.log(chalk.white('  If you need more help, just try asking a question on stackoverflow'))
        console.log(chalk.white('  with the [storyblok] tag or live-chat with us on www.storyblok.com'))

        try {
          if (type === 'Theme (Storyrenderer/Hosted)' || type === 'quickstart') {
            fs.renameSync(outputDir + '/_token.js', outputDir + '/token.js')

            if (themeToken) {
              await replace(outputDir + '/token.js', { INSERT_TOKEN: themeToken })
            }

            var spaceConfig = {}

            if (spaceId) {
              spaceConfig.INSERT_SPACE_ID = spaceId
            }

            if (spaceDomain) {
              spaceConfig.INSERT_YOUR_DOMAIN = spaceDomain
            }

            if (loginToken) {
              spaceConfig.TEMP_QUICKSTART_TOKEN = loginToken
            }

            await replace(outputDir + '/config.js', spaceConfig)

            return resolve(true)
          }
        } catch (e) {
          return reject(new Error('An error occurred when finish the download repository task ' + e.message))
        }
      }
    })
  })
}

module.exports = lastStep
