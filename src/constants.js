const API_URL = 'https://api.storyblok.com/v1/'
const LOGIN_URL = `${API_URL}users/login`
const SIGNUP_URL = `${API_URL}users/signup`

const SYNC_TYPES = [
  'folders',
  'components',
  'roles',
  'stories'
]

module.exports = {
  LOGIN_URL,
  SIGNUP_URL,
  API_URL,
  SYNC_TYPES
}
