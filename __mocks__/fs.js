const fs = jest.genMockFromModule('fs')

const mockFiles = Object.create(null)

// used by pull-components.spec.js
const writeFile = jest.fn((key, data, _) => {
  mockFiles[key] = data
})

// used by push-components.spec.js
const readFileSync = jest.fn((key) => {
  if (key === 'components.js') {
    return JSON.stringify({
      components: [
        {
          name: 'doc',
          display_name: null,
          created_at: '2018-04-06T12:26:58.539Z',
          id: 66594,
          schema: {
            content: {
              type: 'markdown'
            },
            summary: {
              type: 'textarea'
            }
          },
          image: null,
          preview_field: null,
          is_root: true,
          is_nestable: false
        }
      ]
    })
  }

  return {}
})

fs.writeFile = writeFile

fs.readFileSync = readFileSync

module.exports = fs
