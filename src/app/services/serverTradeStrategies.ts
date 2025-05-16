import { DbCurrentDayStockData } from "../../shared/tasks/dbCurrentDayStockData"
import { DbOrders } from "../../shared/tasks/dbOrders";
import { MovingAvergeCrossoverDto, StockInfo, stockMACrossData, tradeLogDto } from "../Dtos/TradingBotDtos"

type stockStrategyType = MovingAvergeCrossoverDto;
type stockStrategyDataType = stockMACrossData;
export class ServerTradeStrategies {

    private static stockMovingAverageCrossoverMap = new Map<string, MovingAvergeCrossoverDto>()
    private static stockMACrossDataMap = new Map<string, stockMACrossData>()
    private static stockScalpingMap = new Map<string, MovingAvergeCrossoverDto>()
    private static stockInfoMap = new Map<string, StockInfo>()
    private static listOfTradableStocks: string[] = ['AAPL', 'TSLA', 'MSFT', 'AMD', 'PLTR', 'XOM', 'NVO', 'NEE', 'NVDA']
    private static activeStrategies: string[] = ['MACrossover', 'Scalp']
    private static today = new Date()
    private static startTime: number = 0
    private static endTime: number = 0





    static initialize() {
        this.stockMovingAverageCrossoverMap.set('TSLA', { MovingAverageLength: 600, WaitTime: 3600000, TrailingStopAmt: .6 })
        this.stockMovingAverageCrossoverMap.set('AAPL', { MovingAverageLength: 600, WaitTime: 3600000, TrailingStopAmt: .5 })
        this.stockMovingAverageCrossoverMap.set('MSFT', { MovingAverageLength: 600, WaitTime: 3600000, TrailingStopAmt: .6 })
        this.stockMovingAverageCrossoverMap.set('AMD', { MovingAverageLength: 600, WaitTime: 3600000, TrailingStopAmt: .4 })
        this.stockMovingAverageCrossoverMap.set('PLTR', { MovingAverageLength: 600, WaitTime: 3600000, TrailingStopAmt: .4 })
        this.stockMovingAverageCrossoverMap.set('XOM', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .25 })
        this.stockMovingAverageCrossoverMap.set('NVO', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .25 })
        this.stockMovingAverageCrossoverMap.set('NEE', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .25 })
        this.stockMovingAverageCrossoverMap.set('NVDA', { MovingAverageLength: 600, WaitTime: 3600000, TrailingStopAmt: .5 })

        this.stockMACrossDataMap.set('AAPL', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('MSFT', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('PLTR', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('AMD', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('TSLA', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('XOM', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('NVO', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('NEE', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('NVDA', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })

        this.stockScalpingMap.set('TSLA', { MovingAverageLength: 600, WaitTime: 3600000, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('AAPL', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('MSFT', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('AMD', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('PLTR', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('XOM', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('NVO', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('NEE', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })
        this.stockScalpingMap.set('NVDA', { MovingAverageLength: 600, WaitTime: 0, TrailingStopAmt: .6 })

        for (let i = 0; i < this.listOfTradableStocks.length; i++) {
            for (let j = 0; j < this.activeStrategies.length; j++) {
                this.stockInfoMap.set(JSON.stringify({ stockName: this.listOfTradableStocks[i], tradeStrategy: this.activeStrategies[j] }), { canTrade: true, numberOfTrades: 0, stopLoss: 0, stopLossGainThreshold: 0, tradeHigh: 0 })
            }

        }
        this.today.setHours(13, 30, 0, 0)
        this.startTime = this.today.getTime()
        this.today.setHours(19, 59, 50, 0)
        this.endTime = this.today.getTime()
    }


    static shouldExecuteOrder(stockData: DbCurrentDayStockData, strategy: string, lastOrder: DbOrders[]): { shouldTrade: boolean, log: tradeLogDto | null } {
        let stockStrategy = this.stockInfoMap.get(JSON.stringify({ stockName: stockData.stockName, tradeStrategy: strategy }))!
        let stockStrategyInfo: stockStrategyType
        let stockStrategyData: stockStrategyDataType
        switch (strategy) {

            case 'MACrossover':
                stockStrategyInfo = this.stockMovingAverageCrossoverMap.get(stockData.stockName)!
                stockStrategyData = this.stockMACrossDataMap.get(stockData.stockName)!
                return this.shouldExecuteMovingAverageCrossover(stockData, stockStrategy, stockStrategyInfo, stockStrategyData, lastOrder)
            case 'Scalp':
                stockStrategyInfo = this.stockScalpingMap.get(stockData.stockName)!
                stockStrategyData = this.stockMACrossDataMap.get(stockData.stockName)!
                return this.shouldExecuteScalp(stockData, stockStrategy, stockStrategyInfo, stockStrategyData, lastOrder)
            default:
                return { shouldTrade: false, log: null }
        }


    }
    private static shouldExecuteMovingAverageCrossover(stockData: DbCurrentDayStockData, stockInfo: StockInfo, stockStrategyInfo: MovingAvergeCrossoverDto, stockStrategyData: stockStrategyDataType, lastOrder: DbOrders[]): { shouldTrade: boolean, log: tradeLogDto | null } {

        stockStrategyData.priceHistory.push(stockData.stockPrice)
        stockStrategyData.volumeHistory.push(stockData.volume)
        stockStrategyData.cumulativePV += (stockData.stockPrice * stockData.volume)
        stockStrategyData.cumulativeV += stockData.volume
        stockStrategyData.lastPrice = stockData.stockPrice
        stockStrategyData.lastAsk = stockData.askPrice
        stockStrategyData.lastBid = stockData.bidPrice
        const multiplyer = 2 / (stockStrategyInfo.MovingAverageLength + 1)
        //if the length of the history is equal to what the long moving average length is then set the moving averages
        if (stockStrategyData.priceHistory.length == stockStrategyInfo.MovingAverageLength) {
            stockStrategyData.EMA = stockStrategyData.priceHistory.reduce((sum, val) => sum + val, 0) / stockStrategyInfo.MovingAverageLength
            stockStrategyData.VWAP = 10000000
        }
        //else if its greater than then we do a revolving door first in first out and recalculate the moving averages
        else if (stockStrategyData.priceHistory.length > stockStrategyInfo.MovingAverageLength) {
            stockStrategyData.EMA = (stockData.stockPrice * multiplyer) + (stockStrategyData.EMA * (1 - multiplyer))
            stockStrategyData.VWAP = stockStrategyData.cumulativePV / stockStrategyData.cumulativeV
        }

        let nonTradeLog: tradeLogDto | null = null
        let isBuy = true;
        if (lastOrder.length > 0) {
            isBuy = lastOrder[0].orderType == 'Sell' ? true : false;
        }
        if (stockInfo.numberOfTrades == 0 && stockStrategyInfo.WaitTime > 0) {
            if (stockData.time < (this.startTime + stockStrategyInfo.WaitTime)) {
                stockInfo.canTrade = false
            }
            else {
                stockInfo.canTrade = true
                nonTradeLog ??= {
                    stockName: stockData.stockName,
                    strategy: 'MACrossover',
                    tradingAmount: 0,
                    orderId: 0,
                    shares: 0,
                    dayTradeValues: structuredClone(stockStrategyInfo),
                    stockInfo: structuredClone(stockInfo),
                    stockDataInfo: structuredClone(stockStrategyData),
                    logType: '',
                    time: stockData.time,
                }
                nonTradeLog.logType += 'Stock Free To Trade After Initial Wait Time - '
            }
        }
        if (stockInfo.numberOfTrades > 0 && stockInfo.canTrade == false) {
            if ((Date.now() - lastOrder[0].orderTime) > 1800000) {
                stockInfo.canTrade = true
                nonTradeLog ??= {
                    stockName: stockData.stockName,
                    strategy: 'MACrossover',
                    tradingAmount: 0,
                    orderId: 0,
                    shares: 0,
                    dayTradeValues: structuredClone(stockStrategyInfo),
                    stockInfo: structuredClone(stockInfo),
                    stockDataInfo: structuredClone(stockStrategyData),
                    logType: '',
                    time: stockData.time,
                }
                nonTradeLog.logType += 'Stock Free To Trade After Stop Loss Timeout - '
            }
        }

        if (isBuy && stockInfo.canTrade) {
            if (stockStrategyData.EMA > stockStrategyData.VWAP) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = stockData.askPrice * (1 - .002)
                stockInfo.tradeHigh = stockData.askPrice
                stockInfo.stopLossGainThreshold = 0
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'MACrossover',
                        tradingAmount: 0,
                        orderId: 0,
                        shares: 0,
                        dayTradeValues: structuredClone(stockStrategyInfo),
                        stockInfo: structuredClone(stockInfo),
                        stockDataInfo: structuredClone(stockStrategyData),
                        logType: 'Buy',
                        time: stockData.time,
                    }
                }
            }
        }
        else if (!isBuy && stockInfo.canTrade) {
            if (stockData.bidPrice > stockInfo.tradeHigh) {
                stockInfo.tradeHigh = stockData.bidPrice
                nonTradeLog ??= {
                    stockName: stockData.stockName,
                    strategy: 'MACrossover',
                    tradingAmount: 0,
                    orderId: lastOrder[0].orderId,
                    shares: 0,
                    dayTradeValues: structuredClone(stockStrategyInfo),
                    stockInfo: structuredClone(stockInfo),
                    stockDataInfo: structuredClone(stockStrategyData),
                    logType: '',
                    time: stockData.time,
                }
                nonTradeLog.logType += 'Increased Trade High - '
            }
            if (stockInfo.tradeHigh > (lastOrder[0].stockPrice + stockStrategyInfo.TrailingStopAmt)) {
                stockInfo.stopLossGainThreshold = stockInfo.tradeHigh - stockStrategyInfo.TrailingStopAmt
                nonTradeLog ??= {
                    stockName: stockData.stockName,
                    strategy: 'MACrossover',
                    tradingAmount: 0,
                    orderId: lastOrder[0].orderId,
                    shares: 0,
                    dayTradeValues: structuredClone(stockStrategyInfo),
                    stockInfo: structuredClone(stockInfo),
                    stockDataInfo: structuredClone(stockStrategyData),
                    logType: '',
                    time: stockData.time,
                }
                nonTradeLog.logType += 'Increased Trailing Stop - '
            }

            if (stockStrategyData.EMA < stockStrategyData.VWAP) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = 0
                stockInfo.tradeHigh = 0
                stockInfo.stopLossGainThreshold = 0
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'MACrossover',
                        tradingAmount: 0,
                        orderId: lastOrder[0].orderId,
                        shares: 0,
                        dayTradeValues: structuredClone(stockStrategyInfo),
                        stockInfo: structuredClone(stockInfo),
                        stockDataInfo: structuredClone(stockStrategyData),
                        logType: 'Sell',
                        time: stockData.time,
                    }
                }
            }

            if (stockData.bidPrice <= stockInfo.stopLossGainThreshold) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = 0
                stockInfo.tradeHigh = 0
                stockInfo.stopLossGainThreshold = 0
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'MACrossover',
                        tradingAmount: 0,
                        orderId: lastOrder[0].orderId,
                        shares: 0,
                        dayTradeValues: structuredClone(stockStrategyInfo),
                        stockInfo: structuredClone(stockInfo),
                        stockDataInfo: structuredClone(stockStrategyData),
                        logType: 'Trailing Stop Sell',
                        time: stockData.time,
                    }
                }
            }
            if (stockData.bidPrice <= stockInfo.stopLoss) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = 0
                stockInfo.tradeHigh = 0
                stockInfo.stopLossGainThreshold = 0
                stockInfo.canTrade = false
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'MACrossover',
                        tradingAmount: 0,
                        orderId: lastOrder[0].orderId,
                        shares: 0,
                        dayTradeValues: structuredClone(stockStrategyInfo),
                        stockInfo: structuredClone(stockInfo),
                        stockDataInfo: structuredClone(stockStrategyData),
                        logType: 'Stop Loss Sell',
                        time: stockData.time,
                    }
                }
            }
            if (stockData.time > this.endTime) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = 0
                stockInfo.tradeHigh = 0
                stockInfo.stopLossGainThreshold = 0
                stockInfo.canTrade = false
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'MACrossover',
                        tradingAmount: 0,
                        orderId: lastOrder[0].orderId,
                        shares: 0,
                        dayTradeValues: structuredClone(stockStrategyInfo),
                        stockInfo: structuredClone(stockInfo),
                        stockDataInfo: structuredClone(stockStrategyData),
                        logType: 'End Of Day Sell',
                        time: stockData.time,
                    }
                }
            }
        }
        return { shouldTrade: false, log: nonTradeLog }
    }
    private static shouldExecuteScalp(stockData: DbCurrentDayStockData, stockInfo: StockInfo, stockStrategyInfo: stockStrategyType, stockStrategyData: stockStrategyDataType, lastOrder: DbOrders[]): { shouldTrade: boolean, log: tradeLogDto | null } {

        return { shouldTrade: false, log: null }
    }
}