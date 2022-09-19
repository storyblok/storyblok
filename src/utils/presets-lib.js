const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')
const FormData = require('form-data')
const axios = require('axios')
const { last } = require('lodash')

class PresetsLib {
  /**
   * @param {{ oauthToken: string, targetSpaceId: int, region: string }} options
   */
  constructor (options) {
    this.oauthToken = options.oauthToken
    this.client = new StoryblokClient({
      oauthToken: options.oauthToken,
      region: options.region
    })
    this.targetSpaceId = options.targetSpaceId
  }

  async createPresets (presets = [], componentId, method = 'post') {
    const presetsSize = presets.length
    console.log(`${chalk.blue('-')} Pushing ${presetsSize} ${method === 'post' ? 'new' : 'existing'} presets`)

    try {
      for (let i = 0; i < presetsSize; i++) {
        const presetData = presets[i]
        const presetId = method === 'put' ? `/${presetData.id}` : ''

        await this.client[method](`spaces/${this.targetSpaceId}/presets${presetId}`, {
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
      console.error('An error ocurred while trying to save the presets ' + e.message)

      return Promise.reject(e)
    }
  }

  getComponentPresets (component = {}, presets = []) {
    console.log(`${chalk.green('-')} Get presets from component ${component.name}`)

    return presets.filter(preset => {
      return preset.component_id === component.id
    })
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

  filterPresetsFromTargetComponent (presets, targetPresets) {
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

  async getSamePresetFromTarget (spaceId, component, sourcePreset) {
    try {
      const presetsInTarget = await this.getPresets(spaceId)
      const componentPresets = this.getComponentPresets(component, presetsInTarget)
      const defaultPresetInTarget = componentPresets.find(preset => preset.name === sourcePreset.name)
      return defaultPresetInTarget
    } catch (err) {
      console.error(`An error occurred while trying to get the "${sourcePreset.name}" preset from target space: ${err.message}`)
      return null
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

module.exports = PresetsLib
