const deleteComponents = require('../../src/tasks/delete-components')
const { FAKE_COMPONENTS } = require('../constants')
const fs = require('fs')
jest.mock('fs')

afterEach(() => {
  jest.clearAllMocks()
})

describe('testing deleteComponents', () => {
  it('api.deleteComponents', () => {
    const source = 'components.js'
    const components = FAKE_COMPONENTS()
    const spy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      components
    }))
    const api = {
      get: jest.fn((path) => {
        const id = path.split('/')[1]
        return Promise.resolve({ data: { component: components[id] } })
      }),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponents(api, { source, reversed: false }).then(() => {
      expect(spy.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(components.length)
    })
  })
  it('api.deleteComponents reverse', () => {
    const source = 'components.js'
    const components = FAKE_COMPONENTS()
    const spy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      components
    }))
    const api = {
      get: jest.fn((path) => {
        const id = path.split('/')[1]
        return Promise.resolve({ data: { component: components[id] } })
      }),
      getComponents: jest.fn(() => {
        const copy = [...components]
        copy.splice(3, 1)
        return copy
      }),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponents(api, { source, reversed: true }).then(() => {
      expect(spy.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(1)
    })
  })
  it('api.deleteComponents --dryrun', () => {
    const source = 'components.js'
    const components = FAKE_COMPONENTS()
    const spy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      components
    }))
    const api = {
      get: jest.fn((path) => {
        const id = path.split('/')[1]
        return Promise.resolve({ data: { component: components[id] } })
      }),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponents(api, { source, reversed: false, dryRun: true }).then(() => {
      expect(spy.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(0)
    })
  })
  it('api.deleteComponents reverse --dryrun', () => {
    const source = 'components.js'
    const components = FAKE_COMPONENTS()
    const spy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      components
    }))
    const api = {
      get: jest.fn((path) => {
        const id = path.split('/')[1]
        return Promise.resolve({ data: { component: components[id] } })
      }),
      getComponents: jest.fn(() => {
        const copy = [...components]
        copy.splice(3, 1)
        return copy
      }),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponents(api, { source, reversed: true, dryRun: true }).then(() => {
      expect(spy.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(0)
    })
  })
})
