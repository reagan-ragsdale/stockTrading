import { OrderController } from "../../shared/controllers/orderController";
import { SimFinance } from "../../shared/controllers/SimFinance";
import { stockOrder } from "../Dtos/stockOrder";

export class OrderService{

    static async executeOrder(order: stockOrder): Promise<number> {
        try{
            await OrderController.placeOrder(order)
            if(order.orderType == 'Buy'){
                await SimFinance.insertOrUpdateAmount((order.shareQty * order.stockPrice) * -1)
            }
            else {
                await SimFinance.insertOrUpdateAmount(order.shareQty * order.stockPrice)
            }
            return 1;
        }
        catch(error: any){
            return 0;
        }
    }
}