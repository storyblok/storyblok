const path = require('path')
const migrationFile = require('./migrations/change_teaser_subtitle')

// migration that does not execute any change in content
const headlineMigrationFile = require('./migrations/change_teaser_headline')

const { FAKE_STORIES } = require('../constants')
const runMigration = require('../../src/tasks/migrations/run')

jest.mock('fs-extra')

const FILE_NAME = 'change_teaser_subtitle.js'

const migrationPath = path.resolve(process.cwd(), __dirname, './migrations')

const getFilePath = (field, component = 'teaser') => {
  return `${migrationPath}/change_${component}_${field}.js`
}

describe('testing runMigration', () => {
  beforeEach(() => {
    require('fs-extra').__clearMockFiles()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the migration file does not exists', () => {
    it('it throws an exception', async () => {
      await expect(runMigration({}, 'teaser', 'subtitle')).rejects.toThrow(`The migration to combination ${FILE_NAME} doesn't exists`)
    })
  })

  describe('when the migration files does not exports a function', () => {
    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getFilePath('date')]: 'module.exports = {}'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('it throws an exception', async () => {
      const opt = {
        migrationPath
      }

      await expect(
        runMigration({}, 'teaser', 'date', opt)
      ).rejects.toThrow("The migration file doesn't export a function")
    })
  })

  describe('when the component does not exists in stories', () => {
    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getFilePath('subtitle')]: 'module.exports = {}'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('returns executed = false and motive = NO_STORIES', async () => {
      const FAKE_API = {
        getStories: jest.fn(() => Promise.resolve([]))
      }

      const opt = {
        migrationPath
      }

      expect(
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      ).toEqual({
        executed: false,
        motive: 'NO_STORIES'
      })
    })

    it('does not execute the migration file', async () => {
      const FAKE_API = {
        getStories: jest.fn(() => Promise.resolve([]))
      }

      const opt = {
        migrationPath
      }

      await runMigration(FAKE_API, 'teaser', 'subtitle', opt)

      // the function was not executed
      expect(migrationFile).not.toHaveBeenCalled()
    })
  })

  describe('when execute with isDryrun enable', () => {
    const FAKE_API = {
      getStories: jest.fn(() => Promise.resolve(FAKE_STORIES())),
      getSingleStory: jest.fn(id => {
        const data = FAKE_STORIES().filter(story => story.id === id)[0] || {}
        return Promise.resolve(data)
      }),
      put: jest.fn(() => {})
    }

    const opt = {
      migrationPath,
      isDryrun: true
    }

    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getFilePath('subtitle')]: 'module.exports = {}'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('it execute the migration function', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the migration function was executed
      expect(migrationFile.mock.calls.length).toBe(2)
    })

    it('does not execute the api.put function', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the put function was executed
      expect(FAKE_API.put.mock.calls.length).toBe(0)
    })
  })

  describe('when migration does not change the content', () => {
    const FAKE_API = {
      getStories: jest.fn(() => Promise.resolve(FAKE_STORIES())),
      getSingleStory: jest.fn(id => {
        const data = FAKE_STORIES().filter(story => story.id === id)[0] || {}
        return Promise.resolve(data)
      }),
      put: jest.fn(() => {})
    }

    const opt = {
      migrationPath
    }

    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getFilePath('headline')]: 'module.exports = {}'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('it execute the migration function', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'headline', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the migration function was executed
      expect(headlineMigrationFile.mock.calls.length).toBe(2)
    })

    it('does not execute the api.put function', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'headline', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the put function was executed
      expect(FAKE_API.put.mock.calls.length).toBe(0)
    })
  })

  describe('when the execution is executed as expected', () => {
    const FAKE_API = {
      getStories: jest.fn(() => Promise.resolve(FAKE_STORIES())),
      getSingleStory: jest.fn(id => {
        const data = FAKE_STORIES().filter(story => story.id === id)[0] || {}
        return Promise.resolve(data)
      }),
      put: jest.fn(() => {})
    }

    const opt = {
      migrationPath
    }

    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getFilePath('subtitle')]: 'module.exports = {}'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('returns executed = true', async () => {
      expect(
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      ).toEqual({
        executed: true
      })
    })

    it('execute migration function for each component found', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the migration function was executed
      expect(migrationFile.mock.calls.length).toBe(2)
    })

    it('execute api.put with the story change', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the put function was executed
      expect(FAKE_API.put.mock.calls.length).toBe(2)

      // the first execution
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPath = firstExecution[0]
      const firstExecutiontionPayload = firstExecution[1]

      // path
      expect(firstExecutiontionPath).toBe('stories/0')

      // payload
      const firstExecutionContent = firstExecutiontionPayload.story.content
      expect(firstExecutionContent).toStrictEqual({
        _uid: '4bc98f32-6200-4176-86b0-b6f2ea14be6f',
        body: [
          {
            _uid: '111781de-3174-4f61-8ae3-0b653085a582',
            headline: 'My About Page',
            component: 'teaser',
            subtitle: 'Hey There!' // adds the field with value
          }
        ],
        component: 'page'
      })

      expect(firstExecutiontionPayload.force_update).toBe('1')

      // the second execution
      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutionPath = secondExecution[0]
      const secondExecutionPayload = secondExecution[1]

      // path
      expect(secondExecutionPath).toBe('stories/1')

      // content
      const secondExecutionContent = secondExecutionPayload.story.content
      expect(secondExecutionContent).toStrictEqual({
        _uid: '4bc98f32-6200-4176-86b0-b6f2ea14be6f',
        body: [
          {
            _uid: '111781de-3174-4f61-8ae3-0b653085a582',
            headline: 'Hello World!',
            component: 'teaser',
            subtitle: 'Hey There!'
          },
          {
            _uid: '2aae2a9b-df65-4572-be4c-e4460d81e299',
            columns: [
              {
                _uid: 'cd6efa74-31c3-47ec-96d2-91111f2a6c7c',
                name: 'Feature 1',
                component: 'feature',
                image_data: '//a.storyblok.com/f/67249/1024x512/64e7272404/headless.png'
              },
              {
                _uid: 'e994cb3e-0f2b-40a7-8db1-f3e456e7b868',
                name: 'Feature 2',
                component: 'feature'
              },
              {
                _uid: '779ee42f-a856-405c-9e34-5b49380ae4fe',
                name: 'Feature 3',
                component: 'feature'
              },
              {
                _uid: 'a315e9a7-4a0c-4cc5-b393-572533e8bf87',
                image: '//a.storyblok.com/f/67249/1024x512/64e7272404/headless.png',
                component: 'my-image'
              }
            ],
            component: 'grid'
          }
        ],
        component: 'page'
      })

      expect(secondExecutionPayload.force_update).toBe('1')
    })

    it('should publish be undefined', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the put function was executed
      expect(FAKE_API.put.mock.calls.length).toBe(2)

      // the first execution
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPayload = firstExecution[1]

      expect(firstExecutiontionPayload.publish).toBeUndefined()

      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutiontionPayload = secondExecution[1]

      expect(secondExecutiontionPayload.publish).toBeUndefined()
    })

    it('should lang be undefined', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', opt)
      } catch (e) {
        console.error(e)
      }

      // check how many times the put function was executed
      expect(FAKE_API.put.mock.calls.length).toBe(2)

      // the first execution
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPayload = firstExecution[1]

      expect(firstExecutiontionPayload.lang).toBeUndefined()

      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutiontionPayload = secondExecution[1]

      expect(secondExecutiontionPayload.lang).toBeUndefined()
    })
  })

  describe('when the user pass the publish option', async () => {
    const FAKE_API = {
      getStories: jest.fn(() => Promise.resolve(FAKE_STORIES())),
      getSingleStory: jest.fn(id => {
        const data = FAKE_STORIES().filter(story => story.id === id)[0] || {}
        return Promise.resolve(data)
      }),
      put: jest.fn(() => {})
    }

    const defaultOption = {
      migrationPath
    }

    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getFilePath('subtitle')]: 'module.exports = {}'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should publish=1 when the user pass all for all stories', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', {
          ...defaultOption,
          publish: 'all'
        })
      } catch (e) {
        console.error(e)
      }

      // the both stories should be publish
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPayload = firstExecution[1]

      expect(firstExecutiontionPayload.publish).toBe('1')

      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutiontionPayload = secondExecution[1]

      expect(secondExecutiontionPayload.publish).toBe('1')
    })

    it('should publish=1 for unpublished_changes stories when the user pass the published-with-changes option', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', {
          ...defaultOption,
          publish: 'published-with-changes'
        })
      } catch (e) {
        console.error(e)
      }

      // the both stories should be publish
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPayload = firstExecution[1]

      expect(firstExecutiontionPayload.publish).toBe('1')

      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutiontionPayload = secondExecution[1]

      expect(secondExecutiontionPayload.publish).toBeUndefined()
    })

    it('should publish=1 for stories already publish when the user pass the published option', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', {
          ...defaultOption,
          publish: 'published'
        })
      } catch (e) {
        console.error(e)
      }

      // the both stories should be publish
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPayload = firstExecution[1]

      expect(firstExecutiontionPayload.publish).toBeUndefined()

      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutiontionPayload = secondExecution[1]

      expect(secondExecutiontionPayload.publish).toBe('1')
    })
  })

  describe('when the user pass the publish-languages option', async () => {
    const FAKE_API = {
      getStories: jest.fn(() => Promise.resolve(FAKE_STORIES())),
      getSingleStory: jest.fn(id => {
        const data = FAKE_STORIES().filter(story => story.id === id)[0] || {}
        return Promise.resolve(data)
      }),
      put: jest.fn(() => {})
    }

    const defaultOption = {
      migrationPath,
      publish: 'all'
    }

    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getFilePath('subtitle')]: 'module.exports = {}'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should lang be undefined when the user pass anything', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', {
          ...defaultOption
        })
      } catch (e) {
        console.error(e)
      }

      // the both stories should be publish
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPayload = firstExecution[1]

      expect(firstExecutiontionPayload.lang).toBeUndefined()

      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutiontionPayload = secondExecution[1]

      expect(secondExecutiontionPayload.lang).toBeUndefined()
    })

    it('should lang=pt when the user pass pt', async () => {
      try {
        await runMigration(FAKE_API, 'teaser', 'subtitle', {
          ...defaultOption,
          publishLanguages: 'pt'
        })
      } catch (e) {
        console.error(e)
      }

      // the both stories should be publish
      const firstExecution = FAKE_API.put.mock.calls[0]
      const firstExecutiontionPayload = firstExecution[1]

      expect(firstExecutiontionPayload.lang).toBe('pt')

      const secondExecution = FAKE_API.put.mock.calls[1]
      const secondExecutiontionPayload = secondExecution[1]

      expect(secondExecutiontionPayload.lang).toBe('pt')
    })
  })
})
