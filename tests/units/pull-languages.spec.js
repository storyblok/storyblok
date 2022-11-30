const fs = require('fs')
const pullLanguages = require('../../src/tasks/pull-languages')
const { FAKE_SPACE_OPTIONS } = require('../constants')

jest.mock('fs')

describe('testing pullLanguages', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('api.getSpaceOptions() should be called once time', () => {
    const api = {
      getSpaceOptions: jest.fn(() => Promise.resolve(FAKE_SPACE_OPTIONS()))
    }

    return pullLanguages(api, {})
      .then(() => {
        expect(api.getSpaceOptions.mock.calls.length).toBe(1)
      })
  })

  it('api.getSpaceOptions() should be call fs.writeFile correctly', async () => {
    const SPACE = 12345
    const BODY = FAKE_SPACE_OPTIONS()

    const api = {
      getSpaceOptions () {
        return Promise.resolve(BODY)
      }
    }

    const options = {
      space: SPACE
    }

    const expectFileName = `languages.${SPACE}.json`
    const expectData = {
      default_lang_name: BODY.default_lang_name,
      languages: BODY.languages
    }

    return pullLanguages(api, options)
      .then(_ => {
        const [path, data] = fs.writeFile.mock.calls[0]

        expect(fs.writeFile.mock.calls.length).toBe(1)
        expect(path).toBe(`./${expectFileName}`)
        expect(JSON.parse(data)).toEqual(expectData)
      })
  })

  it('api.getSpaceOptions() when a error ocurred, catch the body response', async () => {
    const _api = {
      getSpaceOptions (_, fn) {
        return Promise.reject(new Error('Failed'))
      }
    }

    await expect(pullLanguages(_api, {})).rejects.toThrow('Error: Failed')
  })
})
