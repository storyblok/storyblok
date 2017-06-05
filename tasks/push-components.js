var unirest = require('unirest')

module.exports = function(api, cliAttribute) {

  var req = unirest('GET', cliAttribute)
  req.type('json')
  req.end((resComp) => {
    if (resComp.status == 200) {

      api.get('components', (res2) => {
        if (res2.status == 200) {
          var body = JSON.parse(resComp.body)

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
    } else {
      console.log(resComp.body)
    }

  })

}