const fs = require('fs')
const pullComponents = require('../../src/tasks/pull-components')
const { FAKE_COMPONENTS } = require('../constants')

jest.mock('fs')

describe('testing pullComponents', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('api.getComponents() should be called once time', () => {
    const api = {
      getComponents: jest.fn(() => Promise.resolve(FAKE_COMPONENTS())),
      getPresets: jest.fn(() => Promise.resolve([])),
      getComponentGroups () {
        return Promise.resolve([])
      }
    }

    return pullComponents(api, {})
      .then(() => {
        expect(api.getComponents.mock.calls.length).toBe(1)
      })
  })

  it('api.getComponents() should be call fs.writeFile correctly', async () => {
    const SPACE = 12345
    const BODY = {
      components: [
        {
          name: 'teaser',
          display_name: null,
          created_at: '2019-10-15T17:00:32.212Z',
          id: 581153,
          schema: {
            headline: {
              type: 'text'
            }
          },
          image: null,
          preview_field: null,
          is_root: false,
          preview_tmpl: null,
          is_nestable: true,
          all_presets: [],
          preset_id: null,
          real_name: 'teaser',
          component_group_uuid: null
        }
      ]
    }

    const api = {
      getComponents () {
        return Promise.resolve(BODY.components)
      },
      getComponentGroups () {
        return Promise.resolve([])
      },
      getPresets () {
        return Promise.resolve([])
      }
    }

    const options = {
      space: SPACE
    }

    const expectFileName = `components.${SPACE}.json`

    return pullComponents(api, options)
      .then(_ => {
        const [path, data] = fs.writeFile.mock.calls[0]

        expect(fs.writeFile.mock.calls.length).toBe(2)
        expect(path).toBe(`./${expectFileName}`)
        expect(JSON.parse(data)).toEqual(BODY)
      })
  })

  it('api.getComponents() when a error ocurred, catch the body response', async () => {
    const _api = {
      getComponents (_, fn) {
        return Promise.reject(new Error('Failed'))
      },
      getComponentGroups () {
        return Promise.resolve([])
      },
      getPresets () {
        return Promise.resolve([])
      }
    }

    await expect(pullComponents(_api, {})).rejects.toThrow('Error: Failed')
  })
})
