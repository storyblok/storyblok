const fs = require('fs')

module.exports = (file, replacements) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        return reject(err)
      }

      for (const from in replacements) {
        data = data.replace(from, replacements[from])
      }

      fs.writeFile(file, data, 'utf8', function (err) {
        if (err) {
          return reject(err)
        }

        return resolve(true)
      })
    })
  })
}
