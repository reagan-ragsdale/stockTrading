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
            //if selling for a loss then don't put any money in saving, just back into spending
            if(order.stockPrice <= stockHistory.stockPrice){
                await SimFinance.insertOrUpdateAmount(order.shareQty * order.stockPrice)
            }
            //if selling for a profit then put half the profit into savings and the other half back into spending
            else{
                let amountOfProfitForEach = ((order.shareQty * order.stockPrice) - (stockHistory.shareQty * stockHistory.stockPrice)) / 2
                await SimFinance.insertOrUpdateAmount((order.shareQty * order.stockPrice) - amountOfProfitForEach, amountOfProfitForEach)
            }
            
            
        }
        await StockController.insertOrUpdateStock(order)

    }
}