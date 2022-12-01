const deleteComponent = require('../../src/tasks/delete-component')
const { FAKE_COMPONENTS } = require('../constants')

describe('testing deleteComponent', () => {
  it('api.deleteComponent name', () => {
    const api = {
      getComponents: jest.fn(() => Promise.resolve(FAKE_COMPONENTS())),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponent(api, { comp: 'teaser' }).then(() => {
      expect(api.delete.mock.calls.length).toBe(1)
    })
  })
  it('api.deleteComponent id', () => {
    const comp = FAKE_COMPONENTS()[0]
    const api = {
      get: jest.fn(() => Promise.resolve({ data: { component: comp } })),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponent(api, { comp: 0 }).then(() => {
      expect(api.get.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(1)
    })
  })
  it('api.deleteComponent name dryrun', () => {
    const api = {
      getComponents: jest.fn(() => Promise.resolve(FAKE_COMPONENTS())),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponent(api, { comp: 'teaser', dryrun: true }).then(() => {
      expect(api.delete.mock.calls.length).toBe(0)
    })
  })
  it('api.deleteComponent not found', () => {
    const api = {
      getComponents: jest.fn(() => Promise.resolve(FAKE_COMPONENTS())),
      delete: jest.fn(() => Promise.resolve())
    }
    return expect(deleteComponent(api, { comp: 'not a fake component' }).then(() => {
      expect(api.delete.mock.calls.length).toBe(0)
    })).rejects.toThrow('Component not a fake component not found.')
  })
  it('api.deleteComponent not found by id', () => {
    const api = {
      get: jest.fn(() => Promise.reject(new Error('Not Found'))),
      delete: jest.fn(() => Promise.resolve())
    }
    return expect(deleteComponent(api, { comp: 1 }).then(() => {
      expect(api.get.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(0)
    })).rejects.toThrow('Not Found')
  })
})
