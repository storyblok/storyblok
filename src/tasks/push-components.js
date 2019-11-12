const axios = require('axios')
const fs = require('fs')
const chalk = require('chalk')

const isUrl = source => source.indexOf('http') === 0

module.exports = (api, options) => {
  const { source } = options

  if (isUrl(source)) {
    return axios
      .get(source)
      .then(data => {
        const body = data.data || {}
        return push(api, body.components || [])
      })
      .catch(err => {
        console.error(`${chalk.red('X')} Can not load json file from ${source}`)
        return Promise.reject(err)
      })
  }

  const data = fs.readFileSync(source, 'utf8')
  if (data) {
    const body = JSON.parse(data)
    if (body.components) {
      return push(api, body.components)
    }

    console.error(`${chalk.red('X')} Can not load json file from ${source}`)
    return Promise.reject(new Error(`Can not load json file from ${source}`))
  }

  console.error(`${chalk.red('X')} Can not push invalid json - please provide a valid json file`)
  return Promise.reject(new Error('Can not push invalid json - please provide a valid json file'))
}

const push = (api, components) => {
  return api
    .getComponents()
    .then(async apiComponents => {
      for (var i = 0; i < components.length; i++) {
        delete components[i].id
        delete components[i].created_at

        const exists = apiComponents.filter(function (comp) {
          return comp.name === components[i].name
        })

        if (exists.length > 0) {
          const { id, name } = exists[0]
          console.log(`${chalk.blue('-')} Updating component ${name}...`)

          try {
            await api.put(`components/${id}`, {
              component: components[i]
            })

            console.log(`${chalk.green('✓')} Component ${name} has been updated in Storyblok!`)
          } catch (e) {
            console.error(`${chalk.red('X')} An error occurred when update component ${name}`)
            console.error(e.message)
          }
        } else {
          const { name } = components[i]
          console.log(`${chalk.blue('-')} Creating component ${name}...`)
          try {
            await api.post('components', {
              component: components[i]
            })
            console.log(`${chalk.green('✓')} Component ${name} has been updated in Storyblok!`)
          } catch (e) {
            console.error(`${chalk.red('X')} An error occurred when create component`)
            console.error(e.message)
          }
        }
      }
    })
    .catch(err => {
      console.error(`${chalk.red('X')} An error occurred when load components file from api`)
      return Promise.reject(err)
    })
  // api.get('components', (res2) => {
  //   if (res2.status === 200) {
  //     for (var i = 0; i < body.components.length; i++) {
  //       delete body.components[i].id
  //       delete body.components[i].created_at

  //       var exists = res2.body.components.filter(function (comp) {
  //         return comp.name === body.components[i].name
  //       })

  //       if (exists.length > 0) {
  //         api.put('components/' + exists[0].id, {
  //           component: body.components[i]
  //         }, (res) => {
  //           if (res.status === 200) {
  //             console.log('  Component ' + res.body.component.name + ' has been updated in Storyblok!')
  //           } else {
  //             console.log(res.body)
  //           }
  //         })
  //       } else {
  //         api.post('components', {
  //           component: body.components[i]
  //         }, (res) => {
  //           if (res.status === 200) {
  //             console.log('  Component ' + res.body.component.name + ' has been created in Storyblok!')
  //           } else {
  //             console.log(res.body)
  //           }
  //         })
  //       }
  //     }
  //   } else {
  //     console.log(res2.body)
  //   }
  // })
}
