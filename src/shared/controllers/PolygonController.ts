import { BackendMethod, remult } from 'remult'
import { getIntraDayHistoryData } from '../../server/polygonApiCalls'
import { DbStockHistoryData } from '../tasks/dbStockHistoryData'





export class PolygonController {

    static getIntraDayData: typeof getIntraDayHistoryData

    @BackendMethod({ allowed: true })
    static async getIntraDayDataCall(stockName: string, date: string, exchange: string): Promise<DbStockHistoryData[]> {
        console.log('here in controller')
        let data = await PolygonController.getIntraDayData(stockName, date, exchange)
        let returnData: DbStockHistoryData[] = []
        if (data.length > 0) {
            for (let j = 0; j < data.length; j++) {
                if (returnData.length > 0) {
                    if (returnData[returnData.length - 1].time != (Math.round(data[j].sip_timestamp / 1000000000) * 1000)) {
                        returnData.push({
                            stockName: stockName,
                            stockPrice: data[j].price,
                            askPrice: data[j].price,
                            bidPrice: data[j].price,
                            volume: data[j].size,
                            time: Math.round(data[j].sip_timestamp / 1000000000) * 1000,
                            date: date
                        })
                    }
                }
                else {
                    returnData.push({
                        stockName: stockName,
                        stockPrice: data[j].price,
                        askPrice: data[j].price,
                        bidPrice: data[j].price,
                        volume: data[j].size,
                        time: Math.round(data[j].sip_timestamp / 1000000000) * 1000,
                        date: date
                    })
                }



            }
        }
        return returnData
    }
}