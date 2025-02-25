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
import { RegressionFinance } from '../shared/tasks/regressionFinance.js'
import { RegFinanceController } from '../shared/controllers/regressionFInanceController.js'
import { RegressionOrderController } from '../shared/controllers/RegressionOrderController.js'
import { DbRegressionOrders } from '../shared/tasks/dbRegressionOrders.js'
import { RegressionStockController } from '../shared/controllers/RegressionStockController.js'
import { dbRegressionUserStocks } from '../shared/tasks/dbRegressionUserStocks.js'
import { DbTOkens } from '../shared/tasks/dbTokens.js'
import { insertCall } from './insertStockData.js'
import { StockHistoryController } from '../shared/controllers/StockHistoryController.js'
import { DbStockHistoryData } from '../shared/tasks/dbStockHistoryData.js'
import { DbCurrentDayStockData } from '../shared/tasks/dbCurrentDayStockData.js'
import { loadDailyDataIntoHistory } from '../app/apiCalls/loadDailyDataIntoHistory.js'
//import ev from '../../environmentVariables.json'

config()
AuthController.generate = generate;
AuthController.verify = verify
OAuthContoller.sendCall = oauthCall;




export const api = remultExpress({
    controllers:[AuthController, SimFinance, OAuthContoller, OrderController,StockController, RegFinanceController, RegressionOrderController, RegressionStockController, StockHistoryController],
    entities: [Task,Users,Rhkeys, SimFInance, testEnc, DbOrders, UsersStocks,RegressionFinance, DbRegressionOrders, dbRegressionUserStocks, DbTOkens, DbStockHistoryData, DbCurrentDayStockData],
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
      insertCall(),
      //cron.schedule('30 14 * * *', () => insertCall())
      cron.schedule('*/25 * * * *', () => loadNewToken()),
      cron.schedule('0 22 * * * ', () => loadDailyDataIntoHistory())
    }
})
