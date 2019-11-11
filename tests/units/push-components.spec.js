const pushComponents = require('../../src/tasks/push-components')
const Storyblok = require('storyblok-js-client')
const api = require('../../src/utils/api')
const { API_URL } = require('../../src/constants')

jest.mock('fs')
jest.unmock('axios')

const deleteDocComponent = async () => {
  if (process.env.STORYBLOK_TOKEN) {
    const client = new Storyblok({
      oauthToken: process.env.STORYBLOK_TOKEN
    }, API_URL)

    try {
      const path = `spaces/${process.env.STORYBLOK_SPACE}/components`
      const body = await client.get(path)
      const comps = body.data.components

      const docComponent = comps.filter(comp => comp.name === 'doc')[0] || {}
      if (docComponent.id) {
        const { id } = docComponent

        const compPath = `spaces/${process.env.STORYBLOK_SPACE}/components/${id}`
        await client.delete(compPath, null)
      }
    } catch (e) {
      console.error(e.message)
    }
  }
}

describe('testing pushComponents', () => {
  beforeEach(async () => {
    await deleteDocComponent()
  })

  it('call pushComponents() with source URL', async () => {
    if (process.env.STORYBLOK_TOKEN && process.env.STORYBLOK_SPACE) {
      const source = 'https://raw.githubusercontent.com/storyblok/nuxtdoc/master/seed.components.json'

      api.accessToken = process.env.STORYBLOK_TOKEN
      api.setSpaceId(process.env.STORYBLOK_SPACE)

      try {
        let components = await api.getComponents()
        let exists = components.filter(comp => comp.name === 'doc')

        expect(exists.length).toBe(0)

        await pushComponents(api, { source })

        components = await api.getComponents()
        exists = components.filter(comp => comp.name === 'doc')

        expect(exists.length).toBe(1)
      } catch (e) {
        console.error(e)
      }
    }
  })

  it('call pushComponents() with source path file', async () => {
    if (process.env.STORYBLOK_TOKEN && process.env.STORYBLOK_SPACE) {
      const source = 'components.js'

      api.accessToken = process.env.STORYBLOK_TOKEN
      api.setSpaceId(process.env.STORYBLOK_SPACE)

      try {
        let components = await api.getComponents()

        expect(components.length).toBe(4)

        await pushComponents(api, { source })

        components = await api.getComponents()

        expect(components.length).toBe(5)
      } catch (e) {
        console.error(e)
      }
    }
  })
})
