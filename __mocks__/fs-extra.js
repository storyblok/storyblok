const fs = jest.genMockFromModule('fs-extra')

let mockFiles = Object.create(null)

// used by pull-components.spec.js
const pathExists = jest.fn((key) => {
  return !!mockFiles[key]
})

const outputFile = jest.fn((path, data, fn) => {
  mockFiles[path] = data
  return Promise.resolve(true)
})

const __clearMockFiles = () => {
  mockFiles = Object.create(null)
}

const __setMockFiles = (mock) => {
  mockFiles = mock
}

fs.pathExists = pathExists

fs.outputFile = outputFile

fs.__clearMockFiles = __clearMockFiles

fs.__setMockFiles = __setMockFiles

module.exports = fs
