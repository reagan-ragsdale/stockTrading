import { last } from "rxjs";
import { buySellDto } from "../Dtos/buySellDto";
import { StockAnalysisDto } from "../Dtos/stockAnalysisDto";
import { stockOrder } from "../Dtos/stockOrder";

export class AnalysisService {
    static checkIsLowBuyIsHighSell(stock: StockAnalysisDto, orderHistory: stockOrder[]): buySellDto {

        //find out if we're buying or selling based off previous orders or if none at all
        let nextOrderType = 'Buy'
        let lastOrderPrice = 0
        if (orderHistory.length > 0) {
            lastOrderPrice = orderHistory[0].stockPrice
            if (orderHistory[0].orderType == 'Buy') {
                nextOrderType = 'Sell'
            }
        }
        

        //grab the newest data that we'll be looking at
        let incomingPrice = stock.history[stock.history.length - 1]
        //arbitrarily get the last 400 points of data to set our bounds
        let lastGroup = stock.history.slice(-401, -2)


        //sometimes in the data there might be one second spikes that may fluctuate the stock quite a bit.
        //I don't think it's feasable to place an order that quickly so we'll need to filter out these outliers

        //filtering out the spikes using the z-score method

        //get the mean
        let total = 0
        for (let i = 0; i < lastGroup.length; i++) {
            total += lastGroup[i]
        }
        let average = total / lastGroup.length

        //find standard deviation
        let totalOfSqaredDeviations = 0
        for(let i = 0; i < lastGroup.length; i++){
            totalOfSqaredDeviations += Math.pow((lastGroup[i] - average), 2)
        }
        let standardDeviation = Math.sqrt((totalOfSqaredDeviations / (lastGroup.length - 1)))

        //filter out anything with a zscore outside Math.abs(-3)
        let filteredGroup: number[] = []
        for(let i = 0; i < lastGroup.length; i++){
            let zscore = ((lastGroup[i] - average) / standardDeviation)
            if(Math.abs(zscore) < 3){
                filteredGroup.push(lastGroup[i])
            }
        }

        //add if the current price is an outlier return false

        //get high and low and new avg
        let recentHigh = Math.max(...filteredGroup)
        let recentLow = Math.min(...filteredGroup)

        total = 0
        for (let i = 0; i < filteredGroup.length; i++) {
            total += filteredGroup[i]
        }
        let newAverage = total / filteredGroup.length


        //want to define gutters on each high and low that if the price is in that gutter then execute the order
        // EX: if the high is 234.9 and the low is 233.2 then set a gutter around .3 
        // so if it gets to 233.5 then buy and if it gets to 234.6 then sell

        //how to establish a gutter
        //for now picked arbitrary .3 off the difference between the average and the high and low
        let gutter = 0

        if (nextOrderType == 'Buy') {
            gutter = Math.abs(newAverage - recentLow) * .25
            console.log('Less than: ' + (recentLow + gutter))
            if ((incomingPrice < (recentLow + gutter)) && incomingPrice < lastOrderPrice) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Buy'
                }
            }
            else {
                return {
                    shouldExecuteOrder: false
                }
            }
        }
        else {
            gutter = Math.abs(newAverage - recentHigh) * .25
            console.log('greater than: ' + (recentHigh - gutter))
            if ((incomingPrice > (recentHigh - gutter)) && incomingPrice > lastOrderPrice) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Sell'
                }
            }
            else {
                return {
                    shouldExecuteOrder: false
                }
            }
        }
    }


    static otherHighLow() {
        //find the trend line
        /* let dataPointTotal = 0
        let xAxisTotal = 0
        for (let i = 0; i < stock.history.length; i++) {
            dataPointTotal += stock.history[i]
            xAxisTotal += i
        }
        let averageOfDataPoints = dataPointTotal / stock.history.length
        let xAxisAverage = xAxisTotal / stock.history.length

        let numerator = 0
        let denominator = 0

        for (let i = 0; i < stock.history.length; i++) {
            numerator += ((stock.history[i] - averageOfDataPoints) * (i - xAxisAverage))
            denominator += ((stock.history[i] - averageOfDataPoints) * (stock.history[i] - averageOfDataPoints))
        }
        let trend = numerator / denominator

        //if trend is arbitrary positive number then it could be an indicator of wanting to trade
        if (trend > 1.25) {
            //figure out where it currently is in the up and down in both the entire day as well as locally

            // find the slope of where the most recent point was (y2 - y1)/(x2 - x1)
            let currentDailyTrend = ((stock.history.length - 1) - 1) / (stock.history[stock.history.length - 1] - stock.history[0])

            //find the local trend arbitrary amount of time
            let currentLocalTrend = ((stock.history.length - 1) - stock.history.length - 50) / (stock.history[stock.history.length - 1] - stock.history[stock.history.length - 50])


        }
        else {
            returnSend = {
                shouldExecuteOrder: false
            }
        }

        return returnSend */
    }

}