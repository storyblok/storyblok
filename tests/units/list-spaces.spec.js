const { TOKEN_TEST } = require('../constants')
const listSpaces = require('../../src/tasks/list-spaces')

describe('list spaces method', () => {
  it('if the token not pass in request', async () => {
    let spaces = await listSpaces('')
    expect(spaces).toStrictEqual([])
  }) 

  it('if the user no have spaces in your account', async () => {
    let spaces = await listSpaces(TOKEN_TEST)
    expect(spaces).toStrictEqual([])
  }) 
})