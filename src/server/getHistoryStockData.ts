import { Buffer } from 'node:buffer'
import { AuthController } from '../shared/controllers/AuthController.js'
import { URLSearchParams } from 'node:url';
import { dbTokenRepo, DbTOkens } from '../shared/tasks/dbTokens.js';
import { DbStockBasicHistory } from '../shared/tasks/dbStockBasicHistory.js';
export const getHistoryStockData = async (stockName: string, time: number): Promise<any[]> => {
    console.log('here in before fetch')
    const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens
    const url = `https://api.schwabapi.com/marketdata/v1/priceHistory?symbol=${stockName}&periodType=month&period=1&frequencyType=daily&frequency=1&startDate=${time}&needExtendedHoursData=false&needPreviousClose=true`;
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userData.accessToken}`
      }
    };
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      return result
    }
    catch (error: any) {
      console.log(error.message)
      return []
    }
}

