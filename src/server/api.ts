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
import { StockHistoryController } from '../shared/controllers/StockHistoryController.js'
import { DbStockHistoryData } from '../shared/tasks/dbStockHistoryData.js'
import { DbCurrentDayStockData } from '../shared/tasks/dbCurrentDayStockData.js'
import { loadDailyDataIntoHistory } from '../app/apiCalls/loadDailyDataIntoHistory.js'
import { DbLevelTwoData } from '../shared/tasks/dbLevelTwoData.js'
import { socketCall } from './insertStockData.js'
import { resetTokens } from '../app/apiCalls/resetTokens.js'
import { DbStockBasicHistory } from '../shared/tasks/dbStockBasicHistory.js'
import { getDailyStockInfo } from '../app/apiCalls/getDailyStockInfo.js'
import { DbStockDashInfo } from '../shared/tasks/dbStockDashInfo.js'
import { DbAlgorithmList } from '../shared/tasks/dbAlgorithmList.js'
import { DbListOfProfits } from '../shared/tasks/dbListOfProfits.js'
import { SimulationController } from '../shared/controllers/SimulationController.js'
import { runIntraDaySim } from './runIntraDaySim.js'
import { SchwabController } from '../shared/controllers/SchwabController.js'
import { getAccountInfo, getAccountNumbers, getEnvironment, getOrdersForAccount, getOrdersForAccountById, placeOrderForAccount } from './schwabApiCalls.js'
import { LoggerController } from '../shared/controllers/LoggerController.js'
import { emailer } from './log-emailer.js'
import { createExcel } from './logReport.js'
import { DbSchwabOrders } from '../shared/tasks/dbSchwabOrders.js'
import { getIntraDayStockData } from '../app/apiCalls/getIntraDayStockData.js'
import { getAllTickersCall } from '../app/apiCalls/getAllTickers.js'
import { tickers } from '../shared/tasks/tickers.js'

//import ev from '../../environmentVariables.json'

config()
AuthController.generate = generate;
AuthController.verify = verify
OAuthContoller.sendCall = oauthCall;
SimulationController.intraDaySimulation = runIntraDaySim
SchwabController.getAccountNumbers = getAccountNumbers
SchwabController.getAccountInfo = getAccountInfo
SchwabController.getEnvironment = getEnvironment
SchwabController.getOrdersForAccount = getOrdersForAccount
SchwabController.placeOrderForAccount = placeOrderForAccount
SchwabController.getOrderByIdForAccount = getOrdersForAccountById
LoggerController.sendEmail = emailer
LoggerController.generateExcel = createExcel




export const api = remultExpress({
  controllers: [AuthController, SimFinance, OAuthContoller, OrderController, StockController, RegFinanceController, RegressionOrderController, RegressionStockController, StockHistoryController, SimulationController, SchwabController, LoggerController],
  entities: [
    Task,
    Users,
    Rhkeys,
    SimFInance,
    testEnc,
    DbOrders,
    UsersStocks,
    RegressionFinance,
    DbRegressionOrders,
    dbRegressionUserStocks,
    DbTOkens,
    DbStockHistoryData,
    DbCurrentDayStockData,
    DbLevelTwoData,
    DbStockBasicHistory,
    DbStockDashInfo,
    DbAlgorithmList,
    DbListOfProfits,
    DbSchwabOrders,
    tickers
  ],
  admin: true,
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
  , initApi: async () => {
    //socketCall(),
    //orig 30 13
    if (process.env['environment'] == 'Prod') {
      //cron.schedule('0 11 * * 2-6', () => getDailyStockInfo()),
      cron.schedule('30 13 * * 1-5', () => socketCall()),

        cron.schedule('0 9 * * 1,4', () => resetTokens()),
        cron.schedule('*/25 * * * *', () => loadNewToken()),
        //cron.schedule('45 20 * * 1-5 ', () => loadDailyDataIntoHistory()),
        cron.schedule('10 20 * * 1-5 ', () => LoggerController.sendEmailCall()),
        getAllTickersCall()
      //getDailyStockInfo()
    }

    //LoggerController.sendEmailCall()
    //loadDailyDataIntoHistory()



  }
})
