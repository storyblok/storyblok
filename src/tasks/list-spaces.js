const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')

/**
 * @method listSpaces
 * @return {Promise}
 */

const getAllSpaces = async (options) => {
  let Storyblok = new StoryblokClient({
    oauthToken: ''
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

const listSpaces = async (options) => {
  console.log(chalk.green('✓') + ' Loading spaces...')
  console.log()

  let spaces = await getAllSpaces()
  spaces.map(space => {
    console.log(`${space.name} (id: ${space.id})`)
  })

  return spaces
}

module.exports = listSpaces