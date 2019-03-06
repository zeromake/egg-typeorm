# egg-sequelize

[TypeORM](https://typeorm.io/#/) plugin for Egg.js.

> NOTE: This plugin supports TypeScript only.

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/@forsigner/egg-typeorm.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@forsigner/egg-typeorm
[travis-image]: https://img.shields.io/travis/forsigner/@forsigner/egg-typeorm.svg?style=flat-square
[travis-url]: https://travis-ci.org/forsigner/@forsigner/egg-typeorm
[download-image]: https://img.shields.io/npm/dm/@forsigner/egg-typeorm.svg?style=flat-square
[download-url]: https://npmjs.org/package/@forsigner/egg-typeorm

<!--
Description here.
-->

## Install

```bash
$ yarn add @forsigner/egg-typeorm mysql
```

## Usage

```js
// {app_root}/config/plugin.ts
const plugin: EggPlugin = {
  typeorm: {
    enable: true,
    package: '@forsigner/egg-typeorm',
  },
}
```

## Configuration

```js
// {app_root}/config/config.default.ts
config.typeorm = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'test',
  password: 'test',
  database: 'test',
  synchronize: true,
  logging: false,
  entities: ['app/entity/**/*.ts'],
  migrations: ['app/migration/**/*.ts'],
  subscribers: ['app/subscriber/**/*.ts'],
}
```

## Example

[example](example)

## Questions & Suggestions

Please open an issue [here](https://github.com/forsigner/egg-typeorm/issues).

## License

[MIT](LICENSE)
