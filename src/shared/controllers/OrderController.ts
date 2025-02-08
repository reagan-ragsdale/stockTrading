import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { DbOrders, dbOrdersRepo } from '../tasks/dbOrders.js';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js';




export class OrderController {

  @BackendMethod({ allowed: true })
  static async placeOrder(order: stockOrder): Promise<boolean> {
    const currentUser = getCurrentUser()
    const userInfo = await userRepo.findFirst({userId: currentUser.id})
    await dbOrdersRepo.insert({
        userId: userInfo?.userId,
        stockName: order.stockName,
        orderType: order.orderType,
        stockPrice: order.stockPrice,
        shareQty: order.shareQty,
        orderTime: order.orderTime
    })
    return order.orderType == 'Buy' ? true : false
  }

  @BackendMethod({ allowed: true })
  static async getLastOrder(): Promise<DbOrders> {
    const currentUser = getCurrentUser()
    const userInfo = await userRepo.findFirst({userId: currentUser.id})
    const orders = await dbOrdersRepo.find({where: {userId: userInfo?.userId}, orderBy: {orderTime: 'desc'}})
    return orders[0]
  }
}