import { join, sep } from "path"
import fs from "fs-extra"
import { find } from "fs-jetpack"
import prettier from 'prettier'

export interface IConfig {
  baseDir: string;
}

export function formatCode(text: string) {
  return prettier.format(text, {
    semi: false,
    tabWidth: 2,
    singleQuote: true,
    parser: 'typescript',
    trailingComma: 'all',
  })
}

export function createTyingFile(app: IConfig) {
  const { baseDir } = app;
  const entityDir = join(baseDir, "app", "entity");
  const files = find(entityDir, { matching: "*.ts" });
  const typingPath = join(baseDir, "typings", "typeorm.d.ts");
  const pathArr = formatPaths(files);
  const importText = pathArr
    .map(i => `import ${i.name} from '${i.importPath}'`)
    .join("\n");
  const repoText = pathArr
    .map(i => `${i.name}: Repository<${i.name}>`)
    .join("\n");

  // TODO
  const entityText = pathArr.map(i => `${i.name}: ObjectType<${i.name}>`).join("\n");
  const text = getTypingText(importText, repoText, entityText);
  writeTyping(typingPath, text);
}

export function formatPaths(files: string[]) {
  return files.map(file => {
    const name = getModelName(file);
    const importPath = `../${file}`.replace(/\.ts$|\.js$/g, "");
    return {
      name,
      importPath
    };
  });
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getModelName(file: string) {
  const filename = file.split(sep).pop() || "";
  const name = capitalizeFirstLetter(filename.replace(/\.ts$|\.js$/g, ""));
  return name;
}

export function writeTyping(path: string, text: string) {
  fs.writeFileSync(path, formatCode(text), { encoding: "utf8" });
}

export function getTypingText(
  importText: string,
  repoText: string,
  entityText: string
) {
  const tpl = `
import 'egg'
import { Repository, Connection, ObjectType } from 'typeorm'
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
`;
  return tpl;
}
