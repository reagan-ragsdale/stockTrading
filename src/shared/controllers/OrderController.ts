import { BackendMethod, remult } from 'remult'
import { stockOrder } from '../../app/Dtos/stockOrder';
import { dbOrdersRepo } from '../tasks/dbOrders';
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users';




export class OrderController {

  @BackendMethod({ allowed: true })
  static async placeOrder(order: stockOrder) {
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
  }
}