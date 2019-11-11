const fs = require('fs')

const scaffold = require('../../src/tasks/scaffold')
const Storyblok = require('storyblok-js-client')
const api = require('../../src/utils/api')
const { API_URL } = require('../../src/constants')

jest.mock('fs')
jest.unmock('axios')

const deleteTestComponent = async () => {
  if (process.env.STORYBLOK_TOKEN) {
    const client = new Storyblok({
      oauthToken: process.env.STORYBLOK_TOKEN
    }, API_URL)

    try {
      const path = `spaces/${process.env.STORYBLOK_SPACE}/components`
      const body = await client.get(path)
      const comps = body.data.components

      const testComp = comps.filter(comp => comp.name === 'testando')[0] || {}

      if (testComp.id) {
        const { id } = testComp

        const compPath = `spaces/${process.env.STORYBLOK_SPACE}/components/${id}`
        await client.delete(compPath, null)
      }
    } catch (e) {
      console.error(e.message)
    }
  }
}

describe('testing scaffold()', () => {
  beforeEach(async () => {
    await deleteTestComponent()
  })

  afterEach(async () => {
    await deleteTestComponent()
  })

  it('call scaffold() with space should create a new component with corresponding name', async () => {
    const COMPONENT_TEST_NAME = 'testando'

    if (process.env.STORYBLOK_TOKEN && process.env.STORYBLOK_SPACE) {
      api.accessToken = process.env.STORYBLOK_TOKEN

      await scaffold(api, COMPONENT_TEST_NAME, process.env.STORYBLOK_SPACE)

      const components = await api.getComponents()

      const exists = components.filter(comp => {
        return comp.name === COMPONENT_TEST_NAME
      })

      expect(exists.length).toBe(1)
    }
  })

  it('call scaffold() without space should create correspoding template files', async () => {
    const COMPONENT_TEST_NAME = 'columns'

    await scaffold(api, COMPONENT_TEST_NAME)

    const [firstCall, secondCall] = fs.writeFileSync.mock.calls

    const [firstCallPath] = firstCall
    const [secondCallPath] = secondCall

    expect(firstCallPath).toBe('./views/components/_columns.liquid')
    expect(secondCallPath).toBe('./source/scss/components/below/_columns.scss')
  })
})
