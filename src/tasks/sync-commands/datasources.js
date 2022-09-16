const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')
const UUID = require('simple-uuid')

class SyncDatasources {
  /**
   * @param {{ sourceSpaceId: string, targetSpaceId: string, oauthToken: string }} options
   */
  constructor (options) {
    this.targetDatasources = []
    this.sourceDatasources = []
    this.sourceSpaceId = options.sourceSpaceId
    this.targetSpaceId = options.targetSpaceId
    this.oauthToken = options.oauthToken
    this.client = new StoryblokClient({
      oauthToken: options.oauthToken
    })
  }

  async sync () {
    try {
      this.targetDatasources = await this.client.getAll(`spaces/${this.targetSpaceId}/datasources`)
      this.sourceDatasources = await this.client.getAll(`spaces/${this.sourceSpaceId}/datasources`)

      console.log(
        `${chalk.blue('-')} In source space #${this.sourceSpaceId}: `
      )
      console.log(`  - ${this.sourceDatasources.length} datasources`)

      console.log(
        `${chalk.blue('-')} In target space #${this.targetSpaceId}: `
      )
      console.log(`  - ${this.targetDatasources.length} datasources`)
    } catch (err) {
      console.error(`An error ocurred when loading the datasources: ${err.message}`)

      return Promise.reject(err)
    }

    console.log(chalk.green('-') + ' Syncing datasources...')
    await this.addDatasources()
    await this.updateDatasources()
  }

  async getDatasourceEntries (spaceId, datasourceId, dimensionId = null) {
    const dimensionQuery = dimensionId ? `&dimension=${dimensionId}` : ''
    try {
      const entriesFirstPage = await this.client.get(`spaces/${spaceId}/datasource_entries/?datasource_id=${datasourceId}${dimensionQuery}`)
      const entriesRequets = []
      for (let i = 2; i <= Math.ceil(entriesFirstPage.total / 25); i++) {
        entriesRequets.push(this.client.get(`spaces/${spaceId}/datasource_entries/?datasource_id=${datasourceId}`, { page: i }))
      }
      return entriesFirstPage.data.datasource_entries.concat(...(await Promise.all(entriesRequets)).map(r => r.data.datasource_entries))
    } catch (err) {
      console.error(`An error ocurred when loading the entries of the datasource #${datasourceId}: ${err.message}`)

      return Promise.reject(err)
    }
  }

  async addDatasourceEntry (entry, datasourceId) {
    try {
      return this.client.post(`spaces/${this.targetSpaceId}/datasource_entries/`, {
        datasource_entry: {
          name: entry.name,
          value: entry.value,
          datasource_id: datasourceId
        }
      })
    } catch (err) {
      console.error(`An error ocurred when creating the datasource entry ${entry.name}: ${err.message}`)

      return Promise.reject(err)
    }
  }

  async updateDatasourceEntry (entry, newData, datasourceId) {
    try {
      return this.client.put(`spaces/${this.targetSpaceId}/datasource_entries/${entry.id}`, {
        datasource_entry: {
          name: newData.name,
          value: newData.value,
          datasource_id: datasourceId
        }
      })
    } catch (err) {
      console.error(`An error ocurred when updating the datasource entry ${entry.name}: ${err.message}`)

      return Promise.reject(err)
    }
  }

  async syncDatasourceEntries (datasourceId, targetId) {
    try {
      const sourceEntries = await this.getDatasourceEntries(this.sourceSpaceId, datasourceId)
      const targetEntries = await this.getDatasourceEntries(this.targetSpaceId, targetId)
      const updateEntries = targetEntries.filter(e => sourceEntries.map(se => se.name).includes(e.name))
      const addEntries = sourceEntries.filter(e => !targetEntries.map(te => te.name).includes(e.name))

      /* Update entries */
      const entriesUpdateRequests = []
      for (let j = 0; j < updateEntries.length; j++) {
        const sourceEntry = sourceEntries.find(d => d.name === updateEntries[j].name)
        entriesUpdateRequests.push(this.updateDatasourceEntry(updateEntries[j], sourceEntry, targetId))
      }
      await Promise.all(entriesUpdateRequests)

      /* Add entries */
      const entriesCreationRequests = []
      for (let j = 0; j < addEntries.length; j++) {
        entriesCreationRequests.push(this.addDatasourceEntry(addEntries[j], targetId))
      }
      await Promise.all(entriesCreationRequests)
    } catch (err) {
      console.error(`An error ocurred when syncing the datasource entries: ${err.message}`)

      return Promise.reject(err)
    }
  }

  async addDatasources () {
    const datasourcesToAdd = this.sourceDatasources.filter(d => !this.targetDatasources.map(td => td.slug).includes(d.slug))
    if (datasourcesToAdd.length) {
      console.log(
        `${chalk.green('-')} Adding new datasources to target space #${this.targetSpaceId}...`
      )
    }

    for (let i = 0; i < datasourcesToAdd.length; i++) {
      try {
        /* Create the datasource */
        const newDatasource = await this.client.post(`spaces/${this.targetSpaceId}/datasources`, {
          name: datasourcesToAdd[i].name,
          slug: datasourcesToAdd[i].slug
        })

        if (datasourcesToAdd[i].dimensions) {
          const response = await this.createDatasourcesDimensions(datasourcesToAdd[i], newDatasource.data.datasource.id)
          await this.syncDatasourceEntries(datasourcesToAdd[i].id, newDatasource.data.datasource.id)
          console.log(chalk.green('✓') + ' Created datasource ' + datasourcesToAdd[i].name)
          await this.syncDatasourceDimensionsValues(datasourcesToAdd[i], response.data.datasource)
        } else {
          await this.syncDatasourceEntries(datasourcesToAdd[i].id, newDatasource.data.datasource.id)
          console.log(chalk.green('✓') + ' Created datasource ' + datasourcesToAdd[i].name)
        }
      } catch (err) {
        console.error(
          `${chalk.red('X')} Datasource ${datasourcesToAdd[i].name} creation failed: ${err.message}`
        )
      }
    }
  }

  async updateDatasources () {
    const datasourcesToUpdate = this.targetDatasources.filter(d => this.sourceDatasources.map(sd => sd.slug).includes(d.slug))
    if (datasourcesToUpdate.length) {
      console.log(
        `${chalk.green('-')} Updating datasources In target space #${this.targetSpaceId}...`
      )
    }

    for (let i = 0; i < datasourcesToUpdate.length; i++) {
      try {
        /* Update the datasource */
        const sourceDatasource = this.sourceDatasources.find(d => d.slug === datasourcesToUpdate[i].slug)
        await this.client.put(`spaces/${this.targetSpaceId}/datasources/${datasourcesToUpdate[i].id}`, {
          name: sourceDatasource.name,
          slug: sourceDatasource.slug
        })

        await this.syncDatasourceEntries(sourceDatasource, datasourcesToUpdate[i].id)
        console.log(chalk.green('✓') + ' Updated datasource ' + datasourcesToUpdate[i].name)
      } catch (err) {
        console.error(
          `${chalk.red('X')} Datasource ${datasourcesToUpdate[i].name} update failed: ${err.message}`
        )
      }
    }
  }

  async createDatasourcesDimensions (datasource, datasourceId) {
    const newDimensions = datasource.dimensions.map((dimension) => {
      return {
        name: dimension.name,
        entry_value: dimension.entry_value,
        datasource_id: datasourceId,
        _uid: UUID()
      }
    })

    try {
      return await this.client.put(`spaces/${this.targetSpaceId}/datasources/${datasourceId}`, {
        ...datasource,
        dimensions: newDimensions,
        dimensions_attributes: newDimensions
      })
    } catch (error) {
      console.log(error)
    }
  }

  async syncDatasourceDimensionsValues (sourceDatasource, targetDatasource) {
    const sourceEntriesPromisses = []
    const targetEmptyEntriesPromisses = []

    for (let index = 0; index < sourceDatasource.dimensions.length; index++) {
      sourceEntriesPromisses.push(await this.getDatasourceEntries(this.sourceSpaceId, sourceDatasource.id, sourceDatasource.dimensions[index].id))
      targetEmptyEntriesPromisses.push(await this.getDatasourceEntries(this.targetSpaceId, targetDatasource.id, targetDatasource.dimensions[index].id))
    }
    await Promise.all(sourceEntriesPromisses)
    await Promise.all(targetEmptyEntriesPromisses)

    const targetEntriesPromisses = []

    for (let targetEntriesIndex = 0; targetEntriesIndex < sourceEntriesPromisses.length; targetEntriesIndex++) {
      for (let entriesIndex = 0; entriesIndex < sourceEntriesPromisses[targetEntriesIndex].length; entriesIndex++) {
        const entryTargetId = targetEmptyEntriesPromisses[targetEntriesIndex][entriesIndex].id
        const currentSourceEntry = sourceEntriesPromisses[targetEntriesIndex][entriesIndex]
        const targetDatasourceId = targetDatasource.dimensions[targetEntriesIndex].id

        const payload = {
          name: currentSourceEntry.name,
          value: currentSourceEntry.value,
          dimension_value: currentSourceEntry.dimension_value,
          datasource_id: `${targetDatasource.id}`,
          id: entryTargetId
        }
        targetEntriesPromisses.push(await this.syncDimensionEntryValues(targetDatasourceId, payload, entryTargetId))
      }
    }
    await Promise.all(targetEntriesPromisses)
  }

  async syncDimensionEntryValues (dimensionId, payload, datasourceEntryId) {
    try {
      await this.client.put(`spaces/${this.targetSpaceId}/datasource_entries/${datasourceEntryId}`, {
        datasource_entry: payload,
        dimension_id: dimensionId
      })
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = SyncDatasources
