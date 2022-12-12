const getOptions = (subCommand, argv = {}, api = {}) => {
  let email = ''

  if (subCommand === 'select') {
    return [
      {
        type: 'input',
        name: 'name',
        message: 'How should your Project be named?',
        validate: function (value) {
          if (value.length > 0) {
            return true
          }
          return 'Please enter a valid name for your project:'
        },
        filter: function (val) {
          return val.replace(/\s+/g, '-').toLowerCase()
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Select the type of your project:',
        choices: [
          'Theme (Storyrenderer/Hosted)',
          'Boilerplate (Selfhosted)',
          'Fieldtype'
        ]
      },
      {
        type: 'list',
        name: 'theme',
        message: 'We got some Themes prepared for you:',
        choices: [
          'Creator Theme (Blueprint) [https://github.com/storyblok/creator-theme]',
          'City Theme [https://github.com/storyblok/city-theme]',
          'Nexo Theme [https://github.com/storyblok/nexo-theme]',
          'Custom Theme [We will ask you about your Github URL]'
        ],
        when: function (answers) {
          return answers.type === 'Theme (Storyrenderer/Hosted)'
        }
      },
      {
        type: 'input',
        name: 'custom_theme_url',
        message: 'What is your github theme URL? Tip: should look like: "https://github.com/storyblok/city-theme"',
        when: function (answers) {
          return answers.theme === 'Custom Theme [We will ask you about your Github URL]'
        }
      },
      {
        type: 'list',
        name: 'theme',
        message: 'We got some Boilerplates prepared for you:',
        choices: [
          'PHP - Silex Boilerplate [https://github.com/storyblok/silex-boilerplate]',
          'JavaScript - NodeJs Boilerplate [https://github.com/storyblok/nodejs-boilerplate]',
          'Ruby - Sinatra Boilerplate [https://github.com/storyblok/sinatra-boilerplate]',
          'Python - Django Boilerplate [https://github.com/storyblok/django-boilerplate]',
          'JavaScript - VueJs Boilerplate [https://github.com/storyblok/vuejs-boilerplate]',
          'Custom Boilerplate [We will ask you about your Github URL]'
        ],
        when: function (answers) {
          return answers.type === 'Boilerplate (Selfhosted)'
        }
      },
      {
        type: 'input',
        name: 'custom_theme_url',
        message: 'What is your github boilerplate URL? Tip: should look like: "https://github.com/storyblok/silex-boilerplate"',
        when: function (answers) {
          return answers.theme === 'Custom Boilerplate [We will ask you about your Github URL]'
        }
      },
      {
        type: 'input',
        name: 'spaceId',
        message: 'What is your space ID? Tip: You can find the space ID in the dashboard on https://app.storyblok.com:',
        when: function (answers) {
          return answers.type === 'Theme (Storyrenderer/Hosted)'
        }
      },
      {
        type: 'input',
        name: 'spaceDomain',
        message: 'What is your domain? Example: city.me.storyblok.com:',
        when: function (answers) {
          return answers.type === 'Theme (Storyrenderer/Hosted)'
        },
        filter: function (val) {
          return val.replace(/https:/g, '').replace(/\//g, '')
        }
      },
      {
        type: 'input',
        name: 'themeToken',
        message: 'What is your theme token?',
        when: function (answers) {
          return answers.type === 'Theme (Storyrenderer/Hosted)'
        }
      }
    ]
  }

  if (subCommand === 'login') {
    return [
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email address:',
        validate: function (value) {
          email = value
          if (value.length > 0) {
            return true
          }
          return 'Please enter a valid email:'
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        validate: function (value) {
          if (value.length > 0) {
            return true
          }

          return 'Please enter a valid password:'
        }
      },
      {
        type: 'input',
        name: 'region',
        message: 'Enter your user\'s region (us, eu or cn):',
        validate: function (value) {
          const flagList = ['us', 'cn', 'eu']
          if (flagList.indexOf(value) > -1) {
            return true
          }

          return 'Please enter a valid region: us, eu or cn'
        }
      }
    ]
  }

  const moreOptions = [
    'delete-templates',
    'pull-components',
    'push-components',
    'scaffold'
  ]

  if (moreOptions.indexOf(subCommand) > -1) {
    const loginQuestions = [
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email address:',
        validate: function (value) {
          email = value
          if (value.length > 0) {
            return true
          }
          return 'Please enter a valid email:'
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        validate: function (value) {
          const done = this.async()

          return api.login(email, value)
            .then(_ => done(null, true))
            .catch(_ => {
              done('Password seams to be wrong. Please try again:')
            })
        }
      }
    ]

    if (!api.isAuthorized()) {
      return loginQuestions
    }

    return []
  }

  return [
    {
      type: 'list',
      name: 'has_account',
      message: 'Do you have already a Storyblok account?',
      choices: [
        'No',
        'Yes'
      ],
      when: function () {
        return !api.isAuthorized() && !argv.space
      }
    },
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address:',
      validate: function (value) {
        email = value
        if (value.length > 0) {
          return true
        }
        return 'Please enter a valid email:'
      },
      when: function () {
        return !api.isAuthorized()
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Define your password:',
      validate: function (value) {
        var done = this.async()

        api.signup(email, value, (data) => {
          if (data.status === 200) {
            done(null, true)
          } else {
            done('Failed: ' + JSON.stringify(data.body) + '. Please try again:')
          }
        })
      },
      when: function (answers) {
        return answers.has_account === 'No'
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      validate (value) {
        var done = this.async()

        api.login(email, value)
          .then(_ => done(null, true))
          .catch(_ => {
            done('Password seams to be wrong. Please try again:')
          })
      },
      when: function (answers) {
        return answers.has_account === 'Yes' || (!api.isAuthorized() && !answers.has_account)
      }
    },
    {
      type: 'input',
      name: 'name',
      message: 'How should your Project be named?',
      validate: function (value) {
        if (value.length > 0) {
          return true
        }
        return 'Please enter a valid name for your project:'
      },
      filter: function (val) {
        return val.replace(/\s+/g, '-').toLowerCase()
      },
      when: function (answers) {
        return !argv.space
      }
    }
  ]
}

module.exports = getOptions
