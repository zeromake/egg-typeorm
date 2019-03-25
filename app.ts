import { join, sep } from 'path'
import { find } from 'fs-jetpack'
import { Application } from 'egg'
import { createConnection, getRepository } from 'typeorm'
import { watch } from 'chokidar'
import fs from 'fs-extra'
import prettier from 'prettier'

export function formatCode(text: string) {
  return prettier.format(text, {
    semi: false,
    tabWidth: 2,
    singleQuote: true,
    parser: 'typescript',
    trailingComma: 'all',
  })
}

async function connectDB(app: Application) {
  const config = app.config.typeorm
  const connection = await createConnection(config)
  app.context.connection = connection
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getModelName(file: string) {
  const filename = file.split(sep).pop() || ''
  const name = capitalizeFirstLetter(filename.replace(/\.ts$|\.js$/g, ''))
  return name
}

function writeTyping(path: string, text: string) {
  fs.writeFileSync(path, formatCode(text), { encoding: 'utf8' })
}

function getTypingText(
  importText: string,
  repoText: string,
  entityText: string,
) {
  const tpl = `
import 'egg'
import { Repository, Connection } from 'typeorm'
${importText}

declare module 'egg' {
  interface Context {
    connection: Connection
    entity: {
      ${entityText}
    }
    repo: {
      ${repoText}
    }
  }
}
`
  return tpl
}

function formatPaths(files: string[]) {
  return files.map(file => {
    const name = getModelName(file)
    const importPath = `../${file}`.replace(/\.ts$|\.js$/g, '')
    return {
      name,
      importPath,
    }
  })
}

function watchEntity(app: Application) {
  const { baseDir } = app
  const entityDir = join(baseDir, 'app', 'entity')
  const typingsDir = join(baseDir, 'typings')

  if (!fs.existsSync(entityDir)) return

  fs.ensureDirSync(typingsDir)
  watch(entityDir).on('all', (eventType: string) => {
    if (['add', 'change'].includes(eventType)) {
      createTyingFile(app)
    }

    if (['unlink'].includes(eventType)) {
      createTyingFile(app)
    }
  })
}

function createTyingFile(app: Application) {
  const { baseDir } = app
  const entityDir = join(baseDir, 'app', 'entity')
  const files = find(entityDir, { matching: '*.ts' })
  const typingPath = join(baseDir, 'typings', 'typeorm.d.ts')
  const pathArr = formatPaths(files)
  const importText = pathArr
    .map(i => `import ${i.name} from '${i.importPath}'`)
    .join('\n')
  const repoText = pathArr
    .map(i => `${i.name}: Repository<${i.name}>`)
    .join('\n')

  // TODO
  const entityText = pathArr.map(i => `${i.name}: any`).join('\n')
  const text = getTypingText(importText, repoText, entityText)
  writeTyping(typingPath, text)
}

async function loadEntityAndModel(app: Application) {
  const { baseDir } = app
  const entityDir = join(baseDir, 'app', 'entity')

  if (!fs.existsSync(entityDir)) return

  // TODO: handle other env
  const matching = app.config.env === 'local' ? '*.ts' : '*.js'

  const files = find(entityDir, { matching })
  app.context.repo = {}
  app.context.entity = {}

  try {
    for (const file of files) {
      const entityPath = join(baseDir, file)
      const entity = require(entityPath).default

      const name = getModelName(file)
      app.context.repo[name] = getRepository(entity)
      app.context.entity[name] = entity
    }
  } catch (e) {
    console.log(e)
  }
}

export default async (app: Application) => {
  const config = app.config.typeorm
  if (!config) {
    throw new Error('please config typeorm in config file')
  }

  app.beforeStart(async () => {
    try {
      await connectDB(app)
      // if (app.config.env === 'local') {
        watchEntity(app)
      // }
      await loadEntityAndModel(app)
    } catch (error) {
      app.logger.info(JSON.stringify(error))
    }
  })
}
