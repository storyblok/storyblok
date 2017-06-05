module.exports = function(api, cliAttribute) {

  api.get('components', (res) => {
    if (res.status == 200) {
      console.log(JSON.stringify(res.body, null, 2))
    } else {
      console.log(res.body)
    }
  })

}