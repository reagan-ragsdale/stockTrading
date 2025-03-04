import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';
import { dbRegressionUserStocks, dbRegressionUserStocksRepo } from '../tasks/dbRegressionUserStocks.js';




export class RegressionStockController {

  @BackendMethod({ allowed: true })
  static async getAllStocks(): Promise<dbRegressionUserStocks[]> {
    return await dbRegressionUserStocksRepo.find({where: {userId: remult.context.request!.session!["user"].id}})
  }

  @BackendMethod({ allowed: true })
  static async insertOrUpdateStock(stock: stockOrder) {
    let stocks = await dbRegressionUserStocksRepo.findFirst({userId: remult.context.request!.session!["user"].id, stockName: stock.stockName})
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
            userId: remult.context.request!.session!["user"].id,
            stockName: stock.stockName,
            shareQty: stock.shareQty
        })
    }
  }

}