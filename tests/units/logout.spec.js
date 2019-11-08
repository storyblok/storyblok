const api = require('../../src/utils/api')
const creds = require('../../src/utils/creds')
const { EMAIL_TEST, TOKEN_TEST } = require('../constants')

describe('api.logout() method', () => {
  beforeEach(() => {
    creds.set(EMAIL_TEST, TOKEN_TEST)
  })

  afterEach(() => {
    creds.set(null)
  })

  it('api.logout() should be empty the .netrc file', () => {
    api.logout()

    expect(creds.get()).toEqual(null)
  })
})
