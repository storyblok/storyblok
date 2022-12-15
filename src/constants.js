const API_URL = 'https://api.storyblok.com/v1/'
const US_API_URL = 'https://api-us.storyblok.com/v1/'
const CN_API_URL = 'https://api.storyblokchina.cn/v1/'
const LOGIN_URL = `${API_URL}users/login`
const SIGNUP_URL = `${API_URL}users/signup`

const SYNC_TYPES = [
  'folders',
  'components',
  'roles',
  'stories',
  'datasources'
]

const COMMANDS = {
  GENERATE_MIGRATION: 'generate-migration',
  IMPORT: 'import',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PULL_COMPONENTS: 'pull-components',
  PUSH_COMPONENTS: 'push-components',
  QUICKSTART: 'quickstart',
  ROLLBACK_MIGRATION: 'rollback-migration',
  RUN_MIGRATION: 'run-migration',
  SCAFFOLD: 'scaffold',
  SELECT: 'select',
  SPACES: 'spaces',
  SYNC: 'sync'
}

module.exports = {
  LOGIN_URL,
  SIGNUP_URL,
  API_URL,
  SYNC_TYPES,
  US_API_URL,
  CN_API_URL,
  COMMANDS
}
