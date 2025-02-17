import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';
import { dbRegressionUserStocks, dbRegressionUserStocksRepo } from '../tasks/dbRegressionUserStocks.js';




export class RegressionStockController {

  @BackendMethod({ allowed: true })
  static async getAllStocks(): Promise<dbRegressionUserStocks[]> {
    const currentUser = getCurrentUser()
    const userInfo = await userRepo.findFirst({id: currentUser.id})
    return await dbRegressionUserStocksRepo.find({where: {userId: userInfo?.userId}})
  }

  @BackendMethod({ allowed: true })
  static async insertOrUpdateStock(stock: stockOrder) {
    const currentUser = getCurrentUser()
    const userInfo = await userRepo.findFirst({id: currentUser.id})
    let stocks = await dbRegressionUserStocksRepo.findFirst({userId: userInfo?.userId, stockName: stock.stockName})
    if(stocks){
        if(stock.orderType == 'Buy'){
            let newStockAmnt = stocks.shareQty + stock.shareQty
            await dbRegressionUserStocksRepo.save({...stocks, shareQty: newStockAmnt})
        }
        else{
            let newStockAmnt = stocks.shareQty - stock.shareQty
            await dbRegressionUserStocksRepo.save({...stocks, shareQty: newStockAmnt})
        }
        
    }
    else{
        await dbRegressionUserStocksRepo.insert({
            userId: userInfo?.userId,
            stockName: stock.stockName,
            shareQty: stock.shareQty
        })
    }
  }
}