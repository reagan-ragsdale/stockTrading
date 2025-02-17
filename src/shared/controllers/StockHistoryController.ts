import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { DbOrders, dbOrdersRepo } from '../tasks/dbOrders.js';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';
import { UsersStocks, usersStocksRepo } from '../tasks/usersStocks.js';
import { dbCurrentDayStockDataRepo } from '../tasks/dbCurrentDayStockData';




export class StockHistoryController {

  

  @BackendMethod({ allowed: true })
  static async insertStockTick(stockName: string, stockPrice: number, time: number) {
    await dbCurrentDayStockDataRepo.insert({stockName: stockName, stockPrice: stockPrice, time: time})
  }
}