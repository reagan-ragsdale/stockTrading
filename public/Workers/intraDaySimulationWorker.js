
/* self.addEventListener('message', (event) => {
  console.log(event.data);
  self.postMessage('Received message and sent back');
}); */
self.onmessage = (event) => {
  console.log('Here in worker: ', event.data);
  self.postMessage('Message being sent from worker to parent: ' + event.data);
};
/* function runSim(data){
    let listOfProfits = []
    let mapOfLongSmaValues = new Map()
    let mapOfMediumSmaValues = new Map()
    let mapOfShortSmaValues = new Map()
    for (let i = 1; i <= 20; i++) {
      for (let j = 1; j <= 20; j++) {
        for (let k = 1; k <= 30; k++) {
          for (let m = 60; m <= 90; m += 5) {
            if (mapOfLongSmaValues.get(m * 60) === undefined) {
              let listOfLastHourResult = calculateIntraDayLongSmaAllDays(m * 60, stockData)
              mapOfLongSmaValues.set(
                m * 60,
                listOfLastHourResult
              )
            }

            for (let n = 20; n <= 40; n += 5) {
              if (mapOfMediumSmaValues.get(JSON.stringify({ long: m * 60, value: n * 60 })) === undefined) {
                let listOfLastMediumResult = calculateIntraDayMediumSmaAllDays(m * 60, n * 60, stockData)
                mapOfMediumSmaValues.set(
                  JSON.stringify({ long: m * 60, value: n * 60 }),
                  listOfLastMediumResult
                )
              }
              for (let p = 1; p <= 10; p++) {
                if (mapOfShortSmaValues.get(JSON.stringify({ long: m * 60, value: p * 60 })) === undefined) {
                  let listOfLastShortResult = calculateIntraDayShortSmaAllDays(m * 60, p * 60, stockData)
                  mapOfShortSmaValues.set(
                    JSON.stringify({ long: m * 60, value: p * 60 }),
                    listOfLastShortResult
                  )
                }
                let orderLocations = calculateBuyAndSellPointsIntraDayNew(mapOfLongSmaValues.get(m * 60), mapOfMediumSmaValues.get(JSON.stringify({ long: m * 60, value: n * 60 })), mapOfShortSmaValues.get(JSON.stringify({ long: m * 60, value: p * 60 })), Number((i * .001).toPrecision(3)), Number((j * .001).toPrecision(3)), Number((k * .001).toPrecision(3)))
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
      }
      console.log('finished outer loop iteration')
    }
    listOfProfits = listOfProfits.sort((a, b) => b.profit - a.profit).slice(0, 500)
    self.postMessage(listOfProfits)
}

function calculateIntraDayLongSmaAllDays(longValue, selectedStockData) { 
    let returnArray = []
    let windowSum = 0;
    for (let i = 0; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / longValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() });

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - longValue].stockPrice;
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / longValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() });
    }
    return returnArray
  }

  function calculateIntraDayShortSmaAllDays(longValue, shortValue, selectedStockData) {
    let returnArray = []
    let windowSum = 0;
    for (let i = longValue - shortValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / shortValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - shortValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / shortValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  function calculateIntraDayMediumSmaAllDays(longValue, mediumValue, selectedStockData) {
    let returnArray = []
    let windowSum = 0;
    for (let i = longValue - mediumValue; i < longValue; i++) {
      windowSum += selectedStockData[i].stockPrice;
    }
    returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[longValue].stockPrice, avg: (windowSum / mediumValue), date: new Date(selectedStockData[longValue].time).toLocaleTimeString() }); // Push the average of the first window

    for (let i = longValue; i < selectedStockData.length; i++) {
      windowSum += selectedStockData[i].stockPrice - selectedStockData[i - mediumValue].stockPrice; // Add new element, remove old element
      returnArray.push({ stockName: this.selectedStockName, close: selectedStockData[i].stockPrice, avg: (windowSum / mediumValue), date: new Date(selectedStockData[i].time).toLocaleTimeString() }); // Push the new average
    }
    return returnArray
  }
  function calculateBuyAndSellPointsIntraDayNew(longArray, mediumArray, shortArray, buyGutter, sellGutter, checkGutter) {
    let buyOrSell = 'Buy'
    let orderLocations = []
    for (let i = 0; i < shortArray.length; i++) {
      if (buyOrSell == 'Buy' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) < (buyGutter * -1)) && (((shortArray[i].avg - longArray[i].avg) / longArray[i].avg) < checkGutter)) {
        //this.executeOrder(shortArray[i], 'Buy')
        orderLocations.push({ buySell: 'Buy', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Sell'
      }
      else if (buyOrSell == 'Sell' && (((shortArray[i].avg - mediumArray[i].avg) / mediumArray[i].avg) > sellGutter) && shortArray[i].close > orderLocations[orderLocations.length - 1].price) {
        //this.executeOrder(shortArray[i], 'Sell')
        orderLocations.push({ buySell: 'Sell', date: shortArray[i].date, price: shortArray[i].close })
        buyOrSell = 'Buy'
      }


    }
    return orderLocations
  }
  function calculateTotalProfitNew(orderLocations) {
    let returnPofit = 0;
    for (let i = 0; i < orderLocations.length; i++) {
      if (orderLocations[i].buySell == 'Sell') {
        returnPofit += orderLocations[i].price - orderLocations[i - 1].price
      }
    }
    return returnPofit
  }
    */