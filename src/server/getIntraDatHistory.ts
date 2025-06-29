
export const getIntraDayHistoryData = async (stockName: string, date: string): Promise<any> => {
    const apiKey = process.env["PolygonApiKey"];
    const url = `https://api.polygon.io/v3/trades/${stockName}?timestamp=${date}&order=asc&limit=50000&sort=timestamp&apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        console.log(response)
        if (response.ok) {
            const result = await response.json();
            return result
        }

    }
    catch (error: any) {
        console.log('getHistoryStockData server: ' + error.message)
        return []
    }
}
