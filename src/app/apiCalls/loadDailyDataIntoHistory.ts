import { StockHistoryController } from "../../shared/controllers/StockHistoryController"
import { dbCurrentDayStockDataRepo } from "../../shared/tasks/dbCurrentDayStockData"
import { DbStockHistoryData } from "../../shared/tasks/dbStockHistoryData"
import { reusedFunctions } from "../services/reusedFunctions"


export const loadDailyDataIntoHistory = async () => {
    let currentDate = new Date()
    let formattedDate = reusedFunctions.formatDate(currentDate)
    let dailyStockData = await dbCurrentDayStockDataRepo.find()
    let stockData: DbStockHistoryData[] = []
    for(let i = 0; i < dailyStockData.length; i++){
        stockData.push({
            stockName: dailyStockData[i].stockName,
            stockPrice: dailyStockData[i].stockPrice,
            time: dailyStockData[i].time,
            date: formattedDate
        })
    }
    await StockHistoryController.insertDailyHistory(stockData)
    
}