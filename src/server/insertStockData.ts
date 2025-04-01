
import { filter } from "rxjs";
import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbStockBasicHistoryRepo } from "../shared/tasks/dbStockBasicHistory.js";
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';
import { dbAlgorithmListRepo } from "../shared/tasks/dbAlgorithmList.js";
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
    /* const userServerAlgos = await dbAlgorithmListRepo.find({ where: { sma200sma50: true } })
    //get all orders for each above user
    const userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos.map(e => e.userId) }, orderBy: { orderTime: 'desc' } })

    //get all fincances for users
    const simFinUser = await simFinRepo.find({ where: { userId: userServerAlgos.map(e => e.userId) } })

    //get all stocks for users
    const stocks = await usersStocksRepo.find({ where: { userId: userServerAlgos.map(e => e.userId) } })



    const stockHistoryData = await dbStockBasicHistoryRepo.find({ orderBy: { date: 'desc' } })
    let stockSma: { [key: string]: { last200: number[], sma200: number } } = {}
    let listOfDistinctStocks = stockHistoryData.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    for (let i = 0; i < listOfDistinctStocks.length; i++) {
        let filteredStockData = stockHistoryData.filter(e => e.stockName == listOfDistinctStocks[i]).map(e => e.close).slice(0, 200)
        let sma200 = filteredStockData.reduce((sum, val) => sum + val, 0) / filteredStockData.length
        stockSma[listOfDistinctStocks[i]] = {
            last200: filteredStockData,
            sma200: sma200
        }
    } 
    
    let stockSmaBuySell: { [key: string]: {Buy: number, Sell: number} } = {
        'TSLA': {
            Buy: .10,
            Sell: .15
        },
        'AAPL': {
            Buy: .04,
            Sell: .10
        },
        'MSFT': {
            Buy: .045,
            Sell: .10
        },
        AMD': {
            Buy: .1,
            Sell: .20
        },
        PLTR': {
            Buy: .05,
            Sell: .1
        },
    }
    */

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
        /* let previousPrice: { [key: string]: number } = {
            'AAPL': 0,
            'MSFT': 0,
            'PLTR': 0,
            'AMD': 0,
            'TSLA': 0
        } */
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
                            //check to see if its an outlier
                            //add if it's within trading hours
                            /* if (previousPrice[data.stockName] == 0) {
                                previousPrice[data.stockName] = data.stockPrice
                            }
                            else if (Math.abs((previousPrice[data.stockName] - data.stockPrice) / previousPrice[data.stockName]) < .015) {
                                insertData.push(data)
                                previousPrice[data.stockName] = data.stockPrice
                                if (reusedFunctions.isWithinTradingHours(data.time)) {
                                    let previousSma50 = stockSma[data.stockName].last200.slice(0, 50).reduce((sum, val) => sum + val, 0) / 50
                                    let new50Array = [...stockSma[data.stockName].last200.slice(0, 49), data.stockPrice]
                                    let newSma50 = new50Array.reduce((sum, val) => sum + val, 0) / new50Array.length



                                    for (let i = 0; i < userServerAlgos.length; i++) {
                                        let filteredOrderOnUserAndStock = userOrders.filter(e => e.userId == userServerAlgos[i].userId && e.stockName == data.stockName)[0]
                                        let isBuy = filteredOrderOnUserAndStock.orderType == 'Sell' ? true : false;
                                        if (isBuy && (Math.abs(newSma50 - stockSma[data.stockName].sma200) / stockSma[data.stockName].sma200) >= stockSmaBuySell[data.stockName].Buy) {
                                            await dbOrdersRepo.insert({
                                                userId: userServerAlgos[i].userId,
                                                stockName: data.stockName,
                                                orderType: 'Buy',
                                                stockPrice: data.stockPrice,
                                                shareQty: 20 / data.stockPrice,
                                                orderTime: data.time
                                            })
                                            const simUser = simFinUser.filter(e => e.userId == userServerAlgos[i].userId)[0]
                                            let newAmount = simUser!.spending - 20
                                            await simFinRepo.save({ ...simUser, spending: newAmount })
                                            let stockUser = stocks.filter(e => e.userId == userServerAlgos[i].userId && e.stockName == data.stockName)[0]
                                            let newStockAmnt = stockUser.shareQty + (20 / data.stockPrice)
                                            await usersStocksRepo.save({ ...stockUser, shareQty: newStockAmnt })
                                        }
                                        else if (!isBuy && (Math.abs(newSma50 - stockSma[data.stockName].sma200) / stockSma[data.stockName].sma200) >= stockSmaBuySell[data.stockName].Sell) {
                                            await dbOrdersRepo.insert({
                                                userId: userServerAlgos[i].userId,
                                                stockName: data.stockName,
                                                orderType: 'Sell',
                                                stockPrice: data.stockPrice,
                                                shareQty: filteredOrderOnUserAndStock.shareQty,
                                                orderTime: data.time
                                            })
                                            const simUser = simFinUser.filter(e => e.userId == userServerAlgos[i].userId)[0]
                                            let newAmount = simUser!.spending + (filteredOrderOnUserAndStock.shareQty * data.stockPrice)
                                            await simFinRepo.save({ ...simUser, spending: newAmount })
                                            let stockUser = stocks.filter(e => e.userId == userServerAlgos[i].userId && e.stockName == data.stockName)[0]
                                            let newStockAmnt = stockUser.shareQty - filteredOrderOnUserAndStock.shareQty
                                            await usersStocksRepo.save({ ...stockUser, shareQty: newStockAmnt })
                                        }
                                    }
                                }


                            } */

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
    }, 36000000);






}
