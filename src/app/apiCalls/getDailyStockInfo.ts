import { getHistoryStockData } from "../../server/getHistoryStockData"
import { DbStockBasicHistory } from "../../shared/tasks/dbStockBasicHistory"
import { dbStockHistoryDataRepo } from "../../shared/tasks/dbStockHistoryData"

export const getDailyStockInfo = async () => {
    //load daily basic stock data
    //then in the algo file check to see if the price is near the variaance in 

    let stocks = (await dbStockHistoryDataRepo.groupBy({ group: ['stockName'], orderBy: { stockName: 'desc' } })).map(e => e.stockName)
    let startDate = 1710800763000
    
    let insertData: DbStockBasicHistory[] = [] 
    for(let i = 0; i < stocks.length; i++){
        let stockData = await getHistoryStockData(stocks[i], startDate)
        if(stockData.length > 0){
            console.log(stockData)
           /*  for(let j = 0; j < stockData.length; j++){
                insertData.push({})
            } */
        }
    }
    


    
}