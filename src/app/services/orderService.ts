import { OrderController } from "../../shared/controllers/OrderController";
import { SimFinance } from "../../shared/controllers/SimFinance";
import { StockController } from "../../shared/controllers/StockController";
import { DbOrders } from "../../shared/tasks/dbOrders";
import { stockOrder } from "../Dtos/stockOrder";

export class OrderService {

    static async executeOrder(order: stockOrder, stockHistory: DbOrders) {

        await OrderController.placeOrder(order)
        if (order.orderType == 'Buy') {
            //if buy then just take the money out of the spending 
            await SimFinance.insertOrUpdateAmount((order.shareQty * order.stockPrice) * -1)
        }
        else {
            await SimFinance.insertOrUpdateAmount(order.shareQty * order.stockPrice)
        }
        await StockController.insertOrUpdateStock(order)

    }
}