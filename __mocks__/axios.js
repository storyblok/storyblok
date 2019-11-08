const { LOGIN_URL, SIGNUP_URL } = require('../src/constants')
const { EMAIL_TEST, PASSWORD_TEST, TOKEN_TEST } = require('../tests/constants')

const isCredCorrects = (email, pass) => {
  return email === EMAIL_TEST && pass === PASSWORD_TEST
}

const axios = {
  post: jest.fn((path, data) => {
    const { email, password } = data || {}

    if (path === LOGIN_URL && isCredCorrects(email, password)) {
      return Promise.resolve({
        data: {
          access_token: TOKEN_TEST
        }
      })
    }

    if (path === SIGNUP_URL && isCredCorrects(email, password)) {
      return Promise.resolve({
        data: {
          access_token: TOKEN_TEST
        }
      })
    }

    return Promise.reject(new Error('Incorrect access'))
  })
}

module.exports = axios
