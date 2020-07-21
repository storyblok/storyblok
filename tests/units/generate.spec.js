const inquirer = require('inquirer')
const fs = require('fs-extra')

const { FAKE_COMPONENTS } = require('../constants')
const generateMigration = require('../../src/tasks/migrations/generate')
const templateFile = require('../../src/tasks/templates/migration-file')
const templateFileData = templateFile.replace(/{{ fieldname }}/g, 'subtitle')

jest.mock('fs-extra')

const getPath = fileName => `${process.cwd()}/migrations/${fileName}`

const FAKE_API = {
  getComponents: jest.fn(() => Promise.resolve(FAKE_COMPONENTS()))
}

const FILE_NAME = 'change_teaser_subtitle.js'

describe('testing generateMigration', () => {
  describe('when migration file does not exists', () => {
    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('It returns correctly fileName and created properties when the file does not exists', async () => {
      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(data => {
          expect(data.fileName).toBe(FILE_NAME)

          expect(data.created).toBe(true)
        })
    })

    it('It checks if the file exists', async () => {
      const filePath = getPath(FILE_NAME)

      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(() => {
          // call once
          expect(FAKE_API.getComponents.mock.calls.length).toBe(1)

          // the first call receives the file path
          expect(fs.pathExists.mock.calls[0][0]).toBe(filePath)
        })
    })

    it('It create the file correctly', async () => {
      const filePath = getPath(FILE_NAME)

      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(() => {
          // call once
          expect(fs.outputFile.mock.calls.length).toBe(1)

          // the first call receives the file argument
          expect(fs.outputFile.mock.calls[0][0]).toBe(filePath)

          // the first call receives a string with template
          expect(fs.outputFile.mock.calls[0][1]).toBe(templateFileData)
        })
    })
  })

  it('It throws an error when component does not exists', async () => {
    try {
      await generateMigration(FAKE_API, 'produce', 'price')
    } catch (e) {
      expect(e.message).toBe('The component does not exists')
    }
  })

  describe('when migration file exists and user choice do not overwrite', () => {
    let backup

    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getPath(FILE_NAME)]: templateFile
      })

      backup = inquirer.prompt
      inquirer.prompt = () => Promise.resolve({ choice: false })
    })

    afterEach(() => {
      jest.clearAllMocks()

      inquirer.prompt = backup
    })

    it('It does not overwrite the migration file', async () => {
      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(data => {
          expect(data.fileName).toBe(FILE_NAME)

          expect(data.created).toBe(false)
        })
    })

    it('It checks if the file exists', async () => {
      const filePath = getPath(FILE_NAME)

      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(() => {
          // call once
          expect(FAKE_API.getComponents.mock.calls.length).toBe(1)

          // the first call receives the file path
          expect(fs.pathExists.mock.calls[0][0]).toBe(filePath)
        })
    })

    it('It does not create the file', async () => {
      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(() => {
          // don't call
          expect(fs.outputFile.mock.calls.length).toBe(0)
        })
    })
  })

  describe('when migration file exists and user choice do overwrite', () => {
    let backup

    beforeEach(() => {
      require('fs-extra').__clearMockFiles()
      require('fs-extra').__setMockFiles({
        [getPath(FILE_NAME)]: templateFile
      })

      backup = inquirer.prompt
      inquirer.prompt = () => Promise.resolve({ choice: true })
    })

    afterEach(() => {
      jest.clearAllMocks()

      inquirer.prompt = backup
    })

    it('It does overwrite the migration file', async () => {
      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(data => {
          expect(data.fileName).toBe(FILE_NAME)

          expect(data.created).toBe(true)
        })
    })

    it('It checks if the file exists', async () => {
      const filePath = getPath(FILE_NAME)

      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(() => {
          // call once
          expect(FAKE_API.getComponents.mock.calls.length).toBe(1)

          // the first call receives the file path
          expect(fs.pathExists.mock.calls[0][0]).toBe(filePath)
        })
    })

    it('It does create the file', async () => {
      const filePath = getPath(FILE_NAME)

      return generateMigration(FAKE_API, 'teaser', 'subtitle')
        .then(() => {
          // call once
          expect(fs.outputFile.mock.calls.length).toBe(1)

          // the first call receives the file argument
          expect(fs.outputFile.mock.calls[0][0]).toBe(filePath)

          // the first call receives a string with template
          expect(fs.outputFile.mock.calls[0][1]).toBe(templateFileData)
        })
    })
  })
})
