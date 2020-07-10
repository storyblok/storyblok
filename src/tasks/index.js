module.exports = {
  sync: require('./sync'),
  scaffold: require('./scaffold'),
  quickstart: require('./quickstart'),
  pullComponents: require('./pull-components'),
  pushComponents: require('./push-components'),
  generateMigration: require('./migrations/generate'),
  runMigration: require('./migrations/run'),
  listSpaces: require('./list-spaces')
}
