import { BackendMethod, remult } from 'remult'
import { getIntraDayHistoryData } from '../../server/polygonApiCalls'
import { DbStockHistoryData } from '../tasks/dbStockHistoryData'





export class PolygonController {

    static getIntraDayData: typeof getIntraDayHistoryData

    @BackendMethod({ allowed: true })
    static async getAccountsNumberCall(stockName: string, date: string): Promise<DbStockHistoryData[]> {
        let data = await PolygonController.getIntraDayData(stockName, date)
        let returnData: DbStockHistoryData[] = []
        if (data.length > 0) {
            for (let j = 0; j < data.length; j++) {
                returnData.push({
                    stockName: stockName,
                    stockPrice: data[j].price,
                    askPrice: data[j].price,
                    bidPrice: data[j].price,
                    volume: data[j].size,
                    time: Math.round(data[j].sip_timestamp / 1000000),
                    date: date
                })
            }
        }
        return returnData
    }
}