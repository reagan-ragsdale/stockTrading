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
import { initApp } from '../app/app.config.js'
import { testEnc } from '../shared/tasks/testEnc.js'
import { oauthCall } from './oauth-server.js'
import { OAuthContoller } from '../shared/controllers/OAuthController.js'
import { OrderController } from '../shared/controllers/OrderController.js'
import { DbOrders } from '../shared/tasks/dbOrders.js'
import cron from 'node-cron'
import { loadNewToken } from '../app/apiCalls/loadNewAccessToken.js'
import { UsersStocks } from '../shared/tasks/usersStocks.js'
import { StockController } from '../shared/controllers/StockController.js'
//import ev from '../../environmentVariables.json'

config()
AuthController.generate = generate;
AuthController.verify = verify
OAuthContoller.sendCall = oauthCall;




export const api = remultExpress({
    controllers:[AuthController, SimFinance, OAuthContoller, OrderController,StockController],
    entities: [Task,Users,Rhkeys, SimFInance, testEnc, DbOrders, UsersStocks],
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
      //cron.schedule('*/25 * * * *', () => loadNewToken())
    }
})