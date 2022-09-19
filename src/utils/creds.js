var path = require('path')
var fs = require('fs')
var netrc = require('netrc')
var os = require('os')

var host = 'api-us.storyblok.com'

const getFile = () => {
  const home = process.env[(/^win/.test(process.platform)) ? 'USERPROFILE' : 'HOME']
  return path.join(home, '.netrc')
}

const getNrcFile = () => {
  let obj = {}

  try {
    obj = netrc(getFile())
  } catch (e) {
    obj = {}
  }

  return obj
}

const get = function () {
  const obj = getNrcFile()

  if (process.env.STORYBLOK_LOGIN && process.env.STORYBLOK_TOKEN) {
    return {
      email: process.env.STORYBLOK_LOGIN,
      token: process.env.STORYBLOK_TOKEN
    }
  }

  if (process.env.TRAVIS_STORYBLOK_LOGIN && process.env.TRAVIS_STORYBLOK_TOKEN) {
    return {
      email: process.env.TRAVIS_STORYBLOK_LOGIN,
      token: process.env.TRAVIS_STORYBLOK_TOKEN
    }
  }

  if (Object.hasOwnProperty.call(obj, host)) {
    return {
      email: obj[host].login,
      token: obj[host].password
    }
  }

  return null
}

const set = function (email, token) {
  const file = getFile()
  let obj = {}

  try {
    obj = netrc(file)
  } catch (e) {
    obj = {}
  }

  if (email === null) {
    delete obj[host]
    fs.writeFileSync(file, netrc.format(obj) + os.EOL)
    return null
  } else {
    obj[host] = {
      login: email,
      password: token
    }
    fs.writeFileSync(file, netrc.format(obj) + os.EOL)
    return get()
  }
}

module.exports = {
  set: set,
  get: get
}
