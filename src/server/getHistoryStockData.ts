import { dbTokenRepo, DbTOkens } from '../shared/tasks/dbTokens.js';
export const getHistoryStockData = async (stockName: string, time: number): Promise<any> => {
  const userData = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens
  const url = `https://api.schwabapi.com/marketdata/v1/pricehistory?symbol=${stockName}&periodType=month&period=1&frequencyType=daily&frequency=1&startDate=${time}&needExtendedHoursData=false&needPreviousClose=false`;
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userData.accessToken}`
    }
  };
  try {
    const response = await fetch(url, options);
    console.log(response)
    const result = await response.json();
    return result
  }
  catch (error: any) {
    console.log('getHistoryStockData server: ' + error.message)
    return []
  }
}

