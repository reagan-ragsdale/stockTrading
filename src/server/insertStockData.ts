

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
import { getAccountInfo, getOrdersForAccount, getOrdersForAccountById, placeOrderForAccount } from "./schwabApiCalls.js";
import { DbSchwabOrders, dbSchwabOrdersRepo } from "../shared/tasks/dbSchwabOrders.js";

type lastTrade = {
    lastPrice: number;
    lastAsk: number;
    lastBid: number;
    pauseTrade: boolean;
    tradeId: number;
    tradeType: string;
}

export const socketCall = async (): Promise<void> => {
    console.log('here in insert file')
    let activeStrategies: string[] = ['MA Drop']

    //admin user to start websocket
    let userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens

    let localSchwabOrders = await dbSchwabOrdersRepo.find({ where: { accountNum: userData.accountNum }, orderBy: { orderTime: 'desc' } })



    let schwabOrders = await getOrdersForAccount(userData.accountNum, userData.accessToken)
    let schwabPosition = await getAccountInfo(userData.accountNum, userData.accessToken)
    let amountAvailableToTrade = schwabPosition.securitiesAccount.currentBalances.cashAvailableForTrading - schwabPosition.securitiesAccount.currentBalances.unsettledCash

    let stockLastTradesMap = new Map<string, lastTrade>()
    stockLastTradesMap.set('AAPL', { lastPrice: 0, lastAsk: 0, lastBid: 0, pauseTrade: false, tradeId: 0, tradeType: '' })
    stockLastTradesMap.set('PLTR', { lastPrice: 0, lastAsk: 0, lastBid: 0, pauseTrade: false, tradeId: 0, tradeType: '' })
    stockLastTradesMap.set('TSLA', { lastPrice: 0, lastAsk: 0, lastBid: 0, pauseTrade: false, tradeId: 0, tradeType: '' })

    ServerTradeStrategies.initialize()
    ServerTradeStrategies.setAccessToken(userData.accessToken)

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
                    "keys": "PLTR",
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
            if (Object.hasOwn(newEvent, 'data') && hasBeenSent == true && newEvent.data[0].service == 'LEVELONE_EQUITIES') {
                //let insertData: DbCurrentDayStockData[] = []
                //loop through each stock
                let accessToken = ServerTradeStrategies.getAccessToken()
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
                        //insertData.push(data)
                        //for (let strategy = 0; strategy < activeStrategies.length; strategy++) {
                        let lastOrder = localSchwabOrders.filter(e => e.stockName == data.stockName && e.tradeStrategy == 'MA Drop')
                        let isBuy = true;
                        if (lastOrder.length > 0) {
                            isBuy = lastOrder[0].orderType == 'SELL' ? true : false;
                        }
                        let result = ServerTradeStrategies.shouldExecuteOrder(data, 'MA Drop', lastOrder, isBuy, amountAvailableToTrade + 3)
                        if (result.shouldTrade && lastPrices.pauseTrade == false) {
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
                            let response = await placeOrderForAccount(userData.accountNum, accessToken, schwabOrder)
                            if (response.code == 201) {
                                console.log('Trade')
                                lastPrices.tradeId = response.orderId!
                                lastPrices.tradeType = result.tradeType!
                                lastPrices.pauseTrade = true;
                            }
                            else {
                                console.log('Trade error')
                                console.log(response.code + ' - ' + response.message)
                            }
                        }
                        else if (lastPrices.pauseTrade == true) {
                            let newSchwabOrder = await getOrdersForAccountById(userData.accountNum, accessToken, lastPrices.tradeId)

                            if (Object.keys(newSchwabOrder).length > 0) {
                                console.log('get order below')
                                console.log(newSchwabOrder)
                                //if (newSchwabOrder.status == 'FILLED') {
                                let newInsertData: DbSchwabOrders = {
                                    accountNum: userData.accountNum,
                                    stockName: data.stockName,
                                    orderType: lastPrices.tradeType,
                                    stockPrice: newSchwabOrder.orderActivityCollection[0].executionLegs[0].price,
                                    shareQty: newSchwabOrder.quantity,
                                    orderId: newSchwabOrder.orderId,
                                    tradeStrategy: 'MA Drop',
                                    orderTime: data.time
                                }
                                await dbSchwabOrdersRepo.insert(newInsertData)
                                if (result.tradeType! == 'BUY') {
                                    amountAvailableToTrade = amountAvailableToTrade - newSchwabOrder.orderActivityCollection[0].executionLegs[0].price
                                }
                                localSchwabOrders.unshift(newInsertData)
                                //result.log!.tradingAmount = 0
                                //result.log!.orderId = newSchwabOrder.orderId
                                //result.log!.shares = 1
                                //LoggerController.addToLog(result.log!)
                                lastPrices.pauseTrade = false;
                                // }

                            }


                        }
                        else if (result.log != null) {
                            LoggerController.addToLog(result.log)
                        }


                        //}

                    }


                }
                //await dbCurrentDayStockDataRepo.insert(insertData)
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

const updateToken = () => {

}
