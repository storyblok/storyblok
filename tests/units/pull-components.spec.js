const fs = require('fs')
const pullComponents = require('../../src/tasks/pull-components')

jest.mock('fs')

describe('testing pullComponents', () => {
  it('api.get() should be called once time', () => {
    const api = {
      get: jest.fn(() => {})
    }

    pullComponents(api, {})
      .then(() => {
        expect(api.get.mock.calls.length).toBe(1)
      })
  })

  it('api.get() should be call fs.writeFile correctly', () => {
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
      get (_, fn) {
        fn({
          status: 200,
          body: BODY
        })
      }
    }

    const options = {
      space: SPACE
    }

    const expectFileName = `components.${SPACE}.json`

    pullComponents(api, options)
      .then(_ => {
        const [path, data] = fs.writeFile.mock.calls[0]

        expect(fs.writeFile.mock.calls.length).toBe(1)
        expect(path).toBe(`./${expectFileName}`)
        expect(JSON.parse(data)).toEqual(BODY)
      })
      .catch(() => {})
  })

  it('api.get() when a error ocurred, catch the body response', () => {
    const BODY = {
      name: 'Storyblok CMS'
    }

    const _api = {
      get (_, fn) {
        fn({
          status: 400,
          body: BODY
        })
      }
    }

    pullComponents(_api, {})
      .then(() => {})
      .catch(err => {
        expect(err).toBe(BODY)
      })
  })
})
