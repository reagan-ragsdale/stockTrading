

export const getIntraDayHistoryData = async (stockName: string, date: string): Promise<any> => {
    const apiKey = process.env["PolygonApiKey"];
    console.log('hererere')
    const url = `https://api.polygon.io/v3/trades/${stockName}?timestamp=${date}&order=asc&limit=50000&sort=timestamp&apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const result = await response.json();
            console.log(result)
            return result.results
        }
        else {
            console.log(response)
            return []
        }

    }
    catch (error: any) {
        console.log('getHistoryStockData server: ' + error.message)
        return []
    }
}

export const getAllTickers = async (symbol?: string): Promise<any> => {
    const apiKey = process.env["PolygonApiKey"];
    let url = ''
    if (symbol) {
        console.log('here 1')
        url = `https://api.polygon.io/v3/reference/tickers?ticker.gt=${symbol}&type=CS&market=stocks&exchange=XNAS&active=true&order=asc&limit=1000&sort=ticker&apiKey=${apiKey}`
    }
    else {
        console.log('here 2')
        url = `https://api.polygon.io/v3/reference/tickers?type=CS&market=stocks&active=true&order=asc&limit=1000&sort=ticker&apiKey=${apiKey}`;
    }
    try {
        const response = await fetch(url);
        if (response.ok) {
            const result = await response.json();
            return result.results
        }
        else {
            console.log(response)
            return []
        }

    }
    catch (error: any) {
        console.log('getHistoryStockData server: ' + error.message)
        return []
    }
}