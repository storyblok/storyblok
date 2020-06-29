module.exports = `module.exports = function (block) {
  // Example to change a string to boolean
  // block.{{ fieldname }} = !!(block.{{ fieldname }})

  // Example to transfer content from other field
  // block.{{ fieldname }} = block.other_field
}
`
