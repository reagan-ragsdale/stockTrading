import { DbStockHistoryData, dbStockHistoryDataRepo } from "../shared/tasks/dbStockHistoryData.js";
type sma200Array = {
    stockName: string;
    close: number;
    avg: number;
    date: string;
  }
  type orderLocation = {
    buySell: string;
    date: string;
    price: number;
  }
let selectedStockData: DbStockHistoryData[] = []
export const runIntraDaySim = async (stockName: string, date: string): Promise<any[]> => {
    selectedStockData = await dbStockHistoryDataRepo.find({where: {stockName: stockName, date: date}, orderBy: {date: 'asc'}})
    let listOfProfits = []
    let mapOfLongSmaValues = new Map<number, sma200Array[]>()
    let mapOfMediumSmaValues = new Map<string, sma200Array[]>()
    let mapOfShortSmaValues = new Map<string, sma200Array[]>()
     for (let i = 1; i <= 20; i++) {
      for (let j = 1; j <= 20; j++) {
        console.time('sell')
        for (let k = 1; k <= 30; k++) {
          for (let m = 60; m <= 90; m += 5) {
            if (mapOfLongSmaValues.get(m * 60) === undefined) {
              let listOfLastHourResult = calculateIntraDayLongSma(m * 60)
              mapOfLongSmaValues.set(
                m * 60,
                listOfLastHourResult
              )
            }
  
            for (let n = 20; n <= 40; n += 5) {
              if (mapOfMediumSmaValues.get(JSON.stringify({ long: m * 60, value: n * 60 })) === undefined) {
                let listOfLastMediumResult = calculateIntraDayMediumSma(m * 60, n * 60)
                mapOfMediumSmaValues.set(
                  JSON.stringify({ long: m * 60, value: n * 60 }),
                  listOfLastMediumResult
                )
              }
              for (let p = 1; p <= 10; p++) {
                if (mapOfShortSmaValues.get(JSON.stringify({ long: m * 60, value: p * 60 })) === undefined) {
                  let listOfLastShortResult = calculateIntraDayShortSma(m * 60, p * 60)
                  mapOfShortSmaValues.set(
                    JSON.stringify({ long: m * 60, value: p * 60 }),
                    listOfLastShortResult
                  )
                }
                let orderLocations = calculateBuyAndSellPointsIntraDayNew(mapOfLongSmaValues.get(m * 60)!, mapOfMediumSmaValues.get(JSON.stringify({ long: m * 60, value: n * 60 }))!, mapOfShortSmaValues.get(JSON.stringify({ long: m * 60, value: p * 60 }))!, Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
                let totalProfit = calculateTotalProfitNew(orderLocations)
  
                listOfProfits.push({
                  buyBuffer: Number((i * .001).toPrecision(3)),
                  sellBuffer: Number((j * .001).toPrecision(3)),
                  checkBuffer: Number((k * .001).toPrecision(3)),
                  smaLong: m * 60,
                  smaMedium: n * 60,
                  smaShort: p * 60,
                  profit: totalProfit,
                  numberOfTrades: orderLocations.length
                })
              }
            }
  
          }
  
        }
        console.timeEnd('sell')
      }
      console.log('finished outer loop iteration')
    }
    listOfProfits = listOfProfits.sort((a,b) => b.profit - a.profit).slice(0,5)
    return listOfProfits

    
      
}

function calculateIntraDayLongSma(longValue: number) { 
    let returnArray = []
    let windowSum = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: selectedStockData[longValue].stockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / longValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() });

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - longValue].stockPrice;
      returnArray.push({ stockName: selectedStockData[i].stockName, close: selectedStockData[i].stockPrice, avg: (windowSum / longValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() });
    }
    return returnArray
  }

  function calculateIntraDayShortSma(longValue: number, shortValue: number) {
    let returnArray = []
    let windowSum = 0;
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: selectedStockData[longValue].stockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / shortValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - shortValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: selectedStockData[i].stockName, close: selectedStockData[i].stockPrice, avg: (windowSum / shortValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  function calculateIntraDayMediumSma(longValue: number, mediumValue: number) {
    let returnArray = []
    let windowSum = 0;
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: selectedStockData[longValue].stockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / mediumValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: selectedStockData[i].stockName, close: selectedStockData[i].stockPrice, avg: (windowSum / mediumValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  function calculateBuyAndSellPointsIntraDayNew(longArray: sma200Array[], mediumArray: sma200Array[], shortArray: sma200Array[], buyGutter: number, sellGutter: number, checkGutter: number) {
    let buyOrSell = 'Buy'
    let orderLocations = []
    for (let i = 0; i < shortArray.length; i++) {
      if (buyOrSell == 'Buy' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
        orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
        orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Buy'
      }


    }
    return orderLocations
  }
  function calculateTotalProfitNew(orderLocations: orderLocation[]) {
    let returnPofit = 0;
    for (let i = 0; i < orderLocations.length; i++) {
      if (orderLocations[i].buySell == 'Sell') {
        returnPofit += orderLocations[i].price - orderLocations[i - 1].price
      }
    }
    return returnPofit
}
