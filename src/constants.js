const EU_API_URL = 'https://api.storyblok.com/v1/'
const EU_LOGIN_URL = `${EU_API_URL}users/login`
const EU_SIGNUP_URL = `${EU_API_URL}users/signup`

const US_API_URL = 'https://api-us.storyblok.com/v1/'
const US_LOGIN_URL = `${US_API_URL}users/login`
const US_SIGNUP_URL = `${US_API_URL}users/signup`

const SYNC_TYPES = [
  'folders',
  'components',
  'roles',
  'stories',
  'datasources'
]

module.exports = {
  EU_LOGIN_URL,
  EU_SIGNUP_URL,
  EU_API_URL,
  US_API_URL,
  US_LOGIN_URL,
  US_SIGNUP_URL,
  SYNC_TYPES
}
