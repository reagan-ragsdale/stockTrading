

import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';
import { dbOrdersRepo } from "../shared/tasks/dbOrders.js";
import { LoggerController } from "../shared/controllers/LoggerController.js";
import { simFinRepo } from "../shared/tasks/simFinance.js";
import { ServerTradeStrategies } from "../app/services/serverTradeStrategies.js";
import { SchwabController } from "../shared/controllers/SchwabController.js";
import { LogService } from "../app/services/LogService.js";
import { SchwabOrderDTO } from "../app/Dtos/TradingBotDtos.js";
import { getAccountInfo, getOrdersForAccount, placeOrderForAccount } from "./schwabApiCalls.js";
import { dbSchwabOrdersRepo } from "../shared/tasks/dbSchwabOrders.js";

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
    let listOfTradableStocks: string[] = ['AAPL', 'TSLA', 'PLTR']
    let activeStrategies: string[] = ['MA Drop']

    //admin user to start websocket
    const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens

    //let userFinance = await simFinRepo.findFirst({ userId: 'Shared' })
    //get all orders for each above user
    //let userOrders = await dbOrdersRepo.find({ where: { userId: 'Shared' }, orderBy: { orderTime: 'desc' } })
    let localSchwabOrders = await dbSchwabOrdersRepo.find({ where: { accountNum: userData.accountNum }, orderBy: { orderTime: 'desc' } })



    let schwabOrders = await getOrdersForAccount(userData.accountNum, userData.accessToken)
    let schwabPosition = await getAccountInfo(userData.accountNum, userData.accessToken)
    let count = 0


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
    stockLastTradesMap.set('AMZN', { lastPrice: 0, lastAsk: 0, lastBid: 0 })
    stockLastTradesMap.set('GOOG', { lastPrice: 0, lastAsk: 0, lastBid: 0 })

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
                    "keys": "AAPL, MSFT, PLTR, AMD, TSLA, XOM,NVO, NEE, NVDA, AMZN, GOOG",
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
                            if (listOfTradableStocks.includes(data.stockName)) {
                                for (let strategy = 0; strategy < activeStrategies.length; strategy++) {
                                    //change below to point to schwab order table
                                    let lastOrder = localSchwabOrders.filter(e => e.stockName == data.stockName && e.tradeStrategy == activeStrategies[strategy])
                                    let isBuy = true;
                                    if (lastOrder.length > 0) {
                                        isBuy = lastOrder[0].orderType == 'Sell' ? true : false;
                                    }
                                    let balance = schwabPosition.securitiesAccount.currentBalances.cashAvailableForTrading - schwabPosition.securitiesAccount.currentBalances.unsettledCash + 3
                                    let result = ServerTradeStrategies.shouldExecuteOrder(data, activeStrategies[strategy], lastOrder, isBuy, balance)
                                    if (result.shouldTrade) {
                                        //add below to send to schwab and also insert into schwab order table
                                        let schwabOrder: SchwabOrderDTO = {
                                            orderType: "MARKET",
                                            session: "NORMAL",
                                            duration: "DAY",
                                            orderStrategyType: "SINGLE",
                                            orderLegCollection: [
                                                {
                                                    instruction: result.tradeType!,
                                                    quantity: 1,
                                                    instrument: {
                                                        symbol: data.stockName,
                                                        assetType: "EQUITY"
                                                    }
                                                }
                                            ]
                                        }
                                        let response = await placeOrderForAccount(userData, schwabOrder)
                                        if (response.length == 0) {
                                            let promiseResult = await Promise.all([getOrdersForAccount(userData.accountNum, userData.accessToken), getAccountInfo(userData.accountNum, userData.accessToken)])
                                            schwabOrders = promiseResult[0]
                                            schwabPosition = promiseResult[1]
                                            let lastOrder = schwabOrders[0]
                                            await dbSchwabOrdersRepo.insert({
                                                accountNum: userData.accountNum,
                                                stockName: data.stockName,
                                                orderType: result.tradeType!,
                                                stockPrice: lastOrder.orderActivityCollection[0].executionLegs[0].price,
                                                shareQty: lastOrder.quantity,
                                                orderId: lastOrder.orderId,
                                                tradeStrategy: activeStrategies[strategy],
                                                orderTime: data.time
                                            })
                                            result.log!.tradingAmount = schwabPosition.securitiesAccount.currentBalances.cashAvailableForTrading - schwabPosition.securitiesAccount.currentBalances.unsettledCash
                                            result.log!.orderId = lastOrder.orderId
                                            result.log!.shares = 1
                                            LoggerController.addToLog(result.log!)
                                        }
                                        else {
                                            console.log("Buy Error: " + response)
                                        }
                                    }
                                    else if (result.log != null) {
                                        LoggerController.addToLog(result.log)
                                    }


                                }
                            }

                        }


                    }
                    if (count == 0) {
                        console.time('buy time')
                        let schwabOrder: SchwabOrderDTO = {
                            orderType: "MARKET",
                            session: "NORMAL",
                            duration: "DAY",
                            orderStrategyType: "SINGLE",
                            orderLegCollection: [
                                {
                                    instruction: "BUY",
                                    quantity: 1,
                                    instrument: {
                                        symbol: "SID",
                                        assetType: "EQUITY"
                                    }
                                }
                            ]
                        }
                        let response = await placeOrderForAccount(userData, schwabOrder)
                        if (response.length == 0) {
                            let promiseResult = await Promise.all([getOrdersForAccount(userData.accountNum, userData.accessToken), getAccountInfo(userData.accountNum, userData.accessToken)])
                            schwabOrders = promiseResult[0]
                            schwabPosition = promiseResult[1]
                            let lastOrder = schwabOrders[0]
                            await dbSchwabOrdersRepo.insert({
                                accountNum: userData.accountNum,
                                stockName: "SID",
                                orderType: "BUY",
                                stockPrice: lastOrder.orderActivityCollection[0].executionLegs[0].price,
                                shareQty: lastOrder.quantity,
                                orderId: lastOrder.orderId,
                                tradeStrategy: 'TEST',
                                orderTime: 0
                            })
                        }
                        console.timeEnd('buy time')
                    }
                    else if (count == 20) {
                        console.time('sell time')
                        let schwabOrder: SchwabOrderDTO = {
                            orderType: "MARKET",
                            session: "NORMAL",
                            duration: "DAY",
                            orderStrategyType: "SINGLE",
                            orderLegCollection: [
                                {
                                    instruction: "SELL",
                                    quantity: 1,
                                    instrument: {
                                        symbol: "SID",
                                        assetType: "EQUITY"
                                    }
                                }
                            ]
                        }
                        let response = await placeOrderForAccount(userData, schwabOrder)
                        if (response.length == 0) {
                            let promiseResult = await Promise.all([getOrdersForAccount(userData.accountNum, userData.accessToken), getAccountInfo(userData.accountNum, userData.accessToken)])
                            schwabOrders = promiseResult[0]
                            schwabPosition = promiseResult[1]
                            let lastOrder = schwabOrders[0]
                            await dbSchwabOrdersRepo.insert({
                                accountNum: userData.accountNum,
                                stockName: "SID",
                                orderType: "SELL",
                                stockPrice: lastOrder.orderActivityCollection[0].executionLegs[0].price,
                                shareQty: lastOrder.quantity,
                                orderId: lastOrder.orderId,
                                tradeStrategy: 'TEST',
                                orderTime: 0
                            })
                        }
                        console.timeEnd('sell time')
                    }
                    //insert all stocks data into the db
                    count++
                    await dbCurrentDayStockDataRepo.insert(insertData)

                    //update the orders if there was an order placed

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
