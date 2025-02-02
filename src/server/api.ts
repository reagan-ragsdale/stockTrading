import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/tasks/Task.js'
import { AuthController } from '../shared/controllers/AuthController.js'
import { createPostgresDataProvider } from "remult/postgres"
import { Users } from '../shared/tasks/Users.js'
import { config } from 'dotenv'
import { generate, verify } from 'password-hash'
import { initRequest } from './server-session.js';
import { Rhkeys } from '../shared/tasks/rhkeys.js'
import { SimFinance } from '../shared/controllers/SimFinance.js'
import { SimFInance } from '../shared/tasks/simFinance.js'
//import ev from '../../environmentVariables.json'

config()
AuthController.generate = generate;
AuthController.verify = verify

export const api = remultExpress({
    controllers:[AuthController, SimFinance],
    entities: [Task,Users,Rhkeys, SimFInance],
    admin:true,
    getUser: (req) => req.session!['user'],
    dataProvider: process.env['DATABASE_URL'] ?
    createPostgresDataProvider({
      caseInsensitiveIdentifiers: true,
      connectionString: process.env['DATABASE_URL']
    }) : undefined /* createPostgresDataProvider({
      caseInsensitiveIdentifiers: true,
      connectionString: ev.dbConnection 
      
    })  */ ,
    initRequest
    ,initApi: async () => {

    }
})