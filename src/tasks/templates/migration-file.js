module.exports = `module.exports = function (block, field) {
  // Example to change a string to boolean
  // field = !!(field)
  // Example to transfer content from other field
  // field = block.other_field
  // Example to transform a markdown field into a richtext field
  // import {MarkdownParser} from 'prosemirror-markdown'
  // const defaultMarkdownParser = new MarkdownParser()
  // if (typeof field == 'string') {
  //   field = defaultMarkdownParser.parse(field).toJSON()
  // }
}
`
