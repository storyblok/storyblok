const { FAKE_STORIES } = require('../constants')

const {
  jsonParser,
  discoverExtension,
  xmlParser,
  csvParser,
  sendContent
} = require('../../src/tasks/import/utils')

const response = [{
  slug: 'this-is-my-title',
  name: 'This is my title',
  parent_id: 0,
  content: {
    component: 'About',
    category: 'press',
    title: 'This is my title',
    image: 'https://a.storyblok.com/f/51376/x/1502f01431/corporate-website.svg',
    text: 'Lorem ipsum dolor sit amet'
  }
}]

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

  it('Test xml parser', () => {
    const data = `
      <?xml version="1.0" encoding="UTF-8"?>
        <root>
          <row>
            <path>this-is-my-title</path>
            <title>This is my title</title>
            <text>Lorem ipsum dolor sit amet</text>
            <image>https://a.storyblok.com/f/51376/x/1502f01431/corporate-website.svg</image>
            <category>press</category>
          </row>
        </root>
    `

    xmlParser(data, 'About', 0)
      .then(res => {
        expect(res).toEqual(response)
      })
      .catch(err => {
        console.error(err)
      })
  })

  it('Test json parser', () => {
    const data = {
      'this-is-my-title': {
        title: 'This is my title',
        text: 'Lorem ipsum dolor sit amet',
        image: 'https://a.storyblok.com/f/51376/x/1502f01431/corporate-website.svg',
        category: 'press'
      }
    }

    jsonParser(JSON.stringify(data), 'About', 0)
      .then(res => {
        expect(res).toEqual(response)
      })
      .catch(err => {
        console.error(err)
      })
  })

  it('Test csv parser', () => {
    const data = `path;title;text;image;category
      this-is-my-title;This is my title;"Lorem ipsum dolor sit amet";https://a.storyblok.com/f/51376/x/1502f01431/corporate-website.svg;press`

    csvParser(data, 'About', 0)
      .then(res => {
        expect(res).toEqual(response)
      })
      .catch(err => {
        console.error(err)
      })
  })

  it('Test sendContent function', async () => {
    const URL = 'https://api.storyblok.com/v1/'
    const stories = FAKE_STORIES()[0]

    const FAKE_API = {
      getClient: jest.fn(() => Promise.resolve({
        oauthToken: process.env.STORYBLOK_TOKEN
      }, URL)),
      post: jest.fn(() => Promise.resolve(stories.name)),
      spaceId: jest.fn(() => Promise.resolve(75070))
    }

    await sendContent(FAKE_API, [stories])
      .then(() => {
        expect(FAKE_API.post).toBe(stories.name)
      })
      .catch(err => {
        console.error(err)
      })
  })
})
