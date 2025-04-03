
import { filter } from "rxjs";
import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbStockBasicHistoryRepo } from "../shared/tasks/dbStockBasicHistory.js";
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';
import { DbAlgorithmList, dbAlgorithmListRepo } from "../shared/tasks/dbAlgorithmList.js";
import { dbOrdersRepo } from "../shared/tasks/dbOrders.js";
import { OrderService } from "../app/services/orderService.js";
import { stockOrder } from "../app/Dtos/stockOrder.js";
import { simFinRepo } from "../shared/tasks/simFinance.js";
import { usersStocksRepo } from "../shared/tasks/usersStocks.js";
import { reusedFunctions } from "../app/services/reusedFunctions.js";

export const socketCall = async (): Promise<void> => {
    console.log('here in insert file')

    //admin user to start websocket
    const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens
    //get list of users signed up for the sma200
    const userServerAlgos = await dbAlgorithmListRepo.findFirst({ sma200sma50: true })
    //get all orders for each above user

    let userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos!.userId }, orderBy: { orderTime: 'desc' } })

    //get all fincances for users
    //const simFinUser = await simFinRepo.find({ where: { userId: userServerAlgos.map(e => e.userId) } })

    //get all stocks for users
    //const stocks = await usersStocksRepo.find({ where: { userId: userServerAlgos.map(e => e.userId) } })



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
    let stockDayTradeValues: { [key: string]: { Buy: number, Sell: number, Check200: number } } = {
        'TSLA': {
            Buy: .004,
            Sell: .006,
            Check200: .01
        },
        'AAPL': {
            Buy: .001,
            Sell: .002,
            Check200: .01
        },
        'MSFT': {
            Buy: .001,
            Sell: .004,
            Check200: .01
        },
        'AMD': {
            Buy: .001,
            Sell: .002,
            Check200: .10
        },
        'PLTR': {
            Buy: .001,
            Sell: .01,
            Check200: .01
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
    let stockData: { [key: string]: { previousPrice: number, history: number[], last3600: number[], last3600sma: number, last1800sma: number, last300sma: number } } = {
        'AAPL': { previousPrice: 0, history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0 },
        'MSFT': { previousPrice: 0, history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0 },
        'PLTR': { previousPrice: 0, history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0 },
        'AMD': { previousPrice: 0, history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0 },
        'TSLA': { previousPrice: 0, history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0 }
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
                            //insertData.push(data)
                            //check to see if its an outlier
                            //add if it's within trading hours
                            if (stockData[data.stockName].previousPrice == 0) {
                                insertData.push(data)
                                stockData[data.stockName].previousPrice = data.stockPrice
                                stockData[data.stockName].history.push(data.stockPrice)
                            }
                            else if (Math.abs((stockData[data.stockName].previousPrice - data.stockPrice) / stockData[data.stockName].previousPrice) < .015) {
                                insertData.push(data)
                                if (data.stockName == 'TSLA') {
                                    stockData[data.stockName].previousPrice = data.stockPrice
                                    stockData[data.stockName].history.push(data.stockPrice)
                                    if (stockData[data.stockName].history.length == 3600) {
                                        stockData[data.stockName].last3600 = stockData[data.stockName].history
                                        stockData[data.stockName].last3600sma = stockData[data.stockName].last3600.reduce((sum, val) => sum + val, 0) / 3600
                                        stockData[data.stockName].last1800sma = stockData[data.stockName].last3600.slice(-1800).reduce((sum, val) => sum + val, 0) / 1800
                                        stockData[data.stockName].last300sma = stockData[data.stockName].last3600.slice(-300).reduce((sum, val) => sum + val, 0) / 300
                                    }
                                    else if (stockData[data.stockName].history.length > 3600) {
                                        stockData[data.stockName].last3600.shift()
                                        stockData[data.stockName].last3600.push(data.stockPrice)
                                        stockData[data.stockName].last3600sma = stockData[data.stockName].last3600.reduce((sum, val) => sum + val, 0) / 3600
                                        stockData[data.stockName].last1800sma = stockData[data.stockName].last3600.slice(-1800).reduce((sum, val) => sum + val, 0) / 1800
                                        stockData[data.stockName].last300sma = stockData[data.stockName].last3600.slice(-300).reduce((sum, val) => sum + val, 0) / 300
                                    }
                                    //for (let i = 0; i < userServerAlgos.length; i++) {
                                    let filteredOrderOnUserAndStock = userOrders.filter(e => e.userId == userServerAlgos!.userId && e.stockName == data.stockName)[0]
                                    let isBuy = filteredOrderOnUserAndStock.orderType == 'Sell' ? true : false;

                                    if (isBuy && (((stockData[data.stockName].last300sma - stockData[data.stockName].last1800sma) / stockData[data.stockName].last1800sma) < (stockDayTradeValues[data.stockName].Buy * -1)) && ((Math.abs(stockData[data.stockName].last300sma - stockData[data.stockName].last3600sma) / stockData[data.stockName].last3600sma) < stockDayTradeValues[data.stockName].Buy)) {
                                        console.log('Placing a buy order')
                                        await dbOrdersRepo.insert({
                                            userId: userServerAlgos!.userId,
                                            //userServerAlgos[i].userId,
                                            stockName: data.stockName,
                                            orderType: 'Buy',
                                            stockPrice: data.stockPrice,
                                            shareQty: 1,
                                            orderTime: data.time
                                        })
                                        userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos!.userId }, orderBy: { orderTime: 'desc' } })
                                        /* const simUser = simFinUser.filter(e => e.userId == userServerAlgos[i].userId)[0]
                                        let newAmount = simUser!.spending - 20
                                        await simFinRepo.save({ ...simUser, spending: newAmount })
                                        let stockUser = stocks.filter(e => e.userId == userServerAlgos[i].userId && e.stockName == data.stockName)[0]
                                        let newStockAmnt = stockUser.shareQty + (20 / data.stockPrice)
                                        await usersStocksRepo.save({ ...stockUser, shareQty: newStockAmnt }) */
                                    }
                                    else if (!isBuy && (((stockData[data.stockName].last300sma - stockData[data.stockName].last1800sma) / stockData[data.stockName].last1800sma) > stockDayTradeValues[data.stockName].Sell) && data.stockPrice > filteredOrderOnUserAndStock.stockPrice) {
                                        console.log('Placing a sell order')
                                        await dbOrdersRepo.insert({
                                            userId: userServerAlgos!.userId,
                                            //userServerAlgos[i].userId,
                                            stockName: data.stockName,
                                            orderType: 'Sell',
                                            stockPrice: data.stockPrice,
                                            shareQty: filteredOrderOnUserAndStock.shareQty,
                                            orderTime: data.time
                                        })
                                        userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos!.userId }, orderBy: { orderTime: 'desc' } })
                                        /* const simUser = simFinUser.filter(e => e.userId == userServerAlgos[i].userId)[0]
                                        let newAmount = simUser!.spending + (filteredOrderOnUserAndStock.shareQty * data.stockPrice)
                                        await simFinRepo.save({ ...simUser, spending: newAmount })
                                        let stockUser = stocks.filter(e => e.userId == userServerAlgos[i].userId && e.stockName == data.stockName)[0]
                                        let newStockAmnt = stockUser.shareQty - filteredOrderOnUserAndStock.shareQty
                                        await usersStocksRepo.save({ ...stockUser, shareQty: newStockAmnt }) */
                                    }
                                    //}
                                }




                            }

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
