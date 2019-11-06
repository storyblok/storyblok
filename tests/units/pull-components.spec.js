const pullComponents = require('../../src/tasks/pull-components')

jest.mock('fs')

const fs = require('fs')

describe('testing pullComponents', () => {
  it('api.get() should be called once time', () => {
    const api = {
      get: jest.fn()
    }
    const argv = {}

    pullComponents(api, argv)

    expect(api.get.mock.calls.length).toBe(1)
  })

  it('api.get() should be call fs.writeFileSync correctly', () => {
    const api = {
      get (_, fn) {
        fn({
          status: 200,
          body: {}
        })
      }
    }

    const options = {
      space: 12345
    }

    pullComponents(api, options)

    const [path, data] = fs.writeFileSync.mock.calls[0]

    expect(fs.writeFileSync.mock.calls.length).toBe(1)
    expect(path).toBe(`./components.${12345}.json`)
    expect(data).toBe(JSON.stringify({}))
  })
})
