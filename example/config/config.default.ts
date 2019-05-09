import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1551875313892_8568';

  const env = appInfo.env;
  const postFix = env === 'local' ? '.ts' : '.js';
  const { baseDir } = appInfo;

  config.typeorm = {
    connection: {
      type: 'mysql',
      host: 'test',
      port: 3306,
      username: 'test',
      password: 'test',
      database: 'test',
      synchronize: false,
      logging: false,
      entities: [ baseDir + `/app/entity/**/*${postFix}` ],
      migrations: [ baseDir + `/app/migration/**/*${postFix}` ],
      subscribers: [ baseDir + `/app/subscriber/**/*${postFix}` ],
      cli: {
        entitiesDir: baseDir + '/app/entity',
        migrationsDir: baseDir + '/app/migration',
        subscribersDir: baseDir + '/app/subscriber',
      },
    },
  };

  // add your egg config in here
  config.middleware = [];

  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  };

  // the return config will combines to EggAppConfig
  return {
    ...config,
    ...bizConfig,
  };
};
