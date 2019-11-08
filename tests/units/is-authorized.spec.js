const api = require('../../src/utils/api')
const creds = require('../../src/utils/creds')
const { EMAIL_TEST, PASSWORD_TEST } = require('../constants')

describe('api.isAuthorized() method', () => {
  beforeEach(() => {
    creds.set(null)
  })

  afterEach(() => {
    creds.set(null)
  })

  it('api.isAuthorized() should be true when user is not logged', async () => {
    try {
      await api.login(EMAIL_TEST, PASSWORD_TEST)

      expect(api.isAuthorized()).toBe(true)
    } catch (e) {
      console.error(e)
    }
  })

  it('api.isAuthorized() should be false when user is logout', async () => {
    try {
      await api.login(EMAIL_TEST, PASSWORD_TEST)

      expect(api.isAuthorized()).toBe(true)

      api.logout()

      expect(api.isAuthorized()).toBe(false)
    } catch (e) {
      console.error(e)
    }
  })
})
