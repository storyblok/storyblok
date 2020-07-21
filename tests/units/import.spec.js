const { importFiles } = require('../../src/tasks/index')
const { FAKE_STORIES, EMAIL_TEST, PASSWORD_TEST } = require('../constants')
const Storyblok = require('storyblok-js-client')

const { 
  jsonParser,
  discoverExtension,
  xmlParser,
  csvParser,
  sendContent
} = require('../../src/tasks/import/utils')

jest.mock('axios')

describe('Test utils functions to import command', () => {
  it('Test discoverExtension, function', () => {
    const fileName = 'test.csv'
    expect(discoverExtension(fileName)).toEqual('csv')
  })

  it('Test discoverExtension, function', () => {
    const fileName = 'text.test.txt'
    expect(discoverExtension(fileName)).toEqual('txt')
  })


  it('Test sendContent function', () => {
    const URL = 'https://api.storyblok.com/v1/'
    const stories = FAKE_STORIES()[0]

    const FAKE_API = {
      getClient: jest.fn(() => Promise.resolve(new Storyblok({
        oauthToken: process.env.STORYBLOK_TOKEN
      }, URL))),

      post: jest.fn(() => Promise.resolve(stories)),
      spaceId: jest.fn(() => Promise.resolve(75070))
    }

    sendContent(FAKE_API, stories)
      .then(() => {
        expect(
          FAKE_API.post
        ).toEqual(stories.name)
        expect(FAKE_API.getClient).toHaveBeenCalled()
      })
      .catch(err => {
        console.error(err)
      })
  })

  it('Test xml parser', () => {
    const data = `
      <?xml version="1.0" encoding="UTF-8"?>
        <root>
          <row>
            <path>this-is-my-title</path>
            <title>This is my title</title>
            <text>Lorem ipsum dolor sit amet, consectetur adipiscing elit. In erat mauris, faucibus quis pharetra sit amet, pretium ac libero. Etiam vehicula eleifend bibendum. Morbi gravida metus ut sapien condimentum sodales mollis augue sodales. Vestibulum quis quam at sem placerat aliquet. Curabitur a felis at sapien ullamcorper fermentum. Mauris molestie arcu et lectus iaculis sit amet eleifend eros posuere. Fusce nec porta orci.

        Integer vitae neque odio, a sollicitudin lorem. Aenean orci mauris, tristique luctus fermentum eu, feugiat vel massa. Fusce sem sem, egestas nec vulputate vel, pretium sit amet mi. Fusce ut nisl id risus facilisis euismod. Curabitur et elementum purus. Duis tincidunt fringilla eleifend. Morbi id lorem eu ante adipiscing feugiat. Sed congue erat in enim eleifend dignissim at in nisl.</text>
            <image>https://a.storyblok.com/f/51376/x/1502f01431/corporate-website.svg</image>
            <category>press</category>
          </row>
        </root>
    `

    xmlParser(data, 'About', 0)
      .then(res => {
        console.log(res)
        expect(res).toEqual('')
      })
      .catch(err => {
        console.error(err)
      })
  })
})