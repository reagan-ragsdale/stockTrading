import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { DbOrders, dbOrdersRepo } from '../tasks/dbOrders.js';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';
import { UsersStocks, usersStocksRepo } from '../tasks/usersStocks.js';




export class StockController {

  @BackendMethod({ allowed: true })
  static async getAllStocks(): Promise<UsersStocks[]> {
    return await usersStocksRepo.find({where: {userId: remult.context.request!.session!["user"].id}})
  }

  @BackendMethod({ allowed: true })
  static async insertOrUpdateStock(stock: stockOrder) {
    let stocks = await usersStocksRepo.findFirst({userId: remult.context.request!.session!["user"].id, stockName: stock.stockName})
    if(stocks){
        if(stock.orderType == 'Buy'){
            let newStockAmnt = stocks.shareQty + stock.shareQty
            await usersStocksRepo.save({...stocks, shareQty: newStockAmnt})
        }
        else{
            let newStockAmnt = stocks.shareQty - stock.shareQty
            await usersStocksRepo.save({...stocks, shareQty: newStockAmnt})
        }
        
    }
    else{
        await usersStocksRepo.insert({
            userId: remult.context.request!.session!["user"].id,
            stockName: stock.stockName,
            shareQty: stock.shareQty
        })
    }
  }
}