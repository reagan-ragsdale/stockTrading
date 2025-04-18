

import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';
import { dbAlgorithmListRepo } from "../shared/tasks/dbAlgorithmList.js";
import { dbOrdersRepo } from "../shared/tasks/dbOrders.js";

export const socketCall = async (): Promise<void> => {
    console.log('here in insert file')
    let startDate = new Date()
    startDate.setHours(5, 0, 0, 0)
    let startTime = startDate.getTime()
    let endingTime = startTime + 53990000

    //admin user to start websocket
    const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens
    //get list of users signed up for the sma200
    const userServerAlgos = await dbAlgorithmListRepo.find({ where: { sma200sma50: true } })
    //get all orders for each above user
    let userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos!.map(e => e.userId) }, orderBy: { orderTime: 'desc' } })

    let userStockInfo: any[] = []
    for (let i = 0; i < userServerAlgos.length; i++) {
        userStockInfo.push({
            user: userServerAlgos[i].userId, stockData: [
                { stockName: 'AAPL', canTrade: true, numberOfTrades: 0 },
                { stockName: 'TSLA', canTrade: true, numberOfTrades: 0 },
                { stockName: 'MSFT', canTrade: true, numberOfTrades: 0 },
                { stockName: 'AMD', canTrade: true, numberOfTrades: 0 },
                { stockName: 'PLTR', canTrade: true, numberOfTrades: 0 },
            ]
        })
    }
    let testNum = 0;

    //set the values each stock will use in the algo
    let stockDayTradeValues: { [key: string]: { Buy: number, Sell: number, Check200: number, SmaLong: number, SmaMedium: number, SmaShort: number } } = {
        'TSLA': {
            Buy: .003,
            Sell: .003,
            Check200: .001,
            SmaLong: 3600,
            SmaMedium: 1800,
            SmaShort: 240
        },
        'AAPL': {
            Buy: .001,
            Sell: .002,
            Check200: .001,
            SmaLong: 3600,
            SmaMedium: 1200,
            SmaShort: 300
        },
        'MSFT': {
            Buy: .001,
            Sell: .001,
            Check200: .001,
            SmaLong: 4200,
            SmaMedium: 1800,
            SmaShort: 120
        },
        'AMD': {
            Buy: .001,
            Sell: .002,
            Check200: .001,
            SmaLong: 3600,
            SmaMedium: 1500,
            SmaShort: 120
        },
        'PLTR': {
            Buy: .002,
            Sell: .002,
            Check200: .001,
            SmaLong: 3600,
            SmaMedium: 1500,
            SmaShort: 480
        },
        'XOM': {
            Buy: .001,
            Sell: .002,
            Check200: .001,
            SmaLong: 3600,
            SmaMedium: 1500,
            SmaShort: 300
        },
        'NVO': {
            Buy: .001,
            Sell: .002,
            Check200: .001,
            SmaLong: 3600,
            SmaMedium: 1500,
            SmaShort: 300
        },
    }
    //will be used for long term inter day trading
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

    //create information to be used for each stock, the price history, the long, medium and short moving average, number of trades, if the stock can trage, and the last prices
    let stockData: { [key: string]: { history: number[], last3600: number[], last3600sma: number, last1800sma: number, last300sma: number, lastPrice: number, lastAsk: number, lastBid: number } } = {
        'AAPL': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 },
        'MSFT': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 },
        'PLTR': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 },
        'AMD': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 },
        'TSLA': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 },
        'XOM': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 },
        'NVO': { history: [], last3600: [], last3600sma: 0, last1800sma: 0, last300sma: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 }
    }


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
                    "keys": "AAPL, MSFT, PLTR, AMD, TSLA, XOM,NVO",
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
                            let data: DbCurrentDayStockData = {
                                stockName: newEvent.data[0].content[i].key,
                                stockPrice: newEvent.data[0].content[i]['3'],
                                askPrice: Object.hasOwn(newEvent.data[0].content[i], '2') ? newEvent.data[0].content[i]['2'] : stockData[newEvent.data[0].content[i].key].lastAsk,
                                bidPrice: Object.hasOwn(newEvent.data[0].content[i], '1') ? newEvent.data[0].content[i]['1'] : stockData[newEvent.data[0].content[i].key].lastBid,
                                time: Number(newEvent.data[0].timestamp),
                                volume: newEvent.data[0].content[i]['8']
                            }

                            //push the data into what will be sent to the database 
                            insertData.push(data)

                            //update the history and last prices
                            stockData[data.stockName].history.push(data.stockPrice)
                            stockData[data.stockName].lastAsk = data.askPrice
                            stockData[data.stockName].lastBid = data.bidPrice
                            //if the length of the history is equal to what the long moving average length is then set the moving averages
                            if (stockData[data.stockName].history.length == stockDayTradeValues[data.stockName].SmaLong) {
                                stockData[data.stockName].last3600 = stockData[data.stockName].history.slice()
                                stockData[data.stockName].last3600sma = stockData[data.stockName].last3600.reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaLong
                                stockData[data.stockName].last1800sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaMedium * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaMedium
                                stockData[data.stockName].last300sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaShort * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaShort
                                if(data.stockName == 'AAPL'){
                                    console.log('Last 3600 length: ' + stockData[data.stockName].last3600.length)
                                    console.log('history length: ' + stockData[data.stockName].history.length)
                                }
                            }
                            //else if its greater than then we do a revolving door first in first out and recalculate the moving averages
                            else if (stockData[data.stockName].history.length > stockDayTradeValues[data.stockName].SmaLong) {
                                stockData[data.stockName].last3600.shift()
                                stockData[data.stockName].last3600.push(data.stockPrice)
                                stockData[data.stockName].last3600sma = stockData[data.stockName].last3600.reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaLong
                                stockData[data.stockName].last1800sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaMedium * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaMedium
                                stockData[data.stockName].last300sma = stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaShort * -1).reduce((sum, val) => sum + val, 0) / stockDayTradeValues[data.stockName].SmaShort
                                if(data.stockName == 'AAPL'){
                                    console.log('Last 3600 length: ' + stockData[data.stockName].last3600.length)
                                    console.log('Last 1800 length: ' + stockData[data.stockName].last3600.slice(stockDayTradeValues[data.stockName].SmaMedium * -1).length)
                                    console.log('history length: ' + stockData[data.stockName].history.length)
                                    console.log('Short sma: ' + stockData[data.stockName].last300sma)
                                    console.log('Medium sma: ' + stockData[data.stockName].last1800sma)
                                }
                            }
                            //loop through each user that is signed up for the bot
                            for (let j = 0; j < userServerAlgos.length; j++) {
                                //find the users most recent order for the stock
                                let filteredOrderOnUserAndStock = userOrders.filter(e => e.userId == userServerAlgos![j].userId && e.stockName == data.stockName)[0]
                                let isBuy = filteredOrderOnUserAndStock.orderType == 'Sell' ? true : false;
                                let filteredByUser = userStockInfo.filter(e => e.user == userServerAlgos![j].userId)[0].stockData
                                let filteredByStock = filteredByUser.filter((e: { stockName: string; }) => e.stockName == data.stockName)[0]

                                //is buy and the algo is met
                                if (isBuy && filteredByStock.canTrade && (((stockData[data.stockName].last300sma - stockData[data.stockName].last1800sma) / stockData[data.stockName].last1800sma) < (stockDayTradeValues[data.stockName].Buy * -1)) && (((stockData[data.stockName].last300sma - stockData[data.stockName].last3600sma) / stockData[data.stockName].last3600sma) < stockDayTradeValues[data.stockName].Check200)) {
                                    console.log('Placing a buy order')

                                    await dbOrdersRepo.insert({
                                        userId: userServerAlgos[j].userId,
                                        stockName: data.stockName,
                                        orderType: 'Buy',
                                        stockPrice: data.askPrice,
                                        shareQty: 1,
                                        orderTime: data.time
                                    })
                                    filteredByStock.numberOfTrades++
                                    orderPlaced = true;
                                }
                                //sell and the algo is met
                                //add or if the price is a certain level above where it bought bc if its a steady rise then the moving averages will never move far enough apart
                                else if (!isBuy && filteredByStock.canTrade && (((stockData[data.stockName].last300sma - stockData[data.stockName].last1800sma) / stockData[data.stockName].last1800sma) > stockDayTradeValues[data.stockName].Sell) && data.bidPrice > filteredOrderOnUserAndStock.stockPrice) {
                                    console.log('Placing a sell order')
                                    await dbOrdersRepo.insert({
                                        userId: userServerAlgos[j].userId,
                                        stockName: data.stockName,
                                        orderType: 'Sell',
                                        stockPrice: data.bidPrice,
                                        shareQty: filteredOrderOnUserAndStock.shareQty,
                                        orderTime: data.time
                                    })
                                    filteredByStock.numberOfTrades++
                                    orderPlaced = true;
                                }
                                //sell and the end of day and stock is greater than buy price
                                 else if(!isBuy && filteredByStock.canTrade && data.time > endingTime && data.bidPrice > filteredOrderOnUserAndStock.stockPrice){
                                    console.log('Placing final day sell order')
                                    await dbOrdersRepo.insert({
                                        userId: userServerAlgos[j].userId,
                                        stockName: data.stockName,
                                        orderType: 'Sell',
                                        stockPrice: data.bidPrice,
                                        shareQty: filteredOrderOnUserAndStock.shareQty,
                                        orderTime: data.time
                                    })
                                    filteredByStock.numberOfTrades++
                                    filteredByStock.canTrade = false
                                    orderPlaced = true;
                                }  
                                //sell and begining of day and stock is greater than previous day buy price
                                else if (!isBuy && filteredByStock.canTrade && filteredByStock.numberOfTrades == 0 && data.bidPrice > filteredOrderOnUserAndStock.stockPrice) {
                                    console.log('Placing pre algo sell order')
                                    await dbOrdersRepo.insert({
                                        userId: userServerAlgos[j].userId,
                                        stockName: data.stockName,
                                        orderType: 'Sell',
                                        stockPrice: data.bidPrice,
                                        shareQty: filteredOrderOnUserAndStock.shareQty,
                                        orderTime: data.time
                                    })
                                    filteredByStock.numberOfTrades++
                                    orderPlaced = true;
                                }
                            }
                        }
                    }
                    //insert all stocks data into the db
                    await dbCurrentDayStockDataRepo.insert(insertData)
                    //update the orders if there was an order placed
                    if (orderPlaced) {
                        userOrders = await dbOrdersRepo.find({ where: { userId: userServerAlgos!.map(e => e.userId) }, orderBy: { orderTime: 'desc' } })
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
