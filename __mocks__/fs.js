const fs = jest.genMockFromModule('fs')

const mockFiles = Object.create(null)

const writeFile = jest.fn((key, data, _) => {
  mockFiles[key] = data
})

fs.writeFile = writeFile

module.exports = fs
