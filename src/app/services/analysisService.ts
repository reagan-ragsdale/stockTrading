import { last, max } from "rxjs";
import { buySellDto } from "../Dtos/buySellDto";
import { StockAnalysisDto } from "../Dtos/stockAnalysisDto";
import { stockOrder } from "../Dtos/stockOrder";
import { reusedFunctions } from "./reusedFunctions";

export class AnalysisService {
    static checkIsLowBuyIsHighSell(stock: number[], orderHistory: stockOrder[], currentStopLoss: number, initialAverage: number, currentTradeHigh: number): buySellDto {
        //currently only taking in the past 400 ticks, would like to find a way to have the entire days ticks to be searched through


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
        let multiplyFactor = 0.45

        //need to also add a stop loss to set as a saftey net for if a price dips below a certain proint
        //Almost always when you see someone day trading, they'll set a target price which is above where they bought
        //and a stop loss at some point slightly below where they bought to provide an automatic sell safety net
        //I want to also add this to the algo along side of the target price
        //one thing I think could be an improvement to this is that when they set their target price, it initially gets set
        //below where they initially bought and then never touched again for the rest of the trade
        //so if they bought at 100 and set a target at 110 and stop loss at 98
        //then the price could go up to 108 and come all the way back down to 98 and sell for a loss
        //my plan is to have the stop loss be adjusted by the bot to be able to rise above the initial mark
        //so that in the scenario above, it could have risen up at a certain paddin of the price 
        //so when the price reached its peak of 108, the stop loss couldve moved up to 106
        //and sold when it finally dipped to 106 instead of 98

        //set initial stop loss after a buy
        //stop loss should be what the previous low was
        // most likely the overall low of the dataset but overall algo will need to change because only looks at 400

        //stop loss only changes when the price has gone above the initaial buy price by a certain point.
        //the price might initially jump above then dip back down a bit then go up to target
        //so having it go to right above the buy price as soon as it jumps above might not work
        //instead we want to add a padding to trail the price by. 
        //price has to initially get to a certain point above buy price
        //initial arbitrary price of the average of the dataset when the trade was placed
        //once the price breaks over the average, then set initially arbitraily stop loss to sligtly above the initial buy
        // and follow one for one and only change when the price reaches a new high
        //once the stop loss is set above the buy then it cant go back down it can only go up


        if (nextOrderType == 'Buy') {
            gutter = Math.abs(newAverage - recentLow) * multiplyFactor
            console.log('Less than: ' + (recentLow + gutter))
            if ((incomingPrice < (recentLow + gutter))) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Buy',
                    stopLossPrice: recentLow - gutter,
                    initialAverage: newAverage,
                    tradeHigh: incomingPrice
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
            if (((incomingPrice > (recentHigh - gutter)) && (incomingPrice > lastOrderPrice))) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Sell'
                }
            }
            else if(incomingPrice <= currentStopLoss){
                if(currentStopLoss > orderHistory[0].stockPrice){
                    return {
                        shouldExecuteOrder: true,
                        isBuyOrSell: 'Sell',
                        soldAtStopLoss: false
                    }
                }
                else{
                    return {
                        shouldExecuteOrder: true,
                        isBuyOrSell: 'Sell',
                        soldAtStopLoss: true
                    }
                }
                
            }
            else {
                let newStopLoss = 0
                let newHigh = 0

                //if the price has not gotten to the average yet
                if (currentStopLoss < orderHistory[0].stockPrice) {
                    //check to see if price is at average
                    if (incomingPrice >= initialAverage) {
                        //set new stop loss
                        newStopLoss = ((initialAverage - orderHistory[0].stockPrice) * .3) + orderHistory[0].stockPrice
                    }
                    else {
                        //keep stop loss
                        newStopLoss = currentStopLoss
                    }
                    if (incomingPrice > currentTradeHigh) {
                        newHigh = incomingPrice
                    }
                }
                //if there is a new stop loss
                else {
                    if (incomingPrice > currentTradeHigh) {
                        newStopLoss += (incomingPrice - currentTradeHigh)
                        newHigh = incomingPrice
                    }
                    else {
                        newStopLoss = currentStopLoss
                        newHigh = currentTradeHigh
                    }
                }
                return {
                    shouldExecuteOrder: false,
                    targetPrice: (recentHigh - gutter),
                    stopLossPrice: newStopLoss,
                    tradeHigh: newHigh
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


        //edit 1: need to tweak it for when it just recently bought an uptrend and then it breaks trend quickly but the past 100 have not show that break yet
        // somehow need to compare the past 25, 50,100 etc so get a better picture of how it trending

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

        if (trendDirection == 'Positive') {
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
        else {
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
        //note: what to do if it was a down trend and it broke so the bot bought 
        //might need a function to automatically switch between algorithms. Once the above scenario happens then 
        //switch to an algo that just tries to get the sell to a certain point
        //or if theres an up trend just follow it up until it breaks
    }

    static predicitveTrendLine(stock: StockAnalysisDto, orderHistory: stockOrder[]) {

        //what was the last order
        let nextOrderType = 'Buy'
        let lastOrderPrice = 0
        if (orderHistory.length > 0) {
            lastOrderPrice = orderHistory[0].stockPrice
            if (orderHistory[0].orderType == 'Buy') {
                nextOrderType = 'Sell'
            }
        }

        //this needs to be an array of objects that contain the price and time
        let stockPrices = stock.history.slice(-3600)
        let stockTimes = stock.time.slice(-3600)

        let listOfPriceAndTime: any[] = []

        for (let i = 0; i < stockPrices.length; i++) {
            listOfPriceAndTime.push({
                price: stockPrices[i],
                time: stockTimes[i]
            })
        }


        //split the stockPrices into x amount of arrays
        let listOfArrays: any[] = []


        //figure out how to slice and deep copy from the array

        for (let i = 0; i < 6; i++) {
            let copiedArray = listOfPriceAndTime.slice(i * 600, (i + 1) * 600)
            let deepCopiedArray = copiedArray.map(e => JSON.parse(JSON.stringify(e)))
            listOfArrays.push(deepCopiedArray)
        }

        let listOfMaximas: any[] = []
        for (let i = 0; i < listOfArrays.length; i++) {
            //find the max in an array of objects
            const maxPriceItem = listOfArrays[i].reduce((maxItem: { price: number; }, currentItem: { price: number; }) => {
                return currentItem.price > maxItem.price ? currentItem : maxItem;
            }, listOfArrays[i][0]);
            listOfMaximas.push(maxPriceItem)
        }


        //trend calc
        let dataPointTotal = 0
        let xAxisTotal = 0
        for (let i = 0; i < listOfMaximas.length; i++) {
            dataPointTotal += listOfMaximas[i].price
            xAxisTotal += i
        }
        let averageOfDataPoints = dataPointTotal / listOfMaximas.length
        let xAxisAverage = xAxisTotal / listOfMaximas.length


        let numerator = 0
        let denominator = 0

        for (let i = 0; i < listOfMaximas.length; i++) {
            numerator += ((listOfMaximas[i].price - averageOfDataPoints) * (i - xAxisAverage))
            denominator += ((listOfMaximas[i].price - averageOfDataPoints) * (listOfMaximas[i].price - averageOfDataPoints))
        }
        let trend = numerator / denominator


        //need to find predicted
        //find on the trend line whee the x value meets the line and put in that y value
        let sumY = listOfMaximas.reduce((sum, point) => sum + point.time, 0);
        let sumX = listOfMaximas.reduce((sum, point) => sum + point.price, 0);
        let bVal = (sumY - trend * sumX) / listOfMaximas.length
        //y = xa + b
        //const b = (sumY - m * sumX) / N;

        let listOfExpectedMaxima: any[] = []
        for (let i = 0; i < listOfMaximas.length; i++) {
            let expectedVal = (listOfMaximas[i].time * trend) + bVal
            listOfExpectedMaxima.push({ price: expectedVal, time: listOfMaximas[i].time })
        }
        // y = 10(trend) + 
        //r2 calculation
        const meanActual = listOfMaximas.reduce((sum, val) => sum + val.price, 0) / listOfMaximas.length;
        const ssTot = listOfMaximas.reduce((sum, val) => sum + Math.pow(val.price - meanActual, 2), 0);
        const ssRes = listOfMaximas.reduce((sum, val, index) => sum + Math.pow(val.price - listOfExpectedMaxima[index].price, 2), 0);

        let val = 1 - (ssRes / ssTot);

        //determine how close to 1 each of these numbers are
        
        return val
        //find the outliers of the line
    }
    //how to find the local maximas and minimas
    //create trend lines
    //extrapolate trend lines to find meeting point

    //is at meeting point?
    //yes? is point above meeting point?
    //yes? is buy? yes? buy
}