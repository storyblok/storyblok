const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')

const getAllSpaces = async (token) => {
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
      console.log(error);
    })

  return response
}

/**
 * @method listSpaces
 * @return {Promise}
 */

const listSpaces = async (token) => {
  console.log()
  console.log(chalk.green('✓') + ' Loading spaces...')
  console.log()

  let spaces = await getAllSpaces(token)
  
  if (spaces.length <= 0) {
    console.log(chalk.red('X') + ' No spaces were found for this user ')
    return []
  }

  spaces.map(space => {
    console.log(`${space.name} (id: ${space.id})`)
  })

  return spaces
}

module.exports = listSpaces