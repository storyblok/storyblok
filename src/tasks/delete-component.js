const chalk = require('chalk')
const { getComponentsFromName } = require('./migrations/utils')

/**
 *
 * @param api {Object}
 * @param comp {String | Number}
 * @param dryrun {Boolean}
 * @returns {Promise<void>}
 */
const deleteComponent = async (api, { comp, dryrun = false }) => {
  try {
    let component
    if (!isNaN(comp)) {
      const { data } = await api.get(`components/${comp}`)
      component = data.component
    } else {
      component = await getComponentsFromName(api, comp)
    }
    if (Object.keys(component).length === 0) {
      return Promise.reject(new Error(`Component ${comp} not found.`))
    }
    if (!dryrun) {
      await api.delete(`components/${component.id}`)
    }
    console.log(chalk.green('✓') + ' Component ' + chalk.blue(component.name) + ' deleted.')
  } catch (e) {
    console.error(`${chalk.red('X')} An error occurred in delete-component task.`)
    return Promise.reject(new Error(e))
  }
}
module.exports = deleteComponent
