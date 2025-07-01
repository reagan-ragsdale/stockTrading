
import { getIntraDayHistoryData, getAllTickers } from "../../server/polygonApiCalls.js"
import { DbStockHistoryData, dbStockHistoryDataRepo } from "../../shared/tasks/dbStockHistoryData.js"
import { tickerRepo, tickers } from "../../shared/tasks/tickers.js"

export const getAllTickersCall = async () => {
    await sendTickerCall()
}

async function sendTickerCall(symbol?: string) {
    if (symbol) {
        let tickerInfo = await getAllTickers(symbol)
        if (tickerInfo.length > 0) {
            let tickerData: tickers[] = []
            for (let i = 0; i < tickerInfo.length; i++) {
                tickerData.push({ name: tickerInfo[i].ticker, exchange: tickerInfo[i].primary_exchange })
            }
            await tickerRepo.insert(tickerData)
            if (tickerInfo.length == 1000) {
                await sendTickerCall(tickerInfo[tickerInfo.length - 1].ticker)
            }
        }
    }
    else {
        let tickerInfo = await getAllTickers()
        if (tickerInfo.length > 0) {
            let tickerData: tickers[] = []
            for (let i = 0; i < tickerInfo.length; i++) {
                tickerData.push({ name: tickerInfo[i].ticker, exchange: tickerInfo[i].primary_exchange })
            }
            await tickerRepo.insert(tickerData)
            if (tickerInfo.length == 1000) {
                await sendTickerCall(tickerInfo[tickerInfo.length - 1].ticker)
            }
        }
    }

}