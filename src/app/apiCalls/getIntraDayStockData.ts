
import { getIntraDayHistoryData } from "../../server/getIntraDatHistory.js"
import { DbStockHistoryData, dbStockHistoryDataRepo } from "../../shared/tasks/dbStockHistoryData.js"

export const getIntraDayStockData = async () => {


    let stocks: string[] = ['AAPL']


    for (let i = 0; i < stocks.length; i++) {
        const startDate = new Date('2015-07-01');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDate = new Date(startDate);

        while (currentDate <= today) {
            let inputDate = currentDate.toISOString().split('T')[0];

            let stockData = await getIntraDayHistoryData(stocks[i], inputDate)
            if (stockData.length > 0) {
                let insertData: DbStockHistoryData[] = []
                for (let j = 0; j < stockData.length; j++) {
                    insertData.push({
                        stockName: stocks[i],
                        stockPrice: stockData[j].price,
                        askPrice: stockData[j].price,
                        bidPrice: stockData[j].price,
                        volume: stockData[j].size,
                        time: stockData[j].sip_timestamp / 1000000,
                        date: inputDate
                    })
                }
                await dbStockHistoryDataRepo.insert(insertData);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

    }





}