const chalk = require('chalk')
const UUID = require('simple-uuid')
const api = require('../../utils/api')

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
    this.client = api.getClient()
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
        console.log(`  ${chalk.green('-')} Creating datasource ${datasourcesToAdd[i].name} (${datasourcesToAdd[i].slug})`)
        /* Create the datasource */
        const newDatasource = await this.client.post(`spaces/${this.targetSpaceId}/datasources`, {
          name: datasourcesToAdd[i].name,
          slug: datasourcesToAdd[i].slug
        })

        if (datasourcesToAdd[i].dimensions.length) {
          console.log(
            `    ${chalk.blue('-')} Creating dimensions...`
          )
          const { data } = await this.createDatasourcesDimensions(datasourcesToAdd[i].dimensions, newDatasource.data.datasource)
          await this.syncDatasourceEntries(datasourcesToAdd[i].id, newDatasource.data.datasource.id)
          console.log(
            `    ${chalk.blue('-')} Sync dimensions values...`
          )
          await this.syncDatasourceDimensionsValues(datasourcesToAdd[i], data.datasource)
          console.log(`  ${chalk.green('✓')} Created datasource ${datasourcesToAdd[i].name}`)
        } else {
          await this.syncDatasourceEntries(datasourcesToAdd[i].id, newDatasource.data.datasource.id)
          console.log(`  ${chalk.green('✓')} Created datasource ${datasourcesToAdd[i].name}`)
        }
      } catch (err) {
        console.error(
          `${chalk.red('X')} Datasource ${datasourcesToAdd[i].name} creation failed: ${err.response.data.error || err.message}`
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

        if (datasourcesToUpdate[i].dimensions.length) {
          console.log(`  ${chalk.blue('-')} Updating datasources dimensions ${datasourcesToUpdate[i].name}...`)
          const sourceDimensionsNames = sourceDatasource.dimensions.map((dimension) => dimension.name)
          const targetDimensionsNames = datasourcesToUpdate[i].dimensions.map((dimension) => dimension.name)
          const intersection = sourceDimensionsNames.filter(item => !targetDimensionsNames.includes(item))
          let datasourceToSyncDimensionsValues = datasourcesToUpdate[i]

          if (intersection) {
            const dimensionsToCreate = sourceDatasource.dimensions.filter((dimension) => {
              if (intersection.includes(dimension.name)) return dimension
            })
            const { data } = await this.createDatasourcesDimensions(dimensionsToCreate, datasourcesToUpdate[i], true)
            datasourceToSyncDimensionsValues = data.datasource
          }

          await this.syncDatasourceEntries(sourceDatasource.id, datasourcesToUpdate[i].id)

          await this.syncDatasourceDimensionsValues(sourceDatasource, datasourceToSyncDimensionsValues)
          console.log(`${chalk.green('✓')} Updated datasource ${datasourcesToUpdate[i].name}`)
        } else {
          await this.syncDatasourceEntries(sourceDatasource.id, datasourcesToUpdate[i].id)
          console.log(`${chalk.green('✓')} Updated datasource ${datasourcesToUpdate[i].name}`)
        }
      } catch (err) {
        console.error(
          `${chalk.red('X')} Datasource ${datasourcesToUpdate[i].name} update failed: ${err.message}`
        )
      }
    }
  }

  async createDatasourcesDimensions (dimensions, datasource, isToUpdate = false) {
    const newDimensions = dimensions.map((dimension) => {
      return {
        name: dimension.name,
        entry_value: dimension.entry_value,
        datasource_id: datasource.id,
        _uid: UUID()
      }
    })

    let payload = null

    if (isToUpdate) {
      payload = {
        dimensions: [...datasource.dimensions, ...newDimensions],
        dimensions_attributes: [...datasource.dimensions, ...newDimensions]
      }
    } else {
      payload = {
        dimensions: newDimensions,
        dimensions_attributes: newDimensions
      }
    }

    try {
      return await this.client.put(`spaces/${this.targetSpaceId}/datasources/${datasource.id}`, {
        ...datasource,
        ...payload
      })
    } catch (error) {
      console.error(error)
    }
  }

  async syncDatasourceDimensionsValues (sourceDatasource, targetDatasource) {
    const sourceEntriesPromisses = []
    const targetEmptyEntriesPromisses = []
    try {
      for (let index = 0; index < sourceDatasource.dimensions.length; index++) {
        const targetDimensionId = targetDatasource.dimensions[index].id
        sourceEntriesPromisses.push(...await this.getDatasourceEntries(this.sourceSpaceId, sourceDatasource.id, sourceDatasource.dimensions[index].id))
        targetEmptyEntriesPromisses.push(
          ...await this.getDatasourceEntries(this.targetSpaceId, targetDatasource.id, targetDimensionId).then((res) => {
            return res.map((entry) => {
              return {
                ...entry,
                target_dimension_id: targetDimensionId
              }
            })
          })
        )
      }

      await Promise.all(sourceEntriesPromisses)
      await Promise.all(targetEmptyEntriesPromisses)

      const targetEntriesPromisses = []

      while (sourceEntriesPromisses.length !== 0) {
        const currentSourceEntry = sourceEntriesPromisses[0]
        const targetEntryIndex = targetEmptyEntriesPromisses.findIndex((tEntry) => tEntry.name === currentSourceEntry.name)
        const currentTargetEntry = targetEmptyEntriesPromisses[targetEntryIndex]
        const valuesAreEqual = currentTargetEntry.dimension_value === currentSourceEntry.dimension_value

        if (valuesAreEqual) {
          sourceEntriesPromisses.shift()
          targetEmptyEntriesPromisses.splice(targetEntryIndex, 1)
        } else {
          const payload = {
            ...currentTargetEntry,
            dimension_value: currentSourceEntry.dimension_value
          }

          targetEntriesPromisses.push(await this.syncDimensionEntryValues(currentTargetEntry.target_dimension_id, currentTargetEntry.id, payload))
          sourceEntriesPromisses.shift()
          targetEmptyEntriesPromisses.splice(targetEntryIndex, 1)
        }
      }

      await Promise.all(targetEntriesPromisses)
    } catch (error) {
      console.error(`    ${chalk.red('X')} Sync dimensions values failed: ${error.response.data.error || error.message || error}`)
    }
  }

  async syncDimensionEntryValues (dimensionId = null, datasourceEntryId = null, payload = null) {
    try {
      await this.client.put(`spaces/${this.targetSpaceId}/datasource_entries/${datasourceEntryId}`, {
        datasource_entry: payload,
        dimension_id: dimensionId
      })
    } catch (error) {
      console.error(`    ${chalk.red('X')} Sync entry error ${payload.name} sync failed: ${error.response.data.error || error.message}`)
    }
  }
}

module.exports = SyncDatasources
