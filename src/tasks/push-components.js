var unirest = require('unirest')
var fs = require('fs')

module.exports = function(api, argv) {
  var source = argv._[1];
  
  if(source.indexOf('http') == 0) {

    var req = unirest('GET', source)
    req.type('json')
    req.end((resComp) => {
      if (resComp.status == 200) {
        var body = JSON.parse(resComp.body)
        push(api, body)
      } else {
        console.log(resComp.body)
      }
    })

  } else {
    var body = fs.readFileSync(source, 'utf8')
    if(body) {
      var body = JSON.parse(body)
      if(body.components) {
        push(api, body)
      } else {
        console.error('Can not push invalid json - please provide a valid json file')
      }
    } else {
      console.error('Can not load file: ' + source)
    }
  }
}


var push = function(api, body) {
  api.get('components', (res2) => {
    if (res2.status == 200) {
      for (var i = 0; i < body.components.length; i++) {
        delete body.components[i].id
        delete body.components[i].created_at

        var exists = res2.body.components.filter(function(comp) {
          return comp.name == body.components[i].name
        })

        if (exists.length > 0) {
          api.put('components/' + exists[0].id, {
            component: body.components[i]
          }, (res) => {
            if (res.status == 200) {
              console.log('  Component ' + res.body.component.name + ' has been updated in Storyblok!')
            } else {
              console.log(res.body)
            }
          })
        } else {
          api.post('components', {
            component: body.components[i]
          }, (res) => {
            if (res.status == 200) {
              console.log('  Component ' + res.body.component.name + ' has been created in Storyblok!')
            } else {
              console.log(res.body)
            }
          })
        }
      }
    } else {
      console.log(res2.body)
    }
  })
}