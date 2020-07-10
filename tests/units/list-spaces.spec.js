const { api } = require('../../src/utils/')
const { listSpaces } = require('../../src/tasks/')

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
    try {
      const spaces = await listSpaces(api)
      expect(spaces).toStrictEqual(![])
    } catch (e) {
      console.error(e)
    }
  }) 

  it('Testing get-all-spaces method in api file', async () => {
    try {
      const spaces = await api.getAllSpaces()
      expect(spaces).toStrictEqual([])
    } catch (e) {
      console.error(e)
    }
  }) 
})
