import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { DbOrders, dbOrdersRepo } from '../tasks/dbOrders.js';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';




export class OrderController {

  @BackendMethod({ allowed: true })
  static async placeOrder(order: stockOrder) {
    await dbOrdersRepo.insert({
        userId: remult.context.request!.session!["user"].id,
        stockName: order.stockName,
        orderType: order.orderType,
        stockPrice: order.stockPrice,
        shareQty: order.shareQty,
        orderTime: order.orderTime
    })
  }

  @BackendMethod({ allowed: true })
  static async getLastOrder(): Promise<DbOrders> {
    const orders = await dbOrdersRepo.find({where: {userId: remult.context.request!.session!["user"].id}, orderBy: {orderTime: 'desc'}})
    return orders[0]
  }

  @BackendMethod({ allowed: true })
  static async getAllOrders(): Promise<DbOrders[]> {
    return await dbOrdersRepo.find({where: {userId: remult.context.request!.session!["user"].id}, orderBy: {orderTime: 'desc'}})
    
  }
}