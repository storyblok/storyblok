var unirest = require('unirest')
var creds = require('./creds')

module.exports = {
  accessToken: '',
  spaceId: null,

  login: function(email, password, callback) {
    var login = unirest('POST', 'https://api.storyblok.com/v1/users/login')
    login.type('json')
    login.send({email: email, password: password})
    login.end((res) => {
      if (res.status == 200) {
        this.accessToken = res.body.access_token
        creds.set(email, res.body.access_token)
      }
      callback(res)
    })
  },

  logout: function() {
    creds.set(null)
  },

  signup: function(email, password, callback) {
    var login = unirest('POST', 'https://api.storyblok.com/v1/users/signup')
    login.type('json')
    login.send({user: {email: email, password: password}})
    login.end((res) => {
      if (res.status == 200) {
        this.accessToken = res.body.access_token
        creds.set(email, res.body.access_token)
      }
      callback(res)
    })
  },

  isAuthorized: function() {
    var loginCreds = creds.get()

    if (loginCreds !== null) {
      this.accessToken = loginCreds.token
      return true
    }

    return false
  },

  setSpaceId: function(spaceId) {
    this.spaceId = spaceId
  },

  post: function(path, props, callback) {
    this.sendRequest(path, 'POST', props, callback)
  },

  put: function(path, props, callback) {
    this.sendRequest(path, 'PUT', props, callback)
  },

  get: function(path, callback) {
    this.sendRequest(path, 'GET', null, callback)
  },

  delete: function(path, callback) {
    this.sendRequest(path, 'DELETE', null, callback)
  },

  sendRequest: function(path, method, props, callback) {
    if (this.spaceId) {
      path = 'spaces/' + this.spaceId + '/' + path
    }

    var req = unirest(method, 'https://api.storyblok.com/v1/' + path)

    req.headers({
      'Authorization': this.accessToken
    })

    req.type('json')

    if (method == 'GET') {
      req.end(callback)
    } else {
      req.send(props)
      req.end(callback)
    }
  }
}