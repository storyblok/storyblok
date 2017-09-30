module.exports = function(api, argv) {

  api.post('template_deletions', {
    template_deletion: {
      env: argv.env
    }
  }, (res) => {
    if (res.status == 201) {
      console.log('  Templates have been deleted!')
    } else {
      console.log(res.body)
    }
  })

}