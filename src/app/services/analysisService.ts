import { last } from "rxjs";
import { buySellDto } from "../Dtos/buySellDto";
import { StockAnalysisDto } from "../Dtos/stockAnalysisDto";
import { stockOrder } from "../Dtos/stockOrder";

export class AnalysisService {
    static checkIsLowBuyIsHighSell(stock: number[], orderHistory: stockOrder[]): buySellDto {

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
        let incomingPrice = stock[stock.length - 1]
        //arbitrarily get the last 400 points of data to set our bounds
        let lastGroup = stock.slice(0, -2)


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
        for (let i = 0; i < lastGroup.length; i++) {
            totalOfSqaredDeviations += Math.pow((lastGroup[i] - average), 2)
        }
        let standardDeviation = Math.sqrt((totalOfSqaredDeviations / (lastGroup.length - 1)))


        //if the current price is an outlier return false
        if (Math.abs(((incomingPrice - average) / standardDeviation)) > 3) {
            return {
                shouldExecuteOrder: false
            }

        }


        //filter out anything with a zscore outside Math.abs(-3)
        let filteredGroup: number[] = []
        for (let i = 0; i < lastGroup.length; i++) {
            let zscore = ((lastGroup[i] - average) / standardDeviation)
            if (Math.abs(zscore) < 3) {
                filteredGroup.push(lastGroup[i])
            }
        }



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

        //possibly also add a trend indicator and adjust the multiplyFactor based on if its going up and were trying to sell or going up and trying to buy etc
        let multiplyFactor = 0.35

        if (nextOrderType == 'Buy') {
            gutter = Math.abs(newAverage - recentLow) * multiplyFactor
            console.log('Less than: ' + (recentLow + gutter))
            if ((incomingPrice < (recentLow + gutter))) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Buy'
                }
            }
            else {
                return {
                    shouldExecuteOrder: false,
                    targetPrice: (recentLow + gutter)
                }
            }
        }
        else {
            gutter = Math.abs(newAverage - recentHigh) * multiplyFactor
            console.log('greater than: ' + (recentHigh - gutter))
            if ((incomingPrice > (recentHigh - gutter)) && incomingPrice > lastOrderPrice) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Sell'
                }
            }
            else {
                return {
                    shouldExecuteOrder: false,
                    targetPrice: (recentHigh - gutter)
                }
            }
        }
    }


    static trendTrading(stock: number[], orderHistory: stockOrder[],): buySellDto {


        let nextOrderType = 'Buy'
        let lastOrderPrice = 0
        if (orderHistory.length > 0) {
            lastOrderPrice = orderHistory[0].stockPrice
            if (orderHistory[0].orderType == 'Buy') {
                nextOrderType = 'Sell'
            }
        }

        //find the trend line
        let dataPointTotal = 0
        let xAxisTotal = 0
        for (let i = 0; i < stock.length; i++) {
            dataPointTotal += stock[i]
            xAxisTotal += i
        }
        let averageOfDataPoints = dataPointTotal / stock.length
        let xAxisAverage = xAxisTotal / stock.length


        let numerator = 0
        let denominator = 0

        for (let i = 0; i < stock.length; i++) {
            numerator += ((stock[i] - averageOfDataPoints) * (i - xAxisAverage))
            denominator += ((stock[i] - averageOfDataPoints) * (stock[i] - averageOfDataPoints))
        }
        let trend = numerator / denominator
        
        let trendDirection = trend > 0 ? 'Positive' : 'Negative'

        //if trend is arbitrary positive number then it could be an indicator of wanting to trade
        //taking the absolute value because it might be a negative trend and do the same thing
        
            //for now just use the global trend and establish a bound you want to stay within until you want to break your trade.
            //then compare the last 200 and 50 data points to see wheter they're still within those bounds
            //if so then return no trade, else return trade


            //lolcal 100 trend
            let local100 = stock.slice(-100)
            dataPointTotal = 0
            xAxisTotal = 0
            for (let i = 0; i < local100.length; i++) {
                dataPointTotal += local100[i]
                xAxisTotal += i
            }
            averageOfDataPoints = dataPointTotal / local100.length
            xAxisAverage = xAxisTotal / local100.length


            numerator = 0
            denominator = 0

            for (let i = 0; i < local100.length; i++) {
                numerator += ((local100[i] - averageOfDataPoints) * (i - xAxisAverage))
                denominator += ((local100[i] - averageOfDataPoints) * (local100[i] - averageOfDataPoints))
            }
            let local100Trend = numerator / denominator


            //local 50 trend
            /* let local50 = stock.slice(-50)
            dataPointTotal = 0
            xAxisTotal = 0
            for (let i = 0; i < local50.length; i++) {
                dataPointTotal += local50[i]
                xAxisTotal += i
            }
            averageOfDataPoints = dataPointTotal / local50.length
            xAxisAverage = xAxisTotal / local50.length


            numerator = 0
            denominator = 0

            for (let i = 0; i < local50.length; i++) {
                numerator += ((local50[i] - averageOfDataPoints) * (i - xAxisAverage))
                denominator += ((local50[i] - averageOfDataPoints) * (local50[i] - averageOfDataPoints))
            }
            let local50Trend = numerator / denominator */


            //set arbitrary bound to stay within the global trend
            let bound = 0.8
            //if global trend is 1.25 and the local trend is within (1.25 * .8) = 1 then keep 
            // but if it dips below that line then trade it

            if(trendDirection == 'Positive'){
                if (nextOrderType == 'Buy') {
                    if ((local100Trend > (trend - (trend * bound)))) {
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
                    if ((local100Trend > (trend - (trend * bound)))) {
                        return {
                            shouldExecuteOrder: false
                        }
                    }
                    else {
                        return {
                            shouldExecuteOrder: true,
                            isBuyOrSell: 'Sell'
                        }
                    }
                }
            }
            else{
                if (nextOrderType == 'Buy') {
                    if ((local100Trend < (trend - (trend * bound)))) {
                        return {
                            shouldExecuteOrder: false
                        }
                    }
                    else {
                        return {
                            shouldExecuteOrder: true,
                            isBuyOrSell: 'Buy'
                        }
                    }
                }
                else {
                    //do not sell on a downward trend
                    return {
                        shouldExecuteOrder: false
                    }
                }
            }
            // if this trend is within a certain tolerance of the overall trend then execute the trade
            //or just have it not trade yet and hold on
    }
}