import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { DbOrders, dbOrdersRepo } from '../tasks/dbOrders.js';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';
import { UsersStocks, usersStocksRepo } from '../tasks/usersStocks';




export class StockController {

  @BackendMethod({ allowed: true })
  static async getAllStocks(): Promise<UsersStocks[]> {
    const currentUser = getCurrentUser()
    const userInfo = await userRepo.findFirst({id: currentUser.id})
    return await usersStocksRepo.find({where: {userId: userInfo?.userId}})
  }

  @BackendMethod({ allowed: true })
  static async insertOrUpdateStock(stock: stockOrder) {
    const currentUser = getCurrentUser()
    const userInfo = await userRepo.findFirst({id: currentUser.id})
    let stocks = await usersStocksRepo.findFirst({userId: userInfo?.userId, stockName: stock.stockName})
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
            userId: userInfo?.userId,
            stockName: stock.stockName,
            shareQty: stock.shareQty
        })
    }
  }
}