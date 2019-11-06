var fs = require('fs')

module.exports = function (api, options) {
  const { space } = options

  api.get('components', (res) => {
    if (res.status === 200) {
      const file = `components.${space}.json`
      console.log(`We've saved your components in the file: ${file}`)
      fs.writeFileSync(`./${file}`, JSON.stringify(res.body, null, 2))
      return
    }

    console.log(res.body)
    return res.body
  })
}
