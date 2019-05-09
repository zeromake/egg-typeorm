import { ConnectionOptions } from 'typeorm'

declare module 'egg' {
  interface EggAppConfig {
    typeorm: {
      /**
       * @description typeorm conn option
       */
      connection: ConnectionOptions;
      /**
       * @description watch entry generate typeorm.d.ts
       */
      watch: boolean;
    },
  }
}