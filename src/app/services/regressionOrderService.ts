import { RegFinanceController } from "../../shared/controllers/regressionFInanceController";
import { RegressionOrderController } from "../../shared/controllers/RegressionOrderController";
import { RegressionStockController } from "../../shared/controllers/RegressionStockController";
import { DbRegressionOrders } from "../../shared/tasks/dbRegressionOrders";
import { stockOrder } from "../Dtos/stockOrder";

export class RegressionOrderService {

    static async executeOrder(order: stockOrder, stockHistory: DbRegressionOrders) {

        await RegressionOrderController.placeOrder(order)
        if (order.orderType == 'Buy') {
            //if buy then just take the money out of the spending 
            await RegFinanceController.insertOrUpdateAmountReg((order.shareQty * order.stockPrice) * -1)
        }
        else {
            //if selling for a loss then don't put any money in saving, just back into spending
            if(order.stockPrice <= stockHistory.stockPrice){
                await RegFinanceController.insertOrUpdateAmountReg(order.shareQty * order.stockPrice)
            }
            //if selling for a profit then put half the profit into savings and the other half back into spending
            else{
                let amountOfProfitForEach = ((order.shareQty * order.stockPrice) - (stockHistory.shareQty * stockHistory.stockPrice)) / 2
                await RegFinanceController.insertOrUpdateAmountReg((order.shareQty * order.stockPrice) - amountOfProfitForEach, amountOfProfitForEach)
            }
            
            
        }
        await RegressionStockController.insertOrUpdateStock(order)

    }
}