module.exports = {
  sync: require('./sync'),
  scaffold: require('./scaffold'),
  quickstart: require('./quickstart'),
  pullComponents: require('./pull-components'),
  pushComponents: require('./push-components'),
  generateMigration: require('./migrations/generate'),
  runMigration: require('./migrations/run'),
  rollbackMigration: require('./migrations/rollback'),
  listSpaces: require('./list-spaces'),
  importFiles: require('./import/import')
}
