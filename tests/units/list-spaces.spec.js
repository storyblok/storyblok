const { listSpaces } = require('../../src/tasks/')
const { FAKE_SPACES } = require('../constants')

describe('Test spaces method', () => {
  it('Testing list-spaces funtion without api instance', async () => {
    try {
      const spaces = await listSpaces()
      expect(spaces).toStrictEqual([])
    } catch (e) {
      console.error(e)
    }
  })
  it('Testing list-spaces funtion with api instance', async () => {
    const FAKE_API = {
      getAllSpaces: jest.fn(() => Promise.resolve(FAKE_SPACES()))
    }
    expect(
      await listSpaces(FAKE_API)
    ).toEqual(FAKE_SPACES())
    expect(FAKE_API.getAllSpaces).toHaveBeenCalled()
  })
})
