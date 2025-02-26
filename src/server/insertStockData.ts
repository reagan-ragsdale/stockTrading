import { AuthController } from "../shared/controllers/AuthController.js"
import { StockHistoryController } from "../shared/controllers/StockHistoryController.js"
import { dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { DbLevelTwoData, dbLevelTwoDataRepo } from "../shared/tasks/dbLevelTwoData.js";
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
import { WebSocket } from 'ws';

export const insertCall = async (): Promise<void> => {


    const userData = await dbTokenRepo.findFirst({ id: { '!=': '' } }) as DbTOkens

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
                    "keys": "AAPL, MSFT",
                    "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
                }
            }/* ,
            {
                "service": "NASDAQ_BOOK",
                "requestid": "23",
                "command": "SUBS",
                "SchwabClientCustomerId": userData.schwabClientCustomerId,
                "SchwabClientCorrelId": userData.schwabClientCorrelId,
                "parameters": {
                    "keys": "AAPL",
                    "fields": "0,1,2,3"
                }
            } */
        ]
    }
    schwabWebsocket.on('open', () => {
        schwabWebsocket.send(JSON.stringify(loginMsg))
    })
    schwabWebsocket.on('message', async (event) => {
        let newEvent = JSON.parse(event.toString())
        console.log(newEvent)


        if (Object.hasOwn(newEvent, 'response')) {
            if (newEvent.response[0].requestid == 0 && hasBeenSent == false) {
                console.log(newEvent.response[0].content)
                schwabWebsocket.send(JSON.stringify(socketSendMsg))
                console.log('send aapl')
                hasBeenSent = true
            }
            /*  if (newEvent.response[0].service == 'NYSE_BOOK') {
                 console.log(newEvent.response[0].content)
             } */
        }
        if (Object.hasOwn(newEvent, 'data') && hasBeenSent == true) {
            if(newEvent.data[0].service == 'LEVELONE_EQUITIES'){
                for (let i = 0; i < newEvent.data[0].content.length; i++) {
                    if (Object.hasOwn(newEvent.data[0].content[i], '3')) {
                        await dbCurrentDayStockDataRepo.insert({ stockName: newEvent.data[0].content[i].key, stockPrice: newEvent.data[0].content[i]['3'], time: Number(newEvent.data[0].timestamp) })
                    }
    
                }
            }
            
            /* if(newEvent.data[i].service == 'NASDAQ_BOOK'){
                let levelTwoInsertData: DbLevelTwoData[] = []
                console.log(newEvent.data[i].content)
                if(Object.hasOwn(newEvent.data[i].content[0], '2')){
                    console.log(newEvent.data[i].content[0]['2'])
                    for(let j = 0; j < newEvent.data[i].content[0]['2'].length; j++){
                        console.log(newEvent.data[i].content[0]['2'][j]['3'])
                        if(Object.hasOwn(newEvent.data[i].content[0]['2'][j], '3')){
                            for(let k = 0; k < newEvent.data[i].content[0]['2'][j]['3'].length; k++){
                                let levelTwoData: DbLevelTwoData = {
                                    stockName: newEvent.data[i].content[0].key,
                                    marketSnapShotTime: newEvent.data[i].content[0]['1'],
                                    orderType: 'Bid', 
                                    price: newEvent.data[i].content[0]['2'][j]['0'],
                                    aggregateSize: newEvent.data[i].content[0]['2'][j]['1'],
                                    marketMakerCount: newEvent.data[i].content[0]['2'][j]['2'],
                                    marketMakerId: newEvent.data[i].content[0]['2'][j]['3'][k]['0'],
                                    size: newEvent.data[i].content[0]['2'][j]['3'][k]['1'],
                                    quoteTime: newEvent.data[i].content[0]['2'][j]['3'][k]['2']
                                }
                                levelTwoInsertData.push(levelTwoData)
                            }
                        }
                    }
                }
                if(Object.hasOwn(newEvent.data[i].content[0], '3')){
                    console.log(newEvent.data[i].content[0]['3'])
                    for(let j = 0; j < newEvent.data[i].content[0]['3'].length; j++){
                        console.log(newEvent.data[i].content[0]['3'][j]['3'])
                        if(Object.hasOwn(newEvent.data[i].content[0]['3'][j], '3')){
                            for(let k = 0; k < newEvent.data[i].content[0]['3'][j]['3'].length; k++){
                                let levelTwoData: DbLevelTwoData = {
                                    stockName: newEvent.data[i].content[0].key,
                                    marketSnapShotTime: newEvent.data[i].content[0]['1'],
                                    orderType: 'Ask', 
                                    price: newEvent.data[i].content[0]['3'][j]['0'],
                                    aggregateSize: newEvent.data[i].content[0]['3'][j]['1'],
                                    marketMakerCount: newEvent.data[i].content[0]['3'][j]['2'],
                                    marketMakerId: newEvent.data[i].content[0]['3'][j]['3'][k]['0'],
                                    size: newEvent.data[i].content[0]['3'][j]['3'][k]['1'],
                                    quoteTime: newEvent.data[i].content[0]['3'][j]['3'][k]['2']
                                }
                                levelTwoInsertData.push(levelTwoData)
                            }
                        }
                    }
                }
                await dbLevelTwoDataRepo.insert(levelTwoInsertData)

                
            } */
        }
    });

    /* setTimeout(() => {
        schwabWebsocket.close()
    },23400000) */




}

