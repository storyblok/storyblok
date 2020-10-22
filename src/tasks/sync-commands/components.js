const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')
const { find, last } = require('lodash')
const SyncComponentGroups = require('./component-groups')
const { findByProperty } = require('../../utils')
const FormData = require('form-data')
const axios = require('axios')

class SyncComponents {
  /**
   * @param {{ sourceSpaceId: string, targetSpaceId: string, oauthToken: string }} options
   */
  constructor (options) {
    this.sourcePresets = []
    this.targetComponents = []
    this.sourceComponents = []
    this.sourceSpaceId = options.sourceSpaceId
    this.targetSpaceId = options.targetSpaceId
    this.oauthToken = options.oauthToken
    this.client = new StoryblokClient({
      oauthToken: options.oauthToken
    })
  }

  async sync () {
    const syncComponentGroupsInstance = new SyncComponentGroups({
      oauthToken: this.oauthToken,
      sourceSpaceId: this.sourceSpaceId,
      targetSpaceId: this.targetSpaceId
    })

    try {
      const componentsGroupsSynced = await syncComponentGroupsInstance.sync()
      this.sourceComponentGroups = componentsGroupsSynced.source
      this.targetComponentGroups = componentsGroupsSynced.target

      console.log(`${chalk.green('-')} Syncing components...`)
      // load data from target and source spaces
      this.sourceComponents = await this.getComponents(this.sourceSpaceId)
      this.targetComponents = await this.getComponents(this.targetSpaceId)

      this.sourcePresets = await this.getPresets(this.sourceSpaceId)

      console.log(
        `${chalk.blue('-')} In source space #${this.targetSpaceId}, it were found: `
      )
      console.log(`  - ${this.sourcePresets.length} presets`)
      console.log(`  - ${this.sourceComponentGroups.length} groups`)
      console.log(`  - ${this.sourceComponents.length} components`)

      console.log(
        `${chalk.blue('-')} In target space #${this.sourceSpaceId}, it were found: `
      )
      console.log(`  - ${this.targetComponentGroups.length} groups`)
      console.log(`  - ${this.targetComponents.length} components`)
    } catch (e) {
      console.error('An error ocurred when load data to sync: ' + e.message)

      return Promise.reject(e)
    }

    for (var i = 0; i < this.sourceComponents.length; i++) {
      console.log()

      const component = this.sourceComponents[i]
      console.log(chalk.blue('-') + ` Processing component ${component.name}`)

      const componentPresets = this.getComponentPresets(component)

      delete component.id
      delete component.created_at

      const sourceGroupUuid = component.component_group_uuid

      // if the component belongs to a group
      if (sourceGroupUuid) {
        const sourceGroup = findByProperty(
          this.sourceComponentGroups,
          'uuid',
          sourceGroupUuid
        )

        const targetGroupData = findByProperty(
          this.targetComponentGroups,
          'name',
          sourceGroup.name
        )

        console.log(
          `${chalk.yellow('-')} Linking the component to the group ${targetGroupData.name}`
        )
        component.component_group_uuid = targetGroupData.uuid
      }

      // Create new component on target space
      try {
        const componentCreated = await this.createComponent(
          this.targetSpaceId,
          component
        )

        console.log(chalk.green('✓') + ` Component ${component.name} created`)

        if (componentPresets.length) {
          await this.createPresets(componentPresets, componentCreated.id)
        }
      } catch (e) {
        if (e.response && e.response.status && e.response.status === 422) {
          console.log(
            `${chalk.yellow('-')} Component ${component.name} already exists, updating it...`
          )

          const componentTarget = this.getTargetComponent(component.name)

          await this.updateComponent(
            this.targetSpaceId,
            componentTarget.id,
            component,
            componentTarget
          )
          console.log(chalk.green('✓') + ` Component ${component.name} synced`)

          const presetsToSave = this.filterPresetsFromTargetComponent(
            componentPresets || [],
            componentTarget.all_presets || []
          )

          if (presetsToSave.newPresets.length) {
            await this.createPresets(presetsToSave.newPresets, componentTarget.id, 'post')
          }

          if (presetsToSave.updatePresets.length) {
            await this.createPresets(presetsToSave.updatePresets, componentTarget.id, 'put')
          }

          console.log(chalk.green('✓') + ' Presets in sync')
        } else {
          console.error(chalk.red('X') + ` Component ${component.name} sync failed: ${e.message}`)
        }
      }
    }
  }

  async getPresets (spaceId) {
    console.log(`${chalk.green('-')} Load presets from space #${spaceId}`)

    try {
      const response = await this.client.get(
        `spaces/${spaceId}/presets`
      )

      return response.data.presets || []
    } catch (e) {
      console.error('An error ocurred when load presets ' + e.message)

      return Promise.reject(e)
    }
  }

  getComponentPresets (component = {}) {
    console.log(`${chalk.green('-')} Get presets from component ${component.name}`)

    return this.sourcePresets.filter(preset => {
      return preset.component_id === component.id
    })
  }

  getComponents (spaceId) {
    console.log(
      `${chalk.green('-')} Load components from space #${spaceId}`
    )

    return this.client.get(`spaces/${spaceId}/components`)
      .then(response => response.data.components || [])
  }

  getTargetComponent (name) {
    return find(this.targetComponents, ['name', name]) || {}
  }

  filterPresetsFromTargetComponent (presets, targetPresets) {
    console.log(chalk.blue('-') + ' Checking target presets to sync')
    const targetPresetsNames = targetPresets.map(preset => preset.name)
    const newPresets = presets.filter(preset => !targetPresetsNames.includes(preset.name))
    const updatePresetsSource = presets.filter(preset => targetPresetsNames.includes(preset.name))
    const updatePresets = updatePresetsSource.map(source => {
      const target = targetPresets.find(target => target.name === source.name)
      return Object.assign({}, source, target)
    })

    return {
      newPresets,
      updatePresets
    }
  }

  createComponent (spaceId, componentData) {
    const payload = {
      component: {
        ...componentData,
        schema: this.mergeComponentSchema(
          componentData.schema
        )
      }
    }

    return this
      .client
      .post(`spaces/${spaceId}/components`, payload)
      .then(response => {
        const component = response.data.component || {}

        return component
      })
      .catch(error => Promise.reject(error))
  }

  updateComponent (
    spaceId,
    componentId,
    sourceComponentData,
    targetComponentData
  ) {
    const payload = {
      component: this.mergeComponents(
        sourceComponentData,
        targetComponentData
      )
    }
    return this
      .client
      .put(`spaces/${spaceId}/components/${componentId}`, payload)
  }

  mergeComponents (sourceComponent, targetComponent = {}) {
    const data = {
      ...sourceComponent,
      ...targetComponent
    }

    // handle specifically
    data.schema = this.mergeComponentSchema(
      sourceComponent.schema
    )

    return data
  }

  mergeComponentSchema (sourceSchema) {
    return Object.keys(sourceSchema).reduce((acc, key) => {
      // handle blocks separately
      const sourceSchemaItem = sourceSchema[key]
      if (sourceSchemaItem.type === 'bloks') {
        acc[key] = this.mergeBloksSchema(sourceSchemaItem)
        return acc
      }

      acc[key] = sourceSchemaItem

      return acc
    }, {})
  }

  mergeBloksSchema (sourceData) {
    return {
      ...sourceData,
      // prevent missing refence to group in whitelist
      component_group_whitelist: this.getWhiteListFromSourceGroups(
        sourceData.component_group_whitelist || []
      )
    }
  }

  getWhiteListFromSourceGroups (whiteList = []) {
    return whiteList.map(sourceGroupUuid => {
      const sourceGroupData = findByProperty(
        this.sourceComponentGroups,
        'uuid',
        sourceGroupUuid
      )

      const targetGroupData = findByProperty(
        this.targetComponentGroups,
        'name',
        sourceGroupData.name
      )

      return targetGroupData.uuid
    })
  }

  async createPresets (presets = [], componentId, method = 'post') {
    const presetsSize = presets.length
    console.log(`${chalk.yellow('-')} Syncing ${presetsSize} ${method === 'post' ? 'new' : 'existing'} presets to space #${this.targetSpaceId}`)

    try {
      for (let i = 0; i < presetsSize; i++) {
        const presetData = presets[i]
        const presetId = method === 'put' ? `/${presetData.id}` : ''

        await this.client[method](`spaces/${this.targetSpaceId}/presets${presetId}`, {
          preset: {
            name: presetData.name,
            component_id: componentId,
            space_id: this.targetSpaceId,
            preset: presetData.preset,
            image: presetData.image
          }
        })
      }

      console.log(`${chalk.green('✓')} ${presetsSize} presets sync in space (#${this.targetSpaceId})`)
    } catch (e) {
      console.error('An error ocurred when save the presets' + e.message)

      return Promise.reject(e)
    }
  }

  async uploadImageForPreset (image = '') {
    const imageName = last(image.split('/'))

    return this.client
      .post(`spaces/${this.targetSpaceId}/assets`, {
        filename: imageName,
        asset_folder_id: null
      })
      .then(res => this.uploadFileToS3(res.data, image, imageName))
      .catch(e => Promise.reject(e))
  }

  async uploadFileToS3 (signedRequest, imageUrl, name) {
    try {
      const response = await axios.get(`https:${imageUrl}`, {
        responseType: 'arraybuffer'
      })

      return new Promise((resolve, reject) => {
        const form = new FormData()
        for (const key in signedRequest.fields) {
          form.append(key, signedRequest.fields[key])
        }

        form.append('file', response.data)

        form.submit(signedRequest.post_url, (err, res) => {
          if (err) {
            console.log(`${chalk.red('X')} There was an error uploading the image`)
            return reject(err)
          }
          console.log(`${chalk.green('✓')} Uploaded ${name} image successfully!`)
          return resolve(signedRequest.pretty_url)
        })
      })
    } catch (e) {
      console.error('An error occurred while uploading the image ' + e.message)
    }
  }
}

module.exports = SyncComponents
