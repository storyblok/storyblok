const api = require('../../src/utils/api')
const creds = require('../../src/utils/creds')
const { EMAIL_TEST, TOKEN_TEST, PASSWORD_TEST } = require('../constants')

jest.mock('axios')

describe('api.signup() method', () => {
  beforeEach(() => {
    creds.set(null)
  })

  afterEach(() => {
    creds.set(null)
  })

  it('when signup ends correctly, the .netrc file is populated', async () => {
    try {
      await api.signup(EMAIL_TEST, PASSWORD_TEST)

      expect(creds.get()).toEqual({
        email: EMAIL_TEST,
        token: TOKEN_TEST
      })
    } catch (e) {
      console.error(e)
    }
  })

  it('when signup ends correctly, the .netrc file is not populated and throw a reject message', async () => {
    try {
      await api.signup(EMAIL_TEST, '1234')
    } catch (e) {
      expect(e.message).toBe('Incorrect access')
    }
  })
})
