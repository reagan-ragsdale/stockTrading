import { buySellDto } from "../Dtos/buySellDto";
import { StockAnalysisDto } from "../Dtos/stockAnalysisDto";

export class AnalysisService{
    static checkIsLowBuyIsHighSell(stock: StockAnalysisDto): buySellDto{
        //the incoming stock will have the name and an array of numbers that are all the datapoints throughout the day

        //initialize what were going to return
        let returnSend: buySellDto = {
            shouldExecuteOrder: false
        }

        //find the trend line
        let dataPointTotal = 0
        let xAxisTotal = 0
        for(let i = 0; i < stock.history.length; i++){
            dataPointTotal+= stock.history[i]
            xAxisTotal+= i
        }
        let averageOfDataPoints = dataPointTotal/stock.history.length
        let xAxisAverage = xAxisTotal/stock.history.length

        let numerator = 0
        let denominator = 0

        for(let i = 0; i < stock.history.length; i++){
            numerator += ((stock.history[i] - averageOfDataPoints)*(i - xAxisAverage)) 
            denominator += ((stock.history[i] - averageOfDataPoints)*(stock.history[i] - averageOfDataPoints))
        }
        let trend = numerator/denominator

        //if trend is arbitrary positive number then it could be an indicator of wanting to trade
        if(trend > 1.25){
            //figure out where it currently is in the up and down in both the entire day as well as locally

            // find the slope of where the most recent point was (y2 - y1)/(x2 - x1)
            let currentPositionDailyTrend = ((stock.history.length - 1) - 1) / (stock.history[stock.history.length - 1] - stock.history[0])
        }
        else{
            returnSend = {
                shouldExecuteOrder: false
            }
        }

        return returnSend
    }
}