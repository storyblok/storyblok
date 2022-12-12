const api = require('../../src/utils/api')
const creds = require('../../src/utils/creds')
const { EMAIL_TEST, TOKEN_TEST, PASSWORD_TEST, REGION_TEST } = require('../constants')

jest.mock('axios')

describe('api.login() method', () => {
  beforeEach(() => {
    creds.set(null)
  })

  afterEach(() => {
    creds.set(null)
  })

  it('when login is correct, the .netrc file is populated', async () => {
    try {
      await api.login(EMAIL_TEST, PASSWORD_TEST)

      expect(creds.get()).toEqual({
        email: EMAIL_TEST,
        token: TOKEN_TEST,
        region: REGION_TEST
      })
    } catch (e) {
      console.error(e)
    }
  })

  it('when login is incorrect, the .netrc file is not populated and throw a reject message', async () => {
    try {
      await api.login(EMAIL_TEST, '1234', REGION_TEST)
    } catch (e) {
      expect(e.message).toBe('Incorrect access')
    }
  })
})
