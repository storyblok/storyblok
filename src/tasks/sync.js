const pSeries = require('p-series')
const chalk = require('chalk')
const SyncComponents = require('./sync-commands/components')
const SyncDatasources = require('./sync-commands/datasources')
const { capitalize } = require('../utils')

const SyncSpaces = {
  targetComponents: [],
  sourceComponents: [],

  init (options) {
    const { api } = options
    console.log(chalk.green('✓') + ' Loading options')
    this.sourceSpaceId = options.source
    this.targetSpaceId = options.target
    this.oauthToken = options.token
    this.client = api.getClient()
  },

  async getStoryWithTranslatedSlugs (sourceStory, targetStory) {
    const storyForPayload = { ...sourceStory }
    if (sourceStory.translated_slugs) {
      const sourceTranslatedSlugs = sourceStory.translated_slugs.map(s => {
        delete s.id
        return s
      })
      if (targetStory) {
        const storyData = await this.client.get('spaces/' + this.targetSpaceId + '/stories/' + targetStory.id)
        if (storyData.data.story && storyData.data.story.translated_slugs) {
          const targetTranslatedSlugs = storyData.data.story.translated_slugs
          sourceTranslatedSlugs.forEach(translation => {
            if (targetTranslatedSlugs.find(t => t.lang === translation.lang)) {
              translation.id = targetTranslatedSlugs.find(t => t.lang === translation.lang).id
            }
          })
        }
      }
      storyForPayload.translated_slugs_attributes = sourceTranslatedSlugs
      delete storyForPayload.translated_slugs
    }
    return storyForPayload
  },

  async syncStories () {
    console.log(chalk.green('✓') + ' Syncing stories...')
    const targetFolders = await this.client.getAll(`spaces/${this.targetSpaceId}/stories`, {
      folder_only: 1,
      sort_by: 'slug:asc'
    })

    const folderMapping = {}

    for (let i = 0; i < targetFolders.length; i++) {
      var folder = targetFolders[i]
      folderMapping[folder.full_slug] = folder.id
    }

    const all = await this.client.getAll(`spaces/${this.sourceSpaceId}/stories`, {
      story_only: 1
    })

    for (let i = 0; i < all.length; i++) {
      console.log(chalk.green('✓') + ' Starting update ' + all[i].full_slug)

      const { data } = await this.client.get('spaces/' + this.sourceSpaceId + '/stories/' + all[i].id)
      const sourceStory = data.story
      const slugs = sourceStory.full_slug.split('/')
      let folderId = 0

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
        const existingStory = await this.client.get('spaces/' + this.targetSpaceId + '/stories', { with_slug: all[i].full_slug })
        const storyData = await this.getStoryWithTranslatedSlugs(sourceStory, existingStory.data.stories ? existingStory.data.stories[0] : null)
        const payload = {
          story: storyData,
          force_update: '1',
          ...(sourceStory.published ? { publish: 1 } : {})
        }

        let createdStory = null
        if (existingStory.data.stories.length === 1) {
          createdStory = await this.client.put('spaces/' + this.targetSpaceId + '/stories/' + existingStory.data.stories[0].id, payload)
          console.log(chalk.green('✓') + ' Updated ' + existingStory.data.stories[0].full_slug)
        } else {
          createdStory = await this.client.post('spaces/' + this.targetSpaceId + '/stories', payload)
          console.log(chalk.green('✓') + ' Created ' + sourceStory.full_slug)
        }
        if (createdStory.data.story.uuid !== sourceStory.uuid) {
          await this.client.put('spaces/' + this.targetSpaceId + '/stories/' + createdStory.data.story.id + '/update_uuid', { uuid: sourceStory.uuid })
        }
      } catch (e) {
        console.error(
          chalk.red('X') + ` Story ${all[i].name} Sync failed: ${e.message}`
        )
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

      try {
        const folderResult = await this.client.get('spaces/' + this.sourceSpaceId + '/stories/' + folder.id)
        const sourceFolder = folderResult.data.story
        const existingFolder = await this.client.get('spaces/' + this.targetSpaceId + '/stories', { with_slug: folder.full_slug })
        const folderData = await this.getStoryWithTranslatedSlugs(sourceFolder, existingFolder.data.stories ? existingFolder.data.stories[0] : null)
        delete folderData.id
        delete folderData.created_at

        if (folder.parent_id) {
          // Parent child resolving
          if (!syncedFolders[folder.id]) {
            const folderSlug = folder.full_slug.split('/')
            const parentFolderSlug = folderSlug.splice(0, folderSlug.length - 1).join('/')

            const parentFolders = await this.client.get(`spaces/${this.targetSpaceId}/stories`, {
              with_slug: parentFolderSlug
            })

            if (parentFolders.data.stories.length) {
              folderData.parent_id = parentFolders.data.stories[0].id
            } else {
              folderData.parent_id = 0
            }
          } else {
            folderData.parent_id = syncedFolders[folder.id]
          }
        }

        const payload = {
          story: folderData,
          force_update: '1'
        }

        let createdFolder = null
        if (existingFolder.data.stories.length === 1) {
          console.log(`Folder ${folder.name} already exists`)
          createdFolder = await this.client.put('spaces/' + this.targetSpaceId + '/stories/' + existingFolder.data.stories[0].id, payload)
          console.log(chalk.green('✓') + ` Folder ${folder.name} updated`)
        } else {
          createdFolder = await this.client.post('spaces/' + this.targetSpaceId + '/stories', payload)
          console.log(chalk.green('✓') + ` Folder ${folder.name} created`)
        }
        if (createdFolder.data.story.uuid !== folder.uuid) {
          await this.client.put('spaces/' + this.targetSpaceId + '/stories/' + createdFolder.data.story.id + '/update_uuid', { uuid: folder.uuid })
        }

        syncedFolders[folder.id] = createdFolder.data.story.id
      } catch (e) {
        console.error(
          chalk.red('X') + ` Folder ${folder.name} Sync failed: ${e.message}`
        )
        console.log(e)
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

  async syncDatasources () {
    const syncDatasourcesInstance = new SyncDatasources({
      sourceSpaceId: this.sourceSpaceId,
      targetSpaceId: this.targetSpaceId,
      oauthToken: this.oauthToken
    })

    try {
      await syncDatasourcesInstance.sync()
    } catch (e) {
      console.error(
        chalk.red('X') + ` Datasources Sync failed: ${e.message}`
      )
      console.log(e)

      return Promise.reject(new Error(e))
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

  const tasks = types.sort((a, b) => {
    if (a === 'folders') return -1
    if (b === 'folders') return 1
    return 0
  }).map(_type => {
    const command = `sync${capitalize(_type)}`

    return () => SyncSpaces[command]()
  })

  return pSeries(tasks)
}

module.exports = sync
