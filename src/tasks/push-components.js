const axios = require('axios')
const fs = require('fs')
const chalk = require('chalk')

const isUrl = source => source.indexOf('http') === 0

/**
 * @method isGroupExists
 * @param  {Array<String>} groups
 * @param  {String} name
 * @return {Object}
 */
const getGroupByName = (groups, name) => {
  return groups.filter(group => group.name === name)[0] || {}
}

module.exports = (api, options) => {
  const { source } = options

  if (isUrl(source)) {
    return axios
      .get(source)
      .then(data => {
        const body = data.data || {}
        return push(api, body.components || [])
      })
      .catch(err => {
        console.error(`${chalk.red('X')} Can not load json file from ${source}`)
        return Promise.reject(err)
      })
  }

  const data = fs.readFileSync(source, 'utf8')
  if (data) {
    const body = JSON.parse(data)
    if (body.components) {
      return push(api, body.components)
    }

    console.error(`${chalk.red('X')} Can not load json file from ${source}`)
    return Promise.reject(new Error(`Can not load json file from ${source}`))
  }

  console.error(`${chalk.red('X')} Can not push invalid json - please provide a valid json file`)
  return Promise.reject(new Error('Can not push invalid json - please provide a valid json file'))
}

const push = async (api, components) => {
  try {
    const componentGroups = await api.getComponentGroups()

    const apiComponents = await api.getComponents()

    for (var i = 0; i < components.length; i++) {
      delete components[i].id
      delete components[i].created_at

      const groupName = components[i].component_group_name
      const groupData = getGroupByName(componentGroups, groupName)

      if (groupName) {
        if (groupData.name) {
          components[i].component_group_uuid = groupData.uuid
        } else {
          console.log(`${chalk.blue('-')} Creating the ${groupName} component group...`)
          const data = await api.post('component_groups', {
            component_group: {
              name: groupName
            }
          })

          const groupCreated = data.data.component_group

          components[i].component_group_uuid = groupCreated.uuid

          componentGroups.push(groupCreated)
        }

        delete components[i].component_group_name
      }

      const exists = apiComponents.filter(function (comp) {
        return comp.name === components[i].name
      })

      if (exists.length > 0) {
        const { id, name } = exists[0]
        console.log(`${chalk.blue('-')} Updating component ${name}...`)

        try {
          await api.put(`components/${id}`, {
            component: components[i]
          })

          console.log(`${chalk.green('✓')} Component ${name} has been updated in Storyblok!`)
        } catch (e) {
          console.error(`${chalk.red('X')} An error occurred when update component ${name}`)
          console.error(e.message)
        }
      } else {
        const { name } = components[i]
        console.log(`${chalk.blue('-')} Creating component ${name}...`)
        try {
          await api.post('components', {
            component: components[i]
          })
          console.log(`${chalk.green('✓')} Component ${name} has been updated in Storyblok!`)
        } catch (e) {
          console.error(`${chalk.red('X')} An error occurred when create component`)
          console.error(e.message)
        }
      }
    }

    return Promise.resolve(true)
  } catch (e) {
    console.error(`${chalk.red('X')} An error occurred when load components file from api`)
    return Promise.reject(e.message)
  }
}
