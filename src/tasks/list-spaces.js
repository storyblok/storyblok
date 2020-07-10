const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')

const getAllSpaces = async (token) => {
  try {
    let Storyblok = new StoryblokClient({
      oauthToken: token
    })

    let response = []

    await Storyblok
      .get('spaces/', {})
      .then((spaces) => {
        response = spaces.data.spaces
      })
      .catch((error) => {
        console.log(error)
      })

    return response
  } catch (error) {
    console.log(chalk.red('X') + ' Error making the request ' + error)
    return
  }
}

/**
 * @method listSpaces
 * @param token - This is a storyblok token to oauth access
 * @return {Promise}
 */

const listSpaces = async (token) => {
  console.log()
  console.log(chalk.green('✓') + ' Loading spaces...')
  console.log()

  if (token === null || token === '') {
    console.log(chalk.red('X') + ' This operation need a user token ')
    return []
  }

  let spaces = await getAllSpaces(token)
  
  if (!spaces) {
    console.log(chalk.red('X') + ' No spaces were found for this user ')
    return []
  }

  spaces.map(space => {
    console.log(`${space.name} (id: ${space.id})`)
  })

  return spaces
}

module.exports = listSpaces