import 'egg';
import { Repository, Connection } from 'typeorm';
import User from '../app/entity/User';

declare module 'egg' {
    interface Context {
        connection: Connection
        entity: {
            User: typeof User
        }
        repo: {
            User: Repository<User>
        }
    }
}
