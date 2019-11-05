var fs = require('fs')

module.exports = function(api, argv) {

  api.get('components', (res) => {
    if (res.status == 200) {
      console.log('We\'ve saved your components in the file: components.' + argv.space + '.json')
      fs.writeFileSync('./components.' + argv.space + '.json', JSON.stringify(res.body, null, 2))
    } else {
      console.log(res.body)
      return res.body;
    }
  })

}