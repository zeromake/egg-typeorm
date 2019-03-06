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
  await createConnection(config)
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getModelName(file: string) {
  const filename = file.split(sep).pop() || ''
  const name = capitalizeFirstLetter(filename.replace(/\.ts$/, ''))
  return name
}

function writeTyping(path: string, text: string) {
  fs.writeFileSync(path, formatCode(text), { encoding: 'utf8' })
}

function getTypingText(importText: string, modelText: string) {
  const tpl = `
import 'egg'
import { Repository } from 'typeorm'
${importText}

declare module 'egg' {
  interface Context {
    model: {
      ${modelText}
    }
  }
}
`
  return tpl
}

function formatPaths(files: string[]) {
  return files.map(file => {
    const name = getModelName(file)
    const importPath = `../${file}`.replace(/\.ts$/, '')
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
  fs.ensureDirSync(entityDir)
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
  const modelText = pathArr
    .map(i => `${i.name}: Repository<${i.name}>`)
    .join('\n')
  const text = getTypingText(importText, modelText)
  writeTyping(typingPath, text)
}

function loadModel(app: Application) {
  const { baseDir } = app
  const entityDir = join(baseDir, 'app', 'entity')
  const files = find(entityDir, { matching: '*.ts' })
  app.context.model = {}

  try {
    for (const file of files) {
      const singleModel = require(join(baseDir, file)).default
      const name = getModelName(file)
      app.context.model[name] = getRepository(singleModel)
    }
  } catch (e) {
    console.log(e)
  }
}

export default async (app: Application) => {
  app.beforeStart(async () => {
    await connectDB(app)
    watchEntity(app)
    loadModel(app)
  })
}
