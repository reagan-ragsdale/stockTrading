import { StockHistoryController } from "../shared/controllers/StockHistoryController"

export const insertCall = async (): Promise<void> => {
    let i = 1
    setInterval(async () => {
        await StockHistoryController.insertStockTick('AAPL', i, i);
        i++;
    }, 1000)




}

