
import { getIntraDayHistoryData, getAllTickers } from "../../server/polygonApiCalls.js"
import { DbStockHistoryData, dbStockHistoryDataRepo } from "../../shared/tasks/dbStockHistoryData.js"

export const getAllTickersCall = async () => {
    await sendTickerCall()
}

async function sendTickerCall(symbol?: string) {
    if (symbol) {
        let tickerInfo = await getAllTickers(symbol)
    }
    else {
        let tickerInfo = await getAllTickers()
        if (tickerInfo.length > 0) {
            for (let i = 0; i < tickerInfo.length; i++) {

            }
        }
    }

}