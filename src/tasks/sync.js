const pSeries = require('p-series')
const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')
const SyncComponents = require('./sync-commands/components')
const { capitalize } = require('../utils')

const SyncSpaces = {
  targetComponents: [],
  sourceComponents: [],

  init (options) {
    console.log(chalk.green('✓') + ' Loading options')
    this.sourceSpaceId = options.source
    this.targetSpaceId = options.target
    this.oauthToken = options.token
    this.client = new StoryblokClient({
      oauthToken: options.token
    }, options.api)
  },

  async syncStories () {
    console.log(chalk.green('✓') + ' Syncing stories...')
    var targetFolders = await this.client.getAll(`spaces/${this.targetSpaceId}/stories`, {
      folder_only: 1,
      sort_by: 'slug:asc'
    })

    var folderMapping = {}

    for (let i = 0; i < targetFolders.length; i++) {
      var folder = targetFolders[i]
      folderMapping[folder.full_slug] = folder.id
    }

    var all = await this.client.getAll(`spaces/${this.sourceSpaceId}/stories`, {
      story_only: 1
    })

    for (let i = 0; i < all.length; i++) {
      console.log(chalk.green('✓') + ' Starting update ' + all[i].full_slug)

      var storyResult = await this.client.get('spaces/' + this.sourceSpaceId + '/stories/' + all[i].id)
      var sourceStory = storyResult.data.story
      var slugs = sourceStory.full_slug.split('/')
      var folderId = 0

      if (slugs.length > 1) {
        slugs.pop()
        var folderSlug = slugs.join('/')

        if (folderMapping[folderSlug]) {
          folderId = folderMapping[folderSlug]
        } else {
          console.error(chalk.red('X') + 'The folder does not exist ' + folderSlug)
          continue
        }
      }

      sourceStory.parent_id = folderId

      try {
        var existingStory = await this.client.get('spaces/' + this.targetSpaceId + '/stories', { with_slug: all[i].full_slug })
        var payload = {
          story: sourceStory,
          force_update: '1'
        }
        if (sourceStory.published) {
          payload.publish = '1'
        }

        if (existingStory.data.stories.length === 1) {
          await this.client.put('spaces/' + this.targetSpaceId + '/stories/' + existingStory.data.stories[0].id, payload)
          console.log(chalk.green('✓') + ' Updated ' + existingStory.data.stories[0].full_slug)
        } else {
          await this.client.post('spaces/' + this.targetSpaceId + '/stories', payload)
          console.log(chalk.green('✓') + ' Created ' + sourceStory.full_slug)
        }
      } catch (e) {
        console.log(e)
      }
    }

    return Promise.resolve(all)
  },

  async syncFolders () {
    console.log(chalk.green('✓') + ' Syncing folders...')
    const sourceFolders = await this.client.getAll(`spaces/${this.sourceSpaceId}/stories`, {
      folder_only: 1,
      sort_by: 'slug:asc'
    })
    const syncedFolders = {}

    for (var i = 0; i < sourceFolders.length; i++) {
      const folder = sourceFolders[i]
      const folderId = folder.id
      delete folder.id
      delete folder.created_at

      if (folder.parent_id) {
        // Parent child resolving
        if (!syncedFolders[folderId]) {
          const folderSlug = folder.full_slug.split('/')
          const parentFolderSlug = folderSlug.splice(0, folderSlug.length - 1).join('/')

          const existingFolders = await this.client.get(`spaces/${this.targetSpaceId}/stories`, {
            with_slug: parentFolderSlug
          })

          if (existingFolders.data.stories.length) {
            folder.parent_id = existingFolders.data.stories[0].id
          } else {
            folder.parent_id = 0
          }
        } else {
          folder.parent_id = syncedFolders[folderId]
        }
      }

      try {
        const newFolder = await this.client.post(`spaces/${this.targetSpaceId}/stories`, {
          story: folder
        })

        syncedFolders[folderId] = newFolder.data.story.id
        console.log(`Folder ${newFolder.data.story.name} created`)
      } catch (e) {
        console.log(`Folder ${folder.name} already exists`)
      }
    }
  },

  async syncRoles () {
    console.log(chalk.green('✓') + ' Syncing roles...')
    const existingFolders = await this.client.getAll(`spaces/${this.targetSpaceId}/stories`, {
      folder_only: 1,
      sort_by: 'slug:asc'
    })

    const roles = await this.client.get(`spaces/${this.sourceSpaceId}/space_roles`)
    const existingRoles = await this.client.get(`spaces/${this.targetSpaceId}/space_roles`)

    for (var i = 0; i < roles.data.space_roles.length; i++) {
      const spaceRole = roles.data.space_roles[i]
      delete spaceRole.id
      delete spaceRole.created_at

      spaceRole.allowed_paths = []

      spaceRole.resolved_allowed_paths.forEach((path) => {
        const folders = existingFolders.filter((story) => {
          return story.full_slug + '/' === path
        })

        if (folders.length) {
          spaceRole.allowed_paths.push(folders[0].id)
        }
      })

      const existingRole = existingRoles.data.space_roles.filter((role) => {
        return role.role === spaceRole.role
      })
      if (existingRole.length) {
        await this.client.put(`spaces/${this.targetSpaceId}/space_roles/${existingRole[0].id}`, {
          space_role: spaceRole
        })
      } else {
        await this.client.post(`spaces/${this.targetSpaceId}/space_roles`, {
          space_role: spaceRole
        })
      }
      console.log(chalk.green('✓') + ` Role ${spaceRole.role} synced`)
    }
  },

  async syncComponents () {
    const syncComponentsInstance = new SyncComponents({
      sourceSpaceId: this.sourceSpaceId,
      targetSpaceId: this.targetSpaceId,
      oauthToken: this.oauthToken
    })

    try {
      await syncComponentsInstance.sync()
    } catch (e) {
      console.error(
        chalk.red('X') + ` Sync failed: ${e.message}`
      )
      console.log(e)

      return Promise.reject(new Error(e))
    }
  },

  async getDatasourceEntries (spaceId, datasourceId) {
    const entriesFirstPage = await this.client.get(`spaces/${spaceId}/datasource_entries/?datasource_id=${datasourceId}`)
    const entriesRequets = []
    for (let i = 1; i < Math.ceil(entriesFirstPage.total / 25); i++) {
      entriesRequets.push(this.client.get(`spaces/${spaceId}/datasource_entries/?datasource_id=${datasourceId}`, { page: i }))
    }
    return entriesFirstPage.data.datasource_entries.concat((await Promise.all(entriesRequets)).map(r => r.data.datasource_entries))
  },

  async syncDatasources () {
    console.log(chalk.green('✓') + ' Syncing datasources...')
    const targetDatasources = await this.client.getAll(`spaces/${this.targetSpaceId}/datasources`)
    const sourceDatasources = await this.client.getAll(`spaces/${this.sourceSpaceId}/datasources`)

    /* Add Datasources */
    const addDatasources = sourceDatasources.filter(d => !targetDatasources.map(td => td.slug).includes(d.slug))
    for (let i = 0; i < addDatasources.length; i++) {
      /* Create the datasource */
      const newDatasource = await this.client.post(`spaces/${this.targetSpaceId}/datasources`, {
        name: addDatasources[i].name,
        slug: addDatasources[i].slug
      })

      /* Add the entries */
      const sourceEntries = await this.getDatasourceEntries(this.sourceSpaceId, addDatasources[i].id)
      const entriesCreationRequests = []
      for (let j = 0; j < sourceEntries.length; j++) {
        entriesCreationRequests.push(this.client.post(`spaces/${this.targetSpaceId}/datasource_entries/`, {
          datasource_entry: {
            name: sourceEntries[j].name,
            value: sourceEntries[j].value,
            datasource_id: newDatasource.data.datasource.id
          }
        }))
      }
      await Promise.all(entriesCreationRequests)
      console.log(chalk.green('✓') + ' Created datasource ' + addDatasources[i].name)
    }

    /* Update Datasources */
    const updateDatasources = targetDatasources.filter(d => sourceDatasources.map(sd => sd.slug).includes(d.slug))
    for (let i = 0; i < updateDatasources.length; i++) {
      /* Update the datasource */
      const sourceDatasource = sourceDatasources.find(d => d.slug === updateDatasources[i].slug)
      await this.client.put(`spaces/${this.targetSpaceId}/datasources/${updateDatasources[i].id}`, {
        name: sourceDatasource.name,
        slug: sourceDatasource.slug
      })

      const sourceEntries = await this.getDatasourceEntries(this.sourceSpaceId, sourceDatasource.id)
      const targetEntries = await this.getDatasourceEntries(this.targetSpaceId, updateDatasources[i].id)
      const updateEntries = targetEntries.filter(e => sourceEntries.map(se => se.name).includes(e.name))
      const addEntries = sourceEntries.filter(e => !targetEntries.map(te => te.name).includes(e.name))

      /* Update entries */
      const entriesUpdateRequests = []
      for (let j = 0; j < updateEntries.length; j++) {
        const sourceEntry = sourceEntries.find(d => d.name === updateEntries[j].name)
        entriesUpdateRequests.push(this.client.put(`spaces/${this.targetSpaceId}/datasource_entries/${updateEntries[j].id}`, {
          datasource_entry: {
            name: sourceEntry.name,
            value: sourceEntry.value,
            datasource_id: updateDatasources[i].id
          }
        }))
      }
      await Promise.all(entriesUpdateRequests)

      /* Add entries */
      const entriesCreationRequests = []
      for (let j = 0; j < addEntries.length; j++) {
        entriesCreationRequests.push(this.client.post(`spaces/${this.targetSpaceId}/datasource_entries/`, {
          datasource_entry: {
            name: addEntries[j].name,
            value: addEntries[j].value,
            datasource_id: updateDatasources[i].id
          }
        }))
      }
      await Promise.all(entriesCreationRequests)
      console.log(chalk.green('✓') + ' Updated datasource ' + updateDatasources[i].name)
    }
  }
}

/**
 * @method sync
 * @param  {Array} types
 * @param  {*} options      { token: String, source: Number, target: Number, api: String }
 * @return {Promise}
 */
const sync = (types, options) => {
  SyncSpaces.init(options)

  const tasks = types.map(_type => {
    const command = `sync${capitalize(_type)}`

    return () => SyncSpaces[command]()
  })

  return pSeries(tasks)
}

module.exports = sync
