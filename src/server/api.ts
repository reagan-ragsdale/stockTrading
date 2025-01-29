import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/tasks/Task.js'
import { AuthController } from '../shared/controllers/AuthController.js'
import { createPostgresDataProvider } from "remult/postgres"
import { Users } from '../shared/tasks/Users.js'

export const api = remultExpress({
    controllers:[AuthController],
    entities: [Task,Users],
    admin:true,
    getUser: (req) => req.session!['user'],
    dataProvider: process.env['DATABASE_URL'] ?
    createPostgresDataProvider({
      caseInsensitiveIdentifiers: true,
      connectionString: process.env['DATABASE_URL']
    }) : undefined /* createPostgresDataProvider({
      caseInsensitiveIdentifiers: true,
      connectionString: ev.dbConnection
      
    })  */
})