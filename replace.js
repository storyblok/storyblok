var fs = require('fs')

module.exports = function(file, replacements) {
  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }

    for (from in replacements) {
      data = data.replace(from, replacements[from])
    }

    fs.writeFile(file, data, 'utf8', function (err) {
       if (err) return console.log(err)
    })
  })
}