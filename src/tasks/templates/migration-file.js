module.exports = `module.exports = function (block) {
  // Example to change a string to boolean
  // block.{{ fieldname }} = !!(blok.{{ fieldname }})

  // Example to transfer content from other field
  // block.{{ fieldname }} = block.other_field

  // Example to transform a markdown field into a richtext field
  // const { MarkdownParser } = require('prosemirror-markdown')
  // const defaultMarkdownParser = new MarkdownParser()
  // if (typeof block.{{ fieldname }} == 'string') {
  //   block.{{ fieldname }} = defaultMarkdownParser.parse(block.{{ fieldname }}).toJSON()
  // }
}
`
