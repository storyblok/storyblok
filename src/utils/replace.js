const fs = require('fs')

module.exports = (file, replacements) => {
  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    for (const from in replacements) {
      data = data.replace(from, replacements[from])
    }

    fs.writeFile(file, data, 'utf8', function (err) {
      if (err) return console.log(err)
    })
  })
}
