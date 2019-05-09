import { join, sep } from 'path'
import { find } from 'fs-jetpack'
import { Application } from 'egg'
import fs from "fs-extra";
import { watch } from "chokidar";
import { createConnection, getRepository } from 'typeorm'
import { getModelName, createTyingFile } from './src/lib'


export function watchEntity(app: Application) {
  const { baseDir } = app;
  const config = app.config.typeorm.connection;
  let entityDir = join(baseDir, "app", "entity");
  if(config.cli && config.cli.entitiesDir) {
    entityDir = config.cli.entitiesDir;
  }
  const typingsDir = join(baseDir, "typings");

  if (!fs.existsSync(entityDir)) return;

  fs.ensureDirSync(typingsDir);
  watch(entityDir).on("all", (eventType: string) => {
    if (["add", "change"].includes(eventType)) {
      createTyingFile(app);
    }

    if (["unlink"].includes(eventType)) {
      createTyingFile(app);
    }
  });
}

async function connectDB(app: Application) {
  const config = app.config.typeorm
  const connection = await createConnection(config.connection)
  app.logger.debug(`typeorm conn ${config.connection.type}:${config.connection.database}`)
  app.context.connection = connection
}

async function loadEntityAndModel(app: Application) {
  const config = app.config.typeorm
  const { baseDir } = app
  if(!config.connection.entities) {
    return;
  }
  const files: string[] = [];

  for(let entitie of config.connection.entities as string[]) {
    if(entitie[0] !== sep) {
      files.push(...find(baseDir, { matching: entitie }))
    } else {
      files.push(...find({ matching: entitie }))
    }
  }
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
    app.logger.error(e);
  }
}

export default async (app: Application) => {
  const config = app.config.typeorm
  if (!config || !config.connection) {
    throw new Error('please config typeorm in config file')
  }

  app.beforeStart(async () => {
    try {
      await connectDB(app)
      if (app.config.typeorm.watch) {
        watchEntity(app)
      }
      await loadEntityAndModel(app)
    } catch (error) {
      app.logger.error(error)
    }
  })
}
