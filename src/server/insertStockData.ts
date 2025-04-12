

import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';
import {  dbAlgorithmListRepo } from "../shared/tasks/dbAlgorithmList.js";
import { dbOrdersRepo } from "../shared/tasks/dbOrders.js";

export const socketCall = async (): Promise<void> => {
    console.log('here in insert file')
    let startDate = new Date()
    startDate.setHours(5, 0, 0, 0)
    let startTime = startDate.getTime()
    let endingTime = startTime + 28790000
    console.log(endingTime)

    //admin user to start websocket
    const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens
    //get list of users signed up for the sma200
    const userServerAlgos = await dbAlgorithmListRepo.find({ where: { sma200sma50: true } })
    //get all orders for each above user

    let userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos!.map(e => e.userId) }, orderBy: { orderTime: 'desc' } })


    /* const stockHistoryData = await dbStockBasicHistoryRepo.find({ orderBy: { date: 'desc' } })
    let stockSma: { [key: string]: { last200: number[], sma200: number } } = {}
    let listOfDistinctStocks = stockHistoryData.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    for (let i = 0; i < listOfDistinctStocks.length; i++) {
        let filteredStockData = stockHistoryData.filter(e => e.stockName == listOfDistinctStocks[i]).map(e => e.close).slice(0, 200)
        let sma200 = filteredStockData.reduce((sum, val) => sum + val, 0) / filteredStockData.length
        stockSma[listOfDistinctStocks[i]] = {
            last200: filteredStockData,
            sma200: sma200
        }
    } */
    let stockDayTradeValues: { [key: string]: { Buy: number, Sell: number, Check200: number, SmaLong: number, SmaMedium: number, SmaShort: number } } = {
        'TSLA': {
            Buy: .01,
            Sell: .013,
            Check200: .001,
            SmaLong: 5400,
            SmaMedium: 1200,
            SmaShort: 60
        },
        'AAPL': {
            Buy: .002,
            Sell: .008,
            Check200: .03,
            SmaLong: 3600,
            SmaMedium: 1200,
            SmaShort: 180
        },
        'MSFT': {
            Buy: .001,
            Sell: .004,
            Check200: .01,
            SmaLong: 5400,
            SmaMedium: 1200,
            SmaShort: 60
        },
        'AMD': {
            Buy: .001,
            Sell: .002,
            Check200: .10,
            SmaLong: 5400,
            SmaMedium: 1200,
            SmaShort: 60
        },
        'PLTR': {
            Buy: .001,
            Sell: .002,
            Check200: .01,
            SmaLong: 5400,
            SmaMedium: 1200,
            SmaShort: 60
        },
    }
    let stockSmaBuySell: { [key: string]: { Buy: number, Sell: number, Check200: number } } = {
        'TSLA': {
            Buy: .05,
            Sell: .16,
            Check200: .10
        },
        'AAPL': {
            Buy: .06,
            Sell: .12,
            Check200: .11
        },
        'MSFT': {
            Buy: .01,
            Sell: .02,
            Check200: .10
        },
        'AMD': {
            Buy: .08,
            Sell: .09,
            Check200: .10
        },
        'PLTR': {
            Buy: .04,
            Sell: .15,
            Check200: .10
        }
    }
    let stockData: { [key: string]: { history: number[], last3600: number[], last3600sma: number, last1800sma: number, last300sma: number, numberOfTrades: number, canTrade: boolean } } = {
        'AAPL': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, numberOfTrades: 0, canTrade: true },
        'MSFT': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, numberOfTrades: 0, canTrade: true },
        'PLTR': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, numberOfTrades: 0, canTrade: true },
        'AMD': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, numberOfTrades: 0, canTrade: true },
        'TSLA': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, numberOfTrades: 0, canTrade: true }
    }


    const schwabWebsocket = new WebSocket(userData.streamerSocketUrl)
    let hasBeenSent = false
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
    const socketSendMsg = {
        "requests": [
            {
                "service": "LEVELONE_EQUITIES",
                "requestid": "1",
                "command": "SUBS",
                "SchwabClientCustomerId": userData.schwabClientCustomerId,
                "SchwabClientCorrelId": userData.schwabClientCorrelId,
                "parameters": {
                    "keys": "AAPL, MSFT, PLTR, AMD, TSLA",
                    "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
                }
            }
        ]
    }
    schwabWebsocket.on('open', () => {
        schwabWebsocket.send(JSON.stringify(loginMsg))
    })
    schwabWebsocket.on('message', async (event) => {
        let newEvent = JSON.parse(event.toString())


        if (Object.hasOwn(newEvent, 'response')) {
            if (newEvent.response[0].requestid == 0 && hasBeenSent == false) {
                console.log(newEvent.response[0])
                schwabWebsocket.send(JSON.stringify(socketSendMsg))
                hasBeenSent = true
            }
        }
        try {
            if (Object.hasOwn(newEvent, 'data') && hasBeenSent == true) {
                if (newEvent.data[0].service == 'LEVELONE_EQUITIES') {
                    let insertData: DbCurrentDayStockData[] = []
                    for (let i = 0; i < newEvent.data[0].content.length; i++) {
                        if (Object.hasOwn(newEvent.data[0].content[i], '3')) {
                            let data: DbCurrentDayStockData = {
                                stockName: newEvent.data[0].content[i].key,
                                stockPrice: newEvent.data[0].content[i]['3'],
                                time: Number(newEvent.data[0].timestamp),
                                volume: newEvent.data[0].content[i]['8']
                            }
                            
                            insertData.push(data)
                                stockData[data.stockName].history.push(data.stockPrice)
                                if (stockData[data.stockName].history.length == stockDayTradeValues[data.stockName].SmaLong) {
                                    stockData[data.stockName].last3600 = stockData[data.stockName].history
                                    stockData[data.stockName].last3600sma = stockData[data.stockName].last3600.reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaLong
                                    stockData[data.stockName].last1800sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaMedium * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaMedium
                                    stockData[data.stockName].last300sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaShort * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaShort
                                }
                                else if (stockData[data.stockName].history.length > stockDayTradeValues[data.stockName].SmaLong) {
                                    stockData[data.stockName].last3600.shift()
                                    stockData[data.stockName].last3600.push(data.stockPrice)
                                    stockData[data.stockName].last3600sma = stockData[data.stockName].last3600.reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaLong
                                    stockData[data.stockName].last1800sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaMedium * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaMedium
                                    stockData[data.stockName].last300sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaShort * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaShort
                                }
                                for (let j = 0; j < userServerAlgos.length; j++) {
                                    let filteredOrderOnUserAndStock = userOrders.filter(e => e.userId == userServerAlgos![j].userId && e.stockName == data.stockName)[0]
                                    let isBuy = filteredOrderOnUserAndStock.orderType == 'Sell' ? true : false;

                                    if (stockData[data.stockName].canTrade && isBuy && (((stockData[data.stockName].last300sma - stockData[data.stockName].last1800sma) / stockData[data.stockName].last1800sma) < (stockDayTradeValues[data.stockName].Buy * -1)) && (((stockData[data.stockName].last300sma - stockData[data.stockName].last3600sma) / stockData[data.stockName].last3600sma) < stockDayTradeValues[data.stockName].Check200)) {
                                        console.log('Placing a buy order')

                                        await dbOrdersRepo.insert({
                                            userId: userServerAlgos[j].userId,
                                            stockName: data.stockName,
                                            orderType: 'Buy',
                                            stockPrice: data.stockPrice,
                                            shareQty: 1,
                                            orderTime: data.time
                                        })
                                        stockData[data.stockName].numberOfTrades++
                                    }
                                     
                                    else if (stockData[data.stockName].canTrade && !isBuy && (((stockData[data.stockName].last300sma - stockData[data.stockName].last1800sma) / stockData[data.stockName].last1800sma) > stockDayTradeValues[data.stockName].Sell) && data.stockPrice > filteredOrderOnUserAndStock.stockPrice) {
                                        console.log('Placing a sell order')
                                        await dbOrdersRepo.insert({
                                            userId: userServerAlgos[j].userId,
                                            stockName: data.stockName,
                                            orderType: 'Sell',
                                            stockPrice: data.stockPrice,
                                            shareQty: filteredOrderOnUserAndStock.shareQty,
                                            orderTime: data.time
                                        })
                                        stockData[data.stockName].numberOfTrades++
                                    }
                                    /* else if(stockData[data.stockName].canTrade && !isBuy && data.time > endingTime && data.stockPrice > filteredOrderOnUserAndStock.stockPrice){
                                        console.log('Placing final day sell order')
                                        await dbOrdersRepo.insert({
                                            userId: userServerAlgos[j].userId,
                                            stockName: data.stockName,
                                            orderType: 'Sell',
                                            stockPrice: data.stockPrice,
                                            shareQty: filteredOrderOnUserAndStock.shareQty,
                                            orderTime: data.time
                                        })
                                        stockData[data.stockName].numberOfTrades++
                                        stockData[data.stockName].canTrade = false
                                    }  */
                                    else if(stockData[data.stockName].canTrade && !isBuy && stockData[data.stockName].numberOfTrades == 0 && data.stockPrice > filteredOrderOnUserAndStock.stockPrice){
                                        console.log('Placing pre algo sell order')
                                        await dbOrdersRepo.insert({
                                            userId: userServerAlgos[j].userId,
                                            stockName: data.stockName,
                                            orderType: 'Sell',
                                            stockPrice: data.stockPrice,
                                            shareQty: filteredOrderOnUserAndStock.shareQty,
                                            orderTime: data.time
                                        })
                                        stockData[data.stockName].numberOfTrades++
                                    }
                                }
                                userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos!.map(e => e.userId) }, orderBy: { orderTime: 'desc' } })
                        }
                    }
                    await dbCurrentDayStockDataRepo.insert(insertData)
                }
            }
        }
        catch (error: any) {
            console.log('insertStockData server call: ' + error.message)
        }

    });

    setTimeout(() => {
        schwabWebsocket.close()
    }, 23400000);






}
