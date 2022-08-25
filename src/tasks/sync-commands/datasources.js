const chalk = require('chalk')
const StoryblokClient = require('storyblok-js-client')

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

  async getDatasourceEntries (spaceId, datasourceId) {
    try {
      const entriesFirstPage = await this.client.get(`spaces/${spaceId}/datasource_entries/?datasource_id=${datasourceId}`)
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

  async syncDatasourceEntries (sourceId, targetId) {
    try {
      const sourceEntries = await this.getDatasourceEntries(this.sourceSpaceId, sourceId)
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

        await this.syncDatasourceEntries(datasourcesToAdd[i].id, newDatasource.data.datasource.id)
        console.log(chalk.green('✓') + ' Created datasource ' + datasourcesToAdd[i].name)
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

        await this.syncDatasourceEntries(sourceDatasource.id, datasourcesToUpdate[i].id)
        console.log(chalk.green('✓') + ' Updated datasource ' + datasourcesToUpdate[i].name)
      } catch (err) {
        console.error(
          `${chalk.red('X')} Datasource ${datasourcesToUpdate[i].name} update failed: ${err.message}`
        )
      }
    }
  }
}

module.exports = SyncDatasources
