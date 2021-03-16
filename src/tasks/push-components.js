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
  let presetsData
  if (fs.existsSync(source.replace('components.', 'presets.'))) {
    presetsData = fs.readFileSync(source.replace('components.', 'presets.'), 'utf8')
  }
  if (data) {
    const body = JSON.parse(data)
    let presetsBody
    if (presetsData) {
      presetsBody = JSON.parse(presetsData)
    }
    if (body.components) {
      return push(api, body.components, presetsBody ? presetsBody.presets : [])
    }

    console.error(`${chalk.red('X')} Can not load json file from ${source}`)
    return Promise.reject(new Error(`Can not load json file from ${source}`))
  }

  console.error(`${chalk.red('X')} Can not push invalid json - please provide a valid json file`)
  return Promise.reject(new Error('Can not push invalid json - please provide a valid json file'))
}

const getComponentPresets = (component = {}, presets) => {
  console.log(`${chalk.green('-')} Get presets from component ${component.name}`)

  return presets.filter(preset => {
    return preset.component_id === component.id
  })
}

const filterPresetsFromTargetComponent = (presets, targetPresets) => {
  console.log(chalk.blue('-') + ' Checking target presets to sync...')
  const targetPresetsNames = targetPresets.map(preset => preset.name)
  const newPresets = presets.filter(preset => !targetPresetsNames.includes(preset.name))
  const updatePresetsSource = presets.filter(preset => targetPresetsNames.includes(preset.name))
  const updatePresets = updatePresetsSource.map(source => {
    const target = targetPresets.find(target => target.name === source.name)
    return Object.assign({}, source, target, { image: source.image })
  })

  return {
    newPresets,
    updatePresets
  }
}

const createPresets = async (api, presets = [], componentId, method = 'post') => {
  const presetsSize = presets.length
  console.log(`${chalk.blue('-')} Pushing ${presetsSize} ${method === 'post' ? 'new' : 'existing'} presets`)

  try {
    for (let i = 0; i < presetsSize; i++) {
      const presetData = presets[i]
      const presetId = method === 'put' ? `/${presetData.id}` : ''

      await api[method](`presets${presetId}`, {
        preset: {
          name: presetData.name,
          component_id: componentId,
          preset: presetData.preset,
          image: presetData.image
        }
      })
    }

    console.log(`${chalk.green('✓')} ${presetsSize} presets sync`)
  } catch (e) {
    console.error('An error ocurred when save the presets' + e.message)

    return Promise.reject(e)
  }
}

const push = async (api, components, presets) => {
  try {
    const componentGroups = await api.getComponentGroups()

    const apiComponents = await api.getComponents()

    for (var i = 0; i < components.length; i++) {
      const componentPresets = getComponentPresets(components[i], presets)
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
        const componentTarget = await api.get(`components/${id}`)
        try {
          await api.put(`components/${id}`, {
            component: components[i]
          })

          console.log(`${chalk.green('✓')} Component ${name} has been updated in Storyblok!`)
        } catch (e) {
          console.error(`${chalk.red('X')} An error occurred when update component ${name}`)
          console.error(e.message)
        }
        const presetsToSave = filterPresetsFromTargetComponent(
          componentPresets || [],
          componentTarget.data.component.all_presets || []
        )
        if (presetsToSave.newPresets.length) {
          await createPresets(api, presetsToSave.newPresets, componentTarget.data.component.id, 'post')
        }
        if (presetsToSave.updatePresets.length) {
          await createPresets(api, presetsToSave.updatePresets, componentTarget.data.component.id, 'put')
        }
      } else {
        const { name } = components[i]
        console.log(`${chalk.blue('-')} Creating component ${name}...`)
        try {
          const componentRes = await api.post('components', {
            component: components[i]
          })
          if (componentPresets) {
            createPresets(api, componentPresets, componentRes.data.component.id)
          }
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
