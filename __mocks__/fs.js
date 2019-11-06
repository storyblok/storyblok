const fs = jest.genMockFromModule('fs')

const mockFiles = Object.create(null)

const writeFileSync = jest.fn((key, data) => {
  mockFiles[key] = data
})

fs.writeFileSync = writeFileSync

module.exports = fs
