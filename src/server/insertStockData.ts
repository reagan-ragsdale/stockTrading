

import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';
import { dbOrdersRepo } from "../shared/tasks/dbOrders.js";
import { LoggerController } from "../shared/controllers/LoggerController.js";
import { DayTradeValues, stockDataInfo, StockInfo, tradeLogDto } from "../app/Dtos/TradingBotDtos.js";
import { simFinRepo } from "../shared/tasks/simFinance.js";


export const socketCall = async (): Promise<void> => {
    console.log('here in insert file')
    let startDate = new Date()
    startDate.setHours(5, 0, 0, 0)
    let startTime = startDate.getTime()
    let endingTime = startTime + 53990000

    //admin user to start websocket
    const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens

    let userFinance = await simFinRepo.findFirst({userId: 'Shared'})
    //get list of users signed up for the sma200
    //const userServerAlgos = await dbAlgorithmListRepo.find({ where: { sma200sma50: true } })
    //get all orders for each above user
    let userOrders = await dbOrdersRepo.find({ where: { userId: 'Shared' }, orderBy: { orderTime: 'desc' } })

    let stockInfoMap = new Map<string, StockInfo>()
    let listOfTradableStocks: string[] = ['AAPL', 'TSLA', 'MSFT', 'AMD', 'PLTR', 'XOM', 'NVO', 'NEE', 'NVDA']
    for (let i = 0; i < listOfTradableStocks.length; i++) {
        stockInfoMap.set(listOfTradableStocks[i], { canTrade: true, numberOfTrades: 0, stopLoss: 0, stopLossGainThreshold: 0, tradeHigh: 0 })
    }






    //set the values each stock will use in the algo
    let stockDayTradeValuesMap = new Map<string, DayTradeValues>()

    stockDayTradeValuesMap.set('TSLA', { Buy: .003, Sell: .002, Check200: .001, SmaLong: 3600, SmaMedium: 1800, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('AAPL', { Buy: .002, Sell: .002, Check200: .001, SmaLong: 3600, SmaMedium: 1200, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('MSFT', { Buy: .002, Sell: .001, Check200: .001, SmaLong: 4200, SmaMedium: 1800, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('AMD', { Buy: .002, Sell: .001, Check200: .001, SmaLong: 3600, SmaMedium: 1500, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('PLTR', { Buy: .003, Sell: .002, Check200: .001, SmaLong: 3600, SmaMedium: 1500, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('XOM', { Buy: .002, Sell: .001, Check200: .001, SmaLong: 2500, SmaMedium: 1500, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('NVO', { Buy: .002, Sell: .001, Check200: .001, SmaLong: 2400, SmaMedium: 1500, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('NEE', { Buy: .002, Sell: .001, Check200: .001, SmaLong: 2600, SmaMedium: 1500, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })
    stockDayTradeValuesMap.set('NVDA', { Buy: .003, Sell: .001, Check200: .001, SmaLong: 3600, SmaMedium: 1800, SmaShort: 300, SmaShortSell: 120, SmaShortMinuteBuy: 60 })


    //create information to be used for each stock, the price history, the long, medium and short moving average, number of trades, if the stock can trage, and the last prices
    let stockDataMap = new Map<string, stockDataInfo>()
    stockDataMap.set('AAPL', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('MSFT', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('PLTR', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('AMD', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('TSLA', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('XOM', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('NVO', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('NEE', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockDataMap.set('NVDA', { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, last300Sellsma: 0, last60Buysma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })

    //intitalize websocket
    const schwabWebsocket = new WebSocket(userData.streamerSocketUrl)
    let hasBeenSent = false
    //used to authenticate the websocket
    const loginMsg = {
        "requests": [
            {
                "service": "ADMIN",
                "requestid": "0",
                "command": "LOGIN",
                "SchwabClientCustomerId": userData.schwabClientCustomerId,
                "SchwabClientCorrelId": userData.schwabClientCorrelId,
                "parameters": {
                    "Authorization": userData.accessToken,
                    "SchwabClientChannel": userData.schwabClientChannel,
                    "SchwabClientFunctionId": userData.schwabClientFunctionId
                }
            }
        ]
    }
    //the message telling the websocket what stocks and info we want to subscribe to
    const socketSendMsg = {
        "requests": [
            {
                "service": "LEVELONE_EQUITIES",
                "requestid": "1",
                "command": "SUBS",
                "SchwabClientCustomerId": userData.schwabClientCustomerId,
                "SchwabClientCorrelId": userData.schwabClientCorrelId,
                "parameters": {
                    "keys": "AAPL, MSFT, PLTR, AMD, TSLA, XOM,NVO, NEE, NVDA",
                    "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
                }
            }
        ]
    }
    //the function that gets called once the web socket gets opened, send the login message
    schwabWebsocket.on('open', () => {
        schwabWebsocket.send(JSON.stringify(loginMsg))
    })
    //the function that gets called on each message the web socket sends back
    schwabWebsocket.on('message', async (event) => {
        let newEvent = JSON.parse(event.toString())


        //if the message is a response and it sends back that we were authenticated then send the sunbription info 
        if (Object.hasOwn(newEvent, 'response')) {
            if (newEvent.response[0].requestid == 0 && hasBeenSent == false) {
                console.log(newEvent.response[0])
                schwabWebsocket.send(JSON.stringify(socketSendMsg))
                hasBeenSent = true
            }
        }
        try {
            //if its a data response and meets the other criteria then we proceed with the data collection and the bot
            if (Object.hasOwn(newEvent, 'data') && hasBeenSent == true) {
                if (newEvent.data[0].service == 'LEVELONE_EQUITIES') {
                    let insertData: DbCurrentDayStockData[] = []
                    let orderPlaced = false;
                    //loop through each stock
                    for (let i = 0; i < newEvent.data[0].content.length; i++) {
                        //if the message contains either the bid, ask or last price then we want to proceed
                        if (Object.hasOwn(newEvent.data[0].content[i], '3')) {
                            let stockData = stockDataMap.get(newEvent.data[0].content[i].key)!
                            let stockDayTradeValues = stockDayTradeValuesMap.get(newEvent.data[0].content[i].key)!
                            let stockInfo = stockInfoMap.get(newEvent.data[0].content[i].key)!
                            let data: DbCurrentDayStockData = {
                                stockName: newEvent.data[0].content[i].key,
                                stockPrice: newEvent.data[0].content[i]['3'],
                                askPrice: Object.hasOwn(newEvent.data[0].content[i], '2') ? newEvent.data[0].content[i]['2'] : stockData.lastAsk,
                                bidPrice: Object.hasOwn(newEvent.data[0].content[i], '1') ? newEvent.data[0].content[i]['1'] : stockData.lastBid,
                                time: Number(newEvent.data[0].timestamp),
                                volume: newEvent.data[0].content[i]['8']
                            }

                            //push the data into what will be sent to the database 
                            insertData.push(data)

                            //update the history and last prices
                            stockData.history.push(data.stockPrice)
                            stockData.lastPrice = data.stockPrice
                            stockData.lastAsk = data.askPrice
                            stockData.lastBid = data.bidPrice
                            //if the length of the history is equal to what the long moving average length is then set the moving averages
                            if (stockData.history.length == stockDayTradeValues.SmaLong) {
                                stockData.last3600 = stockData.history.slice()
                                stockData.last3600sma = stockData.last3600.reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaLong
                                stockData.last1800sma = stockData.last3600.slice(stockDayTradeValues.SmaMedium * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaMedium
                                stockData.last300sma = stockData.last3600.slice(stockDayTradeValues.SmaShort * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaShort
                                stockData.last300Sellsma = stockData.last3600.slice(stockDayTradeValues.SmaShortSell * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaShortSell
                                stockData.last60Buysma = stockData.last3600.slice(stockDayTradeValues.SmaShortMinuteBuy * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaShortMinuteBuy
                            }
                            //else if its greater than then we do a revolving door first in first out and recalculate the moving averages
                            else if (stockData.history.length > stockDayTradeValues.SmaLong) {
                                stockData.last3600.shift()
                                stockData.last3600.push(data.stockPrice)
                                stockData.last3600sma = stockData.last3600.reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaLong
                                stockData.last1800sma = stockData.last3600.slice(stockDayTradeValues.SmaMedium * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaMedium
                                stockData.last300sma = stockData.last3600.slice(stockDayTradeValues.SmaShort * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaShort
                                stockData.last300Sellsma = stockData.last3600.slice(stockDayTradeValues.SmaShortSell * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaShortSell
                                stockData.last60Buysma = stockData.last3600.slice(stockDayTradeValues.SmaShortMinuteBuy * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues.SmaShortMinuteBuy
                            }
                            //find the users most recent order for the stock
                            let filteredOrderOnStock = userOrders.filter(e => e.stockName == data.stockName)
                            let isBuy = true;
                            if (filteredOrderOnStock.length > 0) {
                                isBuy = filteredOrderOnStock[0].orderType == 'Sell' ? true : false;
                            }
                            if (stockInfo.canTrade == false && (Date.now() - filteredOrderOnStock[0].orderTime > 1800000)) {
                                stockInfo.canTrade = true
                                let logMessage: tradeLogDto = {
                                    stockName: data.stockName,
                                    orderId: filteredOrderOnStock[0].orderId,
                                    shares: 0,
                                    dayTradeValues: structuredClone(stockDayTradeValues),
                                    stockInfo: structuredClone(stockInfo),
                                    stockDataInfo: structuredClone(stockData),
                                    logType: 'Stock out of cooldown period: ',
                                    time: data.time,

                                }
                                LoggerController.addToLog(logMessage)
                            }
                            if (isBuy && stockInfo.canTrade) {
                                //is buy and the algo is met
                                if ((((stockData.last300sma - stockData.last1800sma) / stockData.last1800sma) < (stockDayTradeValues.Buy * -1)) && (((stockData.last300sma - stockData.last3600sma) / stockData.last3600sma) < stockDayTradeValues.Check200) && (stockData.last60Buysma > stockData.last300sma) && (data.askPrice <= userFinance?.spending!)) {
                                    console.log('Placing a buy order for: ' + data.stockName + ' - ' + data.askPrice)
                                    let orderId = Math.floor(Math.random() * 10000000000)
                                    await dbOrdersRepo.insert({
                                        userId: 'Shared',
                                        stockName: data.stockName,
                                        orderType: 'Buy',
                                        stockPrice: data.askPrice,
                                        shareQty: 1,
                                        orderId: orderId,
                                        orderTime: data.time
                                    })
                                    stockInfo.stopLoss = data.askPrice - (data.askPrice * stockDayTradeValues.Buy)
                                    //have the threshold be half way between the buy and 1800
                                    stockInfo.stopLossGainThreshold = data.askPrice + (data.askPrice * .001)
                                    stockInfo.tradeHigh = data.askPrice
                                    //have the threshold and follow up be closer
                                    console.log('stop loss for: ' + data.stockName + ' - ' + stockInfo.stopLoss)
                                    stockInfo.numberOfTrades++
                                    orderPlaced = true;
                                    let newSpending = userFinance?.spending! - data.askPrice
                                    simFinRepo.update(userFinance?.id!, {...userFinance, spending: newSpending})
                                    userFinance = await simFinRepo.findFirst({userId: 'Shared'})
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: orderId,
                                        shares:1,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Buy: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                    
                                }
                            }
                            else if (!isBuy && stockInfo.canTrade) {
                                if (stockInfo.stopLoss == 0) {
                                    stockInfo.stopLoss = filteredOrderOnStock[0].stockPrice - (filteredOrderOnStock[0].stockPrice * stockDayTradeValues.Buy)
                                }
                                if (stockInfo.stopLossGainThreshold == 0) {
                                    stockInfo.stopLossGainThreshold = filteredOrderOnStock[0].stockPrice * stockDayTradeValues.Buy
                                }
                                //the algo is met
                                if ((((stockData.last300Sellsma - stockData.last1800sma) / stockData.last1800sma) > stockDayTradeValues.Sell) && data.bidPrice > filteredOrderOnStock[0].stockPrice) {
                                    console.log('Placing a sell order for: ' + data.stockName + ' - ' + data.bidPrice)
                                    await dbOrdersRepo.insert({
                                        userId: 'Shared',
                                        stockName: data.stockName,
                                        orderType: 'Sell',
                                        stockPrice: data.bidPrice,
                                        shareQty: filteredOrderOnStock[0].shareQty,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        orderTime: data.time
                                    })
                                    stockInfo.numberOfTrades++
                                    orderPlaced = true;
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        shares: 1,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Sell: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                }
                                //price is less than stop loss
                                else if (data.bidPrice <= stockInfo.stopLoss) {
                                    console.log([data.stockName, stockInfo.stopLoss])
                                    console.log('Placing a stop loss sell order for: ' + data.stockName + ' - ' + data.bidPrice)
                                    await dbOrdersRepo.insert({
                                        userId: 'Shared',
                                        stockName: data.stockName,
                                        orderType: 'Sell',
                                        stockPrice: data.bidPrice,
                                        shareQty: filteredOrderOnStock[0].shareQty,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        orderTime: data.time
                                    })
                                    stockInfo.numberOfTrades++
                                    orderPlaced = true;
                                    //if (data.bidPrice < filteredOrderOnStock[0].stockPrice) {
                                        stockInfo.canTrade = false
                                    //}
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        shares: 1,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Stop Loss Sell: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                }
                                //if sell and not algo and price is above threshold and stop loss is below buy
                                else if (data.bidPrice >= stockInfo.stopLossGainThreshold && stockInfo.stopLoss < filteredOrderOnStock[0].stockPrice) {
                                    stockInfo.stopLoss = filteredOrderOnStock[0].stockPrice
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        shares: 0,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Moved Stop Loss to Buy Price: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                }
                                //if sell and not algo and price is above threshold and stop loss is above buy
                                else if (data.bidPrice > stockInfo.tradeHigh && data.bidPrice >= stockInfo.stopLossGainThreshold && stockInfo.stopLoss >= filteredOrderOnStock[0].stockPrice) {
                                    stockInfo.stopLoss += data.bidPrice - stockInfo.tradeHigh
                                    if (data.stockName == 'TSLA') {
                                        console.log(data.stockName + ' new stop loss: ' + stockInfo.stopLoss)
                                    }
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        shares: 0,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Increased Stop Loss: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                }
                                //sell and the end of day
                                else if (data.time > endingTime) {
                                    console.log('Placing final day sell order for: ' + data.stockName + ' - ' + data.bidPrice)
                                    await dbOrdersRepo.insert({
                                        userId: 'Shared',
                                        stockName: data.stockName,
                                        orderType: 'Sell',
                                        stockPrice: data.bidPrice,
                                        shareQty: filteredOrderOnStock[0].shareQty,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        orderTime: data.time
                                    })
                                    stockInfo.numberOfTrades++
                                    stockInfo.canTrade = false
                                    orderPlaced = true;
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        shares: 1,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Final Day Sell: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                }
                                //sell and begining of day and stock is greater than previous day buy price
                                else if (stockInfo.numberOfTrades == 0 && data.bidPrice > filteredOrderOnStock[0].stockPrice) {
                                    console.log('Placing pre algo sell order for: ' + data.stockName + ' - ' + data.bidPrice)
                                    await dbOrdersRepo.insert({
                                        userId: 'Shared',
                                        stockName: data.stockName,
                                        orderType: 'Sell',
                                        stockPrice: data.bidPrice,
                                        shareQty: filteredOrderOnStock[0].shareQty,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        orderTime: data.time
                                    })
                                    stockInfo.numberOfTrades++
                                    orderPlaced = true;
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        shares: 1,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Pre Algo Sell: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                }
                                if (data.bidPrice > stockInfo.tradeHigh) {
                                    stockInfo.tradeHigh = data.bidPrice
                                    let logMessage: tradeLogDto = {
                                        stockName: data.stockName,
                                        orderId: filteredOrderOnStock[0].orderId,
                                        shares: 0,
                                        dayTradeValues: structuredClone(stockDayTradeValues),
                                        stockInfo: structuredClone(stockInfo),
                                        stockDataInfo: structuredClone(stockData),
                                        logType: 'Updated Trade High: ',
                                        time: data.time,

                                    }
                                    LoggerController.addToLog(logMessage)
                                }
                            }






                        }
                    }
                    //insert all stocks data into the db
                    await dbCurrentDayStockDataRepo.insert(insertData)
                    //update the orders if there was an order placed
                    if (orderPlaced) {
                        userOrders = await dbOrdersRepo.find({ where: { userId: 'Shared' }, orderBy: { orderTime: 'desc' } })
                    }

                }
            }
        }
        catch (error: any) {
            console.log('insertStockData server call: ' + error.message)
        }

    });

    //close the websocket at the end of the day
    setTimeout(() => {
        schwabWebsocket.close()
    }, 23400000);









}
