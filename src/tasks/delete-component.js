const chalk = require('chalk')

/**
 *
 * @param api {Object}
 * @param componentId {Number}
 * @returns {Promise<void>}
 */
const deleteComponent = async (api, { componentId }) => {
  try {
    const { data } = await api.get(`components/${componentId}`)
    await api.delete(`components/${componentId}`)
    console.log(chalk.green('✓') + ` Component '${data.component.name}' deleted.`)
  } catch (e) {
    console.error(`${chalk.red('X')} An error ocurred in delete-component task.`)
    return Promise.reject(new Error(e))
  }
}
module.exports = deleteComponent
