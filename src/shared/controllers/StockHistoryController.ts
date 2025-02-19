import { BackendMethod, remult } from 'remult'
import { dbCurrentDayStockDataRepo } from '../tasks/dbCurrentDayStockData.js';
import { DbStockHistoryData, dbStockHistoryDataRepo } from '../tasks/dbStockHistoryData.js';





export class StockHistoryController {

  

  @BackendMethod({ allowed: true })
  static async insertStockTick(stockName: string, stockPrice: number, time: number) {
    await dbCurrentDayStockDataRepo.insert({stockName: stockName, stockPrice: stockPrice, time: time})
  }

  @BackendMethod({ allowed: true })
  static async insertDailyHistory(stocks: DbStockHistoryData[]) {
    await dbStockHistoryDataRepo.insert(stocks)
  }


}