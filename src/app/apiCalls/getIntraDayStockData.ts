
import { getIntraDayHistoryData } from "../../server/getIntraDatHistory.js"
import { DbStockHistoryData, dbStockHistoryDataRepo } from "../../shared/tasks/dbStockHistoryData.js"

export const getIntraDayStockData = async () => {


    let stocks: string[] = ['AAPL']


    for (let i = 0; i < stocks.length; i++) {
        let insertData: DbStockHistoryData[] = []
        let stockData = await getIntraDayHistoryData(stocks[i], '2015-07-01')
        console.log(stockData)

        /*  for (let j = 0; j < stockData.candles.length; j++) {
             insertData.push({
                 stockName: stockData.symbol,
                 open: stockData.candles[j].open,
                 close: stockData.candles[j].close,
                 high: stockData.candles[j].high,
                 low: stockData.candles[j].low,
                 volume: stockData.candles[j].volume,
                 date: stockData.candles[j].datetime
             })
         }
         await dbStockBasicHistoryRepo.insert(insertData) */
    }





}