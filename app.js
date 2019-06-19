const { join, sep } = require("path");
const { find } = require("fs-jetpack");
const fs = require("fs-extra");
const { watch } = require("chokidar");
const {
    createConnection,
    getRepository,
    getConnectionManager,
    getConnection
} = require("typeorm");
const { getModelName, createTyingFile } = require("./src/lib");

function watchEntity(app) {
    const { baseDir } = app;
    const config = app.config.typeorm.connection;
    let entityDir = join(baseDir, "app", "entity");
    if (config.cli && config.cli.entitiesDir) {
        entityDir = config.cli.entitiesDir;
    }
    const typingsDir = join(baseDir, "typings");

    if (!fs.existsSync(entityDir)) return;

    fs.ensureDirSync(typingsDir);
    watch(entityDir).on("all", eventType => {
        if (["add", "change", "unlink"].includes(eventType)) {
            createTyingFile(app);
        }
    });
}

async function closeDB() {
    const manager = getConnectionManager();
    for (const conn of manager.connections) {
        if (conn.isConnected) {
            await conn.close();
        }
    }
}

async function connectDB(app) {
    const config = app.config.typeorm;
    let connection = null;
    if (getConnectionManager().has("default")) {
        connection = getConnection("default");
    } else {
        connection = await createConnection(config.connection);
        app.logger.debug(
            `typeorm conn ${config.connection.type}:${
                config.connection.database
            }`
        );
    }
    app.context.connection = connection;
}

async function loadEntityAndModel(app) {
    const config = app.config.typeorm;
    const { baseDir } = app;
    if (!config.connection.entities) {
        return;
    }
    const files = [];

    for (let entitie of config.connection.entities) {
        if (entitie[0] !== sep) {
            files.push(...find(baseDir, { matching: entitie }));
        } else {
            files.push(...find({ matching: entitie }));
        }
    }
    app.context.repo = {};
    app.context.entity = {};

    try {
        for (const file of files) {
            const entityPath = join(baseDir, file);
            const entity = require(entityPath).default;

            const name = getModelName(file);
            app.context.repo[name] = getRepository(entity);
            app.context.entity[name] = entity;
        }
    } catch (e) {
        app.logger.error(e);
    }
}

class AppBootHook {
    constructor(app) {
        this.app = app;
    }
    async didLoad() {
        const app = this.app;
        const config = app.config.typeorm;
        if (!config || !config.connection) {
            throw new Error("please config typeorm in config file");
        }
        try {
            await connectDB(app);
            if (config.watch) {
                watchEntity(app);
            }
            await loadEntityAndModel(app);
        } catch (error) {
            app.logger.error(error);
        }
    }
    async beforeClose() {
        return closeDB();
    }
}
module.exports = AppBootHook;
