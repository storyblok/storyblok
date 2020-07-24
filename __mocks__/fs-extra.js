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
      name: 'Product',
      id: 0,
      uuid: '5ebd1485-25c5-460f-b477-b41facc884f8',
      component: 'product',
      field: 'title',
      content: {
        name: 'Product',
        slug: 'product',
        _uid: '4bc98f32-6200-4176-86b0-b6f2ea14be6f',
        body: [
          {
            _uid: '111781de-3174-4f61-8ae3-0b653085a582',
            headline: 'My Product Page',
            component: 'teaser'
          }
        ],
        component: 'page'
      },
      slug: 'product',
      full_slug: 'product',
      published: true,
      unpublished_changes: true,
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
