import { OrderController } from "../../shared/controllers/OrderController";
import { SimFinance } from "../../shared/controllers/SimFinance";
import { StockController } from "../../shared/controllers/StockController";
import { stockOrder } from "../Dtos/stockOrder";

export class OrderService {

    static async executeOrder(order: stockOrder) {

        await OrderController.placeOrder(order)
        if (order.orderType == 'Buy') {
            await SimFinance.insertOrUpdateAmount((order.shareQty * order.stockPrice) * -1)
        }
        else {
            await SimFinance.insertOrUpdateAmount(order.shareQty * order.stockPrice)
            
        }
        await StockController.insertOrUpdateStock(order)

    }
}