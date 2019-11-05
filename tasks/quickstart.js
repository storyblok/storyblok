const opn = require('opn')
const chalk = require('chalk')
const lastStep = require('../lib/last-step')

const quickstart = (api, answers, spaceId) => {
  if (typeof spaceId !== 'undefined') {
    console.log('  Your project will be initialized now...')

    const config = {
      space: {
        environments: [{ name: 'Dev', location: 'http://localhost:4440/' }]
      }
    }

    const spaceUrl = 'spaces/' + spaceId + '/'

    api.put(spaceUrl, config, (spaceRes) => {
      if (spaceRes.status == 200) {
        answers.name = spaceRes.body.space.name.replace(/\s+/g, '-').toLowerCase()
        console.log(chalk.green('✓') + ' - Space ' + answers.name + ' updated with dev environment in Storyblok')

        api.post('tokens', {}, (tokens_res) => {
          console.log(chalk.green('✓') + ' - Configuration for your Space was loaded')
          answers.loginToken = tokens_res.body.key

          api.setSpaceId(spaceRes.body.space.id)
          api.get('api_keys', (keysRes) => {
            if (keysRes.status == 200) {
              answers.spaceId = spaceRes.body.space.id
              answers.spaceDomain = spaceRes.body.space.domain.replace('https://', '')
                .replace('/', '')

              var tokens = keysRes.body.api_keys.filter((token) => {
                return token.access == 'theme'
              })

              // TODO: prevent erros when tokens is empty
              answers.themeToken = tokens[0].token

              console.log(chalk.green('✓') + ' - Development Environment configured (./' + answers.name + '/config.js' + ')')
              
              lastStep(answers)
            } else {
              console.log(keysRes.body)
            }
          })
        })
      } else {
        console.log('  Something went wrong, be sure that you inserted the right space id.')
        console.log(spaceRes.body)
      }
    })

    return
  }

  console.log('  Your project will be created now...')
  const config = {
    // create_demo: true,
    space: {
      name: answers.name
    }
  }

  api.post('spaces', config, (spaceRes) => {
    if (spaceRes.status == 200) {
      console.log(chalk.green('✓') + ' - Space ' + answers.name + ' has been created in Storyblok')
      console.log(chalk.green('✓') + ' - Story "home" has been created in your Space')

      api.post('tokens', {}, (tokens_res) => {
        console.log(chalk.green('✓') + ' - Configuration for your Space was loaded')
        answers.loginToken = tokens_res.body.key

        api.setSpaceId(spaceRes.body.space.id)
        api.get('api_keys', (keysRes) => {
          if (keysRes.status == 200) {
            answers.spaceId = spaceRes.body.space.id
            answers.spaceDomain = spaceRes.body.space.domain.replace('https://', '')
              .replace('/', '')

            var tokens = keysRes.body.api_keys.filter((token) => {
              return token.access == 'theme'
            })

            console.log(chalk.green('✓') + ' - Starting Storyblok in your browser')
            
            setTimeout(() => {
              opn('http://' + answers.spaceDomain + '/_quickstart?quickstart=' + answers.loginToken)
              process.exit(0)
            }, 2000)
                                
            
          } else {
            console.log(keysRes.body)
          }
        })
      })
    } else {
      console.log(spaceRes.body)
    }
  })
}

module.exports = quickstart