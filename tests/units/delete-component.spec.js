const deleteComponent = require('../../src/tasks/delete-component')
const { FAKE_COMPONENTS } = require('../constants')

describe('testing deleteComponents', () => {
  it('api.deleteComponent', () => {
    const comp = FAKE_COMPONENTS()[0]
    const api = {
      get: jest.fn(() => Promise.resolve({ data: { component: comp } })),
      delete: jest.fn(() => Promise.resolve())
    }
    return deleteComponent(api, { componentId: 0 }).then(() => {
      expect(api.get.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(1)
    })
  })
  it('api.deleteComponent not found', () => {
    const api = {
      get: jest.fn(() => Promise.reject(new Error('Not Found'))),
      delete: jest.fn(() => Promise.resolve())
    }
    return expect(deleteComponent(api, { componentId: 0 }).then(() => {
      expect(api.get.mock.calls.length).toBe(1)
      expect(api.delete.mock.calls.length).toBe(0)
    })).rejects.toThrow('Error: Not Found')
  })
})
