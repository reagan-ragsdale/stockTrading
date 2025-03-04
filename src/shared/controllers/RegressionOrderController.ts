import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { DbRegressionOrders, dbRegressionOrdersRepo } from '../tasks/dbRegressionOrders.js';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';




export class RegressionOrderController {

  @BackendMethod({ allowed: true })
  static async placeOrder(order: stockOrder) {
    await dbRegressionOrdersRepo.insert({
        userId: remult.context.request!.session!["user"].id,
        stockName: order.stockName,
        orderType: order.orderType,
        stockPrice: order.stockPrice,
        shareQty: order.shareQty,
        orderTime: order.orderTime
    })
  }

  @BackendMethod({ allowed: true })
  static async getLastOrder(): Promise<DbRegressionOrders> {
    const orders = await dbRegressionOrdersRepo.find({where: {userId: remult.context.request!.session!["user"].id}, orderBy: {orderTime: 'desc'}})
    return orders[0]
  }

  @BackendMethod({ allowed: true })
  static async getAllOrders(): Promise<DbRegressionOrders[]> {
    return await dbRegressionOrdersRepo.find({where: {userId: remult.context.request!.session!["user"].id}, orderBy: {orderTime: 'desc'}})
    
  }
  
}