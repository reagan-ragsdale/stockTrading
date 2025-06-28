import { getHistoryStockData } from "../../server/getHistoryStockData.js"
import { DbStockBasicHistory, dbStockBasicHistoryRepo } from "../../shared/tasks/dbStockBasicHistory.js"
import { dbStockHistoryDataRepo } from "../../shared/tasks/dbStockHistoryData.js"

export const getDailyStockInfo = async () => {
    //load daily basic stock data
    //then in the algo file check to see if the price is near the variaance in 

    //let stocks = (await dbStockHistoryDataRepo.groupBy({ group: ['stockName'], orderBy: { stockName: 'desc' } })).map(e => e.stockName)

    /*  let startDate = new Date()
     startDate.setHours(5, 0, 0, 0)
     let startTime = startDate.getTime()
     startTime = startTime - 86400000 */

    let stocks: string[] = ['INTC']
    let startTime = 1262304000000;


    for (let i = 0; i < stocks.length; i++) {
        let insertData: DbStockBasicHistory[] = []
        let stockData = await getHistoryStockData(stocks[i], startTime)
        console.log(stockData)

        for (let j = 0; j < stockData.candles.length; j++) {
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
        await dbStockBasicHistoryRepo.insert(insertData)
    }





}