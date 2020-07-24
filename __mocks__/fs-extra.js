const fs = jest.genMockFromModule('fs-extra')

let mockFiles = Object.create(null)

// used by pull-components.spec.js
const pathExists = jest.fn((key) => {
  return !!mockFiles[key]
})

const existsSync = jest.fn((key) => {
  return `${process.cwd()}/migrations/rollback`
})

const readdirSync = jest.fn((key) => {
  return ['rollback_product_title.json', 'rollback_product_text.json']
})

const readFile = jest.fn((path) => {
  mockFiles = path
  return Promise.resolve(JSON.stringify([
    {
      "id": 0,
      "full_slug": "another-post",
      "content": {
        "_uid": "5647c21f-8813-4f8a-ad38-b9f74e0e7c89",
        "text": "Donec tortor mauris, mollis vel pretium vitae, lacinia nec sapien. Donec erat neque, ullamcorper tincidunt iaculis sit amet, pharetra bibendum ipsum. Nunc mattis risus ac ante consequat nec pulvinar neque molestie. Etiam interdum nunc at metus lacinia non varius erat dignissim. Integer elementum, felis id facilisis vulputate, ipsum tellus venenatis dui, at blandit nibh massa in dolor. Cras a ultricies sapien. Vivamus adipiscing feugiat pharetra.",
        "image": "https://a.storyblok.com/f/51376/884x750/3bff01d851/international.svg",
        "title": "test",
        "category": "news",
        "component": "Product"
      }
    }
  ]))
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

fs.existsSync = existsSync

fs.readdirSync = readdirSync

fs.readFile = readFile

fs.outputFile = outputFile

fs.__clearMockFiles = __clearMockFiles

fs.__setMockFiles = __setMockFiles

module.exports = fs
