import { buySellDto } from "../Dtos/buySellDto";
import { StockAnalysisDto } from "../Dtos/stockAnalysisDto";
import { stockOrder } from "../Dtos/stockOrder";

export class AnalysisService {
    static checkIsLowBuyIsHighSell(stock: number[], orderHistory: stockOrder[], currentStopLoss: number, initialAverage: number, currentTradeHigh: number, multiplyFactor: number, stopLossLag: number): buySellDto {
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
        /* let totalOfSqaredDeviations = 0
        for (let i = 0; i < lastGroup.length; i++) {
            totalOfSqaredDeviations += Math.pow((lastGroup[i] - average), 2)
        }
        let standardDeviation = Math.sqrt((totalOfSqaredDeviations / (lastGroup.length - 1)))
 */

        //if the current price is an outlier return false
        /* if (Math.abs(((incomingPrice - average) / standardDeviation)) > 3) {
            return {
                shouldExecuteOrder: false
            }

        } */


        //filter out anything with a zscore outside Math.abs(-3)
        /*  let filteredGroup: number[] = []
         for (let i = 0; i < lastGroup.length; i++) {
             let zscore = ((lastGroup[i] - average) / standardDeviation)
             if (Math.abs(zscore) < 3) {
                 filteredGroup.push(lastGroup[i])
             }
         } */



        //get high and low and new avg
        let recentHigh = Math.max(...lastGroup)
        let recentLow = Math.min(...lastGroup)

        total = 0
        for (let i = 0; i < lastGroup.length; i++) {
            total += lastGroup[i]
        }
        let newAverage = total / lastGroup.length


        //want to define gutters on each high and low that if the price is in that gutter then execute the order
        // EX: if the high is 234.9 and the low is 233.2 then set a gutter around .3 
        // so if it gets to 233.5 then buy and if it gets to 234.6 then sell

        //how to establish a gutter
        //for now picked arbitrary .3 off the difference between the average and the high and low
        let gutter = 0

        //possibly also add a trend indicator and adjust the multiplyFactor based on if its going up and were trying to sell or going up and trying to buy etc
        //let multiplyFactor = 0.45

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
                    stopLossPrice: recentLow - stopLossLag,
                    initialAverage: newAverage,
                    tradeHigh: incomingPrice,
                    containsTrendInfo: false
                }
            }
            else {
                return {
                    shouldExecuteOrder: false,
                    targetPrice: (recentLow + gutter),
                    containsTrendInfo: false
                }
            }
        }
        else {
            gutter = Math.abs(newAverage - recentHigh) * multiplyFactor
            console.log('greater than: ' + (recentHigh - gutter))
            if (((incomingPrice > (recentHigh - gutter)) && (incomingPrice > lastOrderPrice))) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Sell',
                    containsTrendInfo: false
                }
            }
            else if (incomingPrice <= currentStopLoss) {
                if (currentStopLoss > orderHistory[0].stockPrice) {
                    return {
                        shouldExecuteOrder: true,
                        isBuyOrSell: 'Sell',
                        soldAtStopLoss: false,
                        containsTrendInfo: false
                    }
                }
                else {
                    return {
                        shouldExecuteOrder: true,
                        isBuyOrSell: 'Sell',
                        soldAtStopLoss: true,
                        containsTrendInfo: false
                    }
                }

            }
            else {
                let newStopLoss = currentStopLoss
                let newHigh = currentTradeHigh
                if(incomingPrice > currentTradeHigh){
                    newHigh = incomingPrice
                }
                if(incomingPrice > lastOrderPrice + stopLossLag){
                    if(currentStopLoss < lastOrderPrice){
                        newStopLoss = lastOrderPrice
                    }
                    else{
                        if(incomingPrice > currentTradeHigh){
                            newStopLoss = incomingPrice - stopLossLag
                        }
                    }
                }
                return{
                    shouldExecuteOrder: false,
                    stopLossPrice: newStopLoss,
                    tradeHigh: newHigh,
                    containsTrendInfo: false,
                }
            }
        }
    }


    static trendTrading(stock: number[], orderHistory: stockOrder[], currentStopLoss: number, currentTradeHigh: number, initialAverage: number, gutterFactor: number, stopLossLag: number): buySellDto {


        let nextOrderType = 'Buy'
        let lastOrderPrice = 0
        if (orderHistory.length > 0) {
            lastOrderPrice = orderHistory[0].stockPrice
            if (orderHistory[0].orderType == 'Buy') {
                nextOrderType = 'Sell'
            }
        }
        let time: number[] = []
        for (let i = 1; i < stock.length; i++) {
            time.push(i)
        }

        const n = stock.length;
        const sumX = time.reduce((a, b) => a + b, 0);
        const sumY = stock.reduce((a, b) => a + b, 0);
        const sumXY = time.map((xi, i) => xi * stock[i]).reduce((a, b) => a + b, 0);
        const sumX2 = time.map(xi => xi ** 2).reduce((a, b) => a + b, 0);

        // Compute slope (m) and intercept (b)
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
        const intercept = (sumY - slope * sumX) / n;



        // Get trendline start and end points
        const xMin = Math.min(...time);
        const xMax = Math.max(...time);
        const yMin = slope * xMin + intercept;
        const yMax = slope * xMax + intercept;

        //get the buffer zones to buy and sell between

        // Find the point furthest from the trendline
        let maxDistance = -Infinity;
        let minDistance = Infinity;
        let highestPoint = null
        let lowestPoint = null

        //need to put them into an object and also find the highest and lowest
        for (let i = 0; i < stock.length; i++) {
            let distance = (slope * i - stock[i] + intercept) / Math.sqrt(slope * slope + 1);
            if (distance > maxDistance) {
                maxDistance = distance;
                lowestPoint = { x: i, y: stock[i] };
            }
            if (distance < minDistance) {
                minDistance = distance
                highestPoint = { x: i, y: stock[i] };
            }
        }

        //figure out how much above and below the trend line the highest and lowest points are
        //y = mx + b
        //we have y, m,x need to find b
        let highTrendY = (slope * highestPoint!.x) + intercept
        let differenceHigh = highestPoint!.y - highTrendY

        let lowTrendY = (slope * lowestPoint!.x) + intercept
        let differenceLow = lowTrendY - lowestPoint!.y
        const interceptAbove = intercept + differenceHigh
        const aboveyMin = slope * xMin + interceptAbove;
        const aboveyMax = slope * xMax + interceptAbove;

        const interceptBelow = intercept - differenceLow
        const belowyMin = slope * xMin + interceptBelow;
        const belowyMax = slope * xMax + interceptBelow;


        

        const gutterAboveIntercept = interceptAbove - Math.abs(differenceHigh * gutterFactor)
        const gutterBelowIntercept = interceptBelow + Math.abs(differenceLow * gutterFactor)

        const gutterLineAboveMin = slope * xMin + gutterAboveIntercept
        const gutterLineAboveMax = slope * xMax + gutterAboveIntercept

        const gutterLineBelowMin = slope * xMin + gutterBelowIntercept
        const gutterLineBelowMax = slope * xMax + gutterBelowIntercept


        let incomingPoint = stock[stock.length - 1]

        let shouldPlaceTrade = false;

        if (nextOrderType == 'Buy') {
            if (incomingPoint <= gutterLineBelowMax) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Buy',
                    stopLossPrice: belowyMax - stopLossLag,
                    initialAverage: yMax,
                    tradeHigh: incomingPoint,
                    containsTrendInfo: false
                }
            }
            else {
                return {
                    shouldExecuteOrder: false,
                    targetPrice: gutterLineBelowMax,
                    containsTrendInfo: true,
                    xMin: xMin,
                    xMax: xMax,
                    yMin: yMin,
                    yMax: yMax,
                    aboveyMin: aboveyMin,
                    aboveyMax: aboveyMax,
                    belowyMin: belowyMin,
                    belowyMax: belowyMax,
                    gutterLineAboveMin: gutterLineAboveMin,
                    gutterLineAboveMax: gutterLineAboveMax,
                    gutterLineBelowMin: gutterLineBelowMin,
                    gutterLineBelowMax: gutterLineBelowMax,

                }
            }
        }
        // else sell
        else {
            if (incomingPoint >= gutterLineAboveMax) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Sell',
                    containsTrendInfo: false,
                }
            }
            else if (incomingPoint <= currentStopLoss) {
                return {
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Sell',
                    soldAtStopLoss: true,
                    containsTrendInfo: false
                }
            }
            else {
                //if its not at target or stop loss
                let newStopLoss = 0;
                let newHigh = 0;
                //set new high
                if(incomingPoint > currentTradeHigh){
                    newHigh = incomingPoint
                }
                else{
                    newHigh = currentTradeHigh
                }
                if(incomingPoint >= initialAverage){
                    if(currentStopLoss >= orderHistory[0].stockPrice){
                        if(incomingPoint > currentTradeHigh){
                            newStopLoss = currentStopLoss
                            newStopLoss = incomingPoint - stopLossLag
                        }
                        else{
                            newStopLoss = currentStopLoss
                            newHigh = currentTradeHigh
                        }
                    }
                    else{
                        newStopLoss = orderHistory[0].stockPrice
                    }
                    
                }
                else{
                    newStopLoss = currentStopLoss
                }
                return {
                    shouldExecuteOrder: false,
                    targetPrice: gutterLineAboveMax,
                    stopLossPrice: newStopLoss,
                    tradeHigh: newHigh,
                    containsTrendInfo: true,
                    xMin: xMin,
                    xMax: xMax,
                    yMin: yMin,
                    yMax: yMax,
                    aboveyMin: aboveyMin,
                    aboveyMax: aboveyMax,
                    belowyMin: belowyMin,
                    belowyMax: belowyMax,
                    gutterLineAboveMin: gutterLineAboveMin,
                    gutterLineAboveMax: gutterLineAboveMax,
                    gutterLineBelowMin: gutterLineBelowMin,
                    gutterLineBelowMax: gutterLineBelowMax,
                }
            }
        }


        /* return{
            
            shouldPlaceTrade: shouldPlaceTrade,
            orderType: nextOrderType
        } */
        return { shouldExecuteOrder: false }

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
    static followUp(stock: number, orderHistory: stockOrder[], currentStopLoss: number, currentTradeHigh: number, initialPrice: number, stopLossAdjustment: number): buySellDto {
        let nextOrderType = 'Buy'
        let lastOrderPrice = 0
        if (orderHistory.length > 0) {
            lastOrderPrice = orderHistory[0].stockPrice
            if (orderHistory[0].orderType == 'Buy') {
                nextOrderType = 'Sell'
            }
        }

        

        if(nextOrderType == 'Buy'){
            return{
                shouldExecuteOrder: true,
                isBuyOrSell: 'Buy',
                stopLossPrice: currentStopLoss,
                initialAverage: stock,
                tradeHigh: stock,
                containsTrendInfo: false

            }
        }
        //sell
        else{
            if(stock <= currentStopLoss){
                return{
                    shouldExecuteOrder: true,
                    isBuyOrSell: 'Sell',
                    containsTrendInfo: false,
                    soldAtStopLoss: true,
                }
            }
            else{
                let newStopLoss = currentStopLoss
                let newHigh = currentTradeHigh
                if(stock > currentTradeHigh){
                    newHigh = stock
                }
                if(stock > initialPrice + stopLossAdjustment){
                    if(currentStopLoss < initialPrice){
                        newStopLoss = initialPrice
                    }
                    else{
                        if(stock > currentTradeHigh){
                            newStopLoss = stock - stopLossAdjustment
                        }
                    }
                }
                return{
                    shouldExecuteOrder: false,
                    stopLossPrice: newStopLoss,
                    tradeHigh: newHigh,
                    containsTrendInfo: false,
                }
            }
            
        }
    }

    static autoFollowUpBot(data: StockAnalysisDto, orderHistory: stockOrder[]): buySellDto{
        return { 
            shouldExecuteOrder: false,
            isBuyOrSell: 'Buy'
        }
    }
}