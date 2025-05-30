

import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';
import { dbOrdersRepo } from "../shared/tasks/dbOrders.js";
import { LoggerController } from "../shared/controllers/LoggerController.js";
import { simFinRepo } from "../shared/tasks/simFinance.js";
import { ServerTradeStrategies } from "../app/services/serverTradeStrategies.js";

type lastTrade = {
    lastPrice: number;
    lastAsk: number;
    lastBid: number;
}

export const socketCall = async (): Promise<void> => {
    console.log('here in insert file')
    let startDate = new Date()
    startDate.setHours(5, 0, 0, 0)
    let startTime = startDate.getTime()
    let endingTime = startTime + 53990000

    let activeStrategies: string[] = ['MACrossover', 'VWAP Trend']

    //admin user to start websocket
    const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens

    let userFinance = await simFinRepo.findFirst({ userId: 'Shared' })
    //get all orders for each above user
    let userOrders = await dbOrdersRepo.find({ where: { userId: 'Shared' }, orderBy: { orderTime: 'desc' } })

    let stockLastTradesMap = new Map<string, lastTrade>()
    stockLastTradesMap.set('AAPL', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('MSFT', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('PLTR', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('AMD', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('TSLA', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('XOM', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('NVO', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('NEE', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('NVDA', { lastPrice: 0, lastAsk: 0, lastBid: 0 })

    ServerTradeStrategies.initialize()

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
                            let lastPrices = stockLastTradesMap.get(newEvent.data[0].content[i].key)!
                            let data: DbCurrentDayStockData = {
                                stockName: newEvent.data[0].content[i].key,
                                stockPrice: newEvent.data[0].content[i]['3'],
                                askPrice: Object.hasOwn(newEvent.data[0].content[i], '2') ? newEvent.data[0].content[i]['2'] : lastPrices.lastAsk,
                                bidPrice: Object.hasOwn(newEvent.data[0].content[i], '1') ? newEvent.data[0].content[i]['1'] : lastPrices.lastBid,
                                time: Number(newEvent.data[0].timestamp),
                                volume: newEvent.data[0].content[i]['8']
                            }
                            lastPrices.lastPrice = data.stockPrice
                            lastPrices.lastAsk = data.askPrice
                            lastPrices.lastBid = data.bidPrice

                            //push the data into what will be sent to the database 
                            insertData.push(data)
                            for (let strategy = 0; strategy < activeStrategies.length; strategy++) {
                                let lastOrder = userOrders.filter(e => e.stockName == data.stockName && e.tradeStrategy == activeStrategies[strategy])
                                let isBuy = true;
                                if (lastOrder.length > 0) {
                                    isBuy = lastOrder[0].orderType == 'Sell' ? true : false;
                                }

                                if (isBuy) {
                                    let result = ServerTradeStrategies.shouldExecuteOrder(data, activeStrategies[strategy], lastOrder)
                                    //console.log(result)
                                    if (result.shouldTrade && (data.askPrice < (userFinance?.spending! + 1))) {
                                        let orderId = Math.floor(Math.random() * 10000000000)
                                        await dbOrdersRepo.insert({
                                            userId: 'Shared',
                                            stockName: data.stockName,
                                            orderType: 'Buy',
                                            stockPrice: data.askPrice,
                                            shareQty: 1,
                                            orderId: orderId,
                                            tradeStrategy: activeStrategies[strategy],
                                            orderTime: data.time
                                        })

                                        orderPlaced = true
                                        let newSpending = userFinance?.spending! - data.askPrice
                                        await simFinRepo.save({ ...userFinance, spending: newSpending })
                                        userFinance = await simFinRepo.findFirst({ userId: 'Shared' })
                                        if (result.log !== null) {
                                            result.log.tradingAmount = userFinance?.spending!
                                            result.log.orderId = orderId
                                            result.log.shares = 1
                                            LoggerController.addToLog(result.log)
                                        }
                                    }

                                }
                                else {
                                    let result = ServerTradeStrategies.shouldExecuteOrder(data, activeStrategies[strategy], lastOrder)
                                    if (result.shouldTrade) {
                                        await dbOrdersRepo.insert({
                                            userId: 'Shared',
                                            stockName: data.stockName,
                                            orderType: 'Sell',
                                            stockPrice: data.bidPrice,
                                            shareQty: lastOrder[0].shareQty,
                                            orderId: lastOrder[0].orderId,
                                            tradeStrategy: activeStrategies[strategy],
                                            orderTime: data.time
                                        })
                                        orderPlaced = true
                                        if (result.log !== null) {
                                            result.log.tradingAmount = userFinance?.spending!
                                            result.log.shares = 1
                                            LoggerController.addToLog(result.log)
                                        }
                                    }
                                    else if (result.shouldTrade == false && result.log !== null) {
                                        result.log.tradingAmount = userFinance?.spending!
                                        LoggerController.addToLog(result.log)
                                    }
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
