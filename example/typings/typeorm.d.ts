import 'egg'
import { Repository } from 'typeorm'
import User from '../app/entity/User'

declare module 'egg' {
  interface Context {
    model: {
      User: Repository<User>
    }
  }
}
