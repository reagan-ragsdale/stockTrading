import { AuthController } from "../shared/controllers/AuthController.js"
import { StockHistoryController } from "../shared/controllers/StockHistoryController.js"
import { dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
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
    const aaplDataMsg = {
        //add the level 2 data to this
        "requests": [
            {
                "service": "LEVELONE_EQUITIES",
                "requestid": "1",
                "command": "SUBS",
                "SchwabClientCustomerId": userData.schwabClientCustomerId,
                "SchwabClientCorrelId": userData.schwabClientCorrelId,
                "parameters": {
                    "keys": "AAPL",
                    "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
                }
            }/* ,
          {
            "service": "NYSE_BOOK",
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
        console.log(newEvent.response[0].content)

        if (Object.hasOwn(newEvent, 'response')) {
            if (newEvent.response[0].requestid == 0 && hasBeenSent == false) {
                schwabWebsocket.send(JSON.stringify(aaplDataMsg))
                console.log('send aapl')
                hasBeenSent = true
            }
        }
        if (Object.hasOwn(newEvent, 'data') && hasBeenSent == true) {
            if (Object.hasOwn(newEvent.data[0].content[0], '3')) {
                await dbCurrentDayStockDataRepo.insert({ stockName: newEvent.data[0].content[0].key, stockPrice: newEvent.data[0].content[0]['3'], time: Number(newEvent.data[0].timestamp) })
            }

        }
    });

      
      

}

