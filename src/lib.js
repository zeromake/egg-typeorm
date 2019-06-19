const { join, sep } = require("path");
const fs = require("fs-extra");
const { find } = require("fs-jetpack");

function createTyingFile(app) {
    const { baseDir } = app;
    const entityDir = join(baseDir, "app", "entity");
    const files = find(entityDir, { matching: "*.ts" });
    const typingPath = join(baseDir, "typings", "typeorm.d.ts");
    const pathArr = formatPaths(files);
    const importText = pathArr.map(
        i => `import ${i.name} from '${i.importPath}';`
    );
    const repoText = pathArr.map(i => `${i.name}: Repository<${i.name}>`);

    // TODO
    const entityText = pathArr.map(i => `${i.name}: typeof ${i.name}`);
    const text = getTypingText(importText, repoText, entityText);
    writeTyping(typingPath, text);
}

function formatPaths(files) {
    return files.map(file => {
        const name = getModelName(file);
        const importPath = `../${file}`.replace(/\.ts$|\.js$/g, "");
        return {
            name,
            importPath
        };
    });
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getModelName(file) {
    const filename = file.split(sep).pop() || "";
    const name = capitalizeFirstLetter(filename.replace(/\.ts$|\.js$/g, ""));
    return name;
}

function writeTyping(path, text) {
    fs.writeFileSync(path, text, { encoding: "utf8" });
}

function getTypingText(importText, repoText, entityText) {
    const tpl = `import 'egg';
import { Repository, Connection } from 'typeorm';
${importText.join("\n")}

declare module 'egg' {
    interface Context {
        connection: Connection;
        entity: {
            ${entityText.join("\n            ")}
        }
        repo: {
            ${repoText.join("\n            ")}
        }
    }
}
`;
    return tpl;
}

module.exports = {
    getTypingText,
    writeTyping,
    getModelName,
    capitalizeFirstLetter,
    formatPaths,
    createTyingFile,
};
