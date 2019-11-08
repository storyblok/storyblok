var unirest = require('unirest')
const axios = require('axios')
const creds = require('./creds')

const { LOGIN_URL } = require('../constants')

module.exports = {
  accessToken: '',
  spaceId: null,

  async login (email, password) {
    return axios.post(LOGIN_URL, {
      email: email,
      password: password
    })
      .then(response => {
        const token = response.data.access_token
        this.accessToken = token
        creds.set(email, token)

        return Promise.resolve(true)
      })
      .catch(err => Promise.reject(err))
  },

  logout () {
    creds.set(null)
  },

  signup: function (email, password) {
    return new Promise((resolve, reject) => {
      const login = unirest('POST', 'https://api.storyblok.com/v1/users/signup')
      login.type('json')
      login.send({ user: { email: email, password: password } })
      login.end((res) => {
        if (res.status === 200) {
          this.accessToken = res.body.access_token
          creds.set(email, res.body.access_token)
          return resolve(res)
        }

        return reject(new Error('An error ocurred when signup' + JSON.stringify(res)))
      })
    })
  },

  isAuthorized: function () {
    var loginCreds = creds.get()

    if (loginCreds !== null) {
      this.accessToken = loginCreds.token
      return true
    }

    return false
  },

  setSpaceId: function (spaceId) {
    this.spaceId = spaceId
  },

  post: function (path, props, callback) {
    this.sendRequest(path, 'POST', props, callback)
  },

  put: function (path, props, callback) {
    this.sendRequest(path, 'PUT', props, callback)
  },

  get: function (path, callback) {
    this.sendRequest(path, 'GET', null, callback)
  },

  delete: function (path, callback) {
    this.sendRequest(path, 'DELETE', null, callback)
  },

  sendRequest: function (path, method, props, callback) {
    if (this.spaceId) {
      path = 'spaces/' + this.spaceId + '/' + path
    }

    var req = unirest(method, 'https://api.storyblok.com/v1/' + path)

    req.headers({
      Authorization: this.accessToken
    })

    req.type('json')

    if (method === 'GET') {
      req.end(callback)
    } else {
      req.send(props)
      req.end(callback)
    }
  }
}
