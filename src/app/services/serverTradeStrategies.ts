import { DbCurrentDayStockData } from "../../shared/tasks/dbCurrentDayStockData"
import { DbOrders } from "../../shared/tasks/dbOrders";
import { DayTradeValues, MovingAvergeCrossoverDto, stockDataInfo, StockInfo, stockMACrossData, stockVWAPCrossData, tradeLogDto, VWAPTrendCrossDto } from "../Dtos/TradingBotDtos"

type stockStrategyType = DayTradeValues;
type stockStrategyDataType = stockDataInfo;
export class ServerTradeStrategies {

    private static stockMovingAverageCrossoverMap = new Map<string, MovingAvergeCrossoverDto>()
    private static stockMACrossDataMap = new Map<string, stockMACrossData>()
    private static VWAPTrendMap = new Map<string, VWAPTrendCrossDto>()
    private static stockVWAPDataMap = new Map<string, stockVWAPCrossData>()
    private static stockInfoMap = new Map<string, StockInfo>()
    private static listOfTradableStocks: string[] = ['AAPL', 'TSLA', 'MSFT', 'AMD', 'PLTR', 'XOM', 'NVO', 'NEE', 'NVDA']
    private static activeStrategies: string[] = ['MACrossover', 'VWAP Trend']
    private static today = new Date()
    private static startTime: number = 0
    private static endTime: number = 0



    ////
    /////
    ////
    ////
    //Buy when respective ema moves above the cumulative vwap and sell when ema moves belwo the 1800 rolling vwap
    //
    ////
    /////
    ////


    static initialize() {
        this.stockMovingAverageCrossoverMap.set('TSLA', { MovingAverageLength: 900, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .6, StopLossAmt: 0.002 })
        this.stockMovingAverageCrossoverMap.set('AAPL', { MovingAverageLength: 300, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .5, StopLossAmt: 0.002 })
        this.stockMovingAverageCrossoverMap.set('MSFT', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .6, StopLossAmt: 0.002 })
        this.stockMovingAverageCrossoverMap.set('AMD', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .4, StopLossAmt: 0.003 })
        this.stockMovingAverageCrossoverMap.set('PLTR', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .4, StopLossAmt: 0.003 })
        this.stockMovingAverageCrossoverMap.set('XOM', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .25, StopLossAmt: 0.003 })
        this.stockMovingAverageCrossoverMap.set('NVO', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .25, StopLossAmt: 0.003 })
        this.stockMovingAverageCrossoverMap.set('NEE', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .25, StopLossAmt: 0.003 })
        this.stockMovingAverageCrossoverMap.set('NVDA', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .5, StopLossAmt: 0.003 })

        this.stockMACrossDataMap.set('AAPL', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('MSFT', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('PLTR', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('AMD', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('TSLA', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('XOM', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('NVO', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('NEE', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockMACrossDataMap.set('NVDA', { priceHistory: [], volumeHistory: [], EMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })

        this.VWAPTrendMap.set('TSLA', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('AAPL', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('MSFT', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('AMD', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('PLTR', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('XOM', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('NVO', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('NEE', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })
        this.VWAPTrendMap.set('NVDA', { RollingVWAPLength: 1800, VWAPTrendLength: 120, WaitTime: 3600000, StopLossAmt: .002 })

        this.stockVWAPDataMap.set('AAPL', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('MSFT', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('PLTR', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('AMD', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('TSLA', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('XOM', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('NVO', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('NEE', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.stockVWAPDataMap.set('NVDA', { priceHistory: [], volumeHistory: [], CumulativeVWAP: 0, RollingVWAP: 0, RollingVWAPTrend: 0, RollingVWAPTrendData: [], cumulativePV: 0, rollingPV: 0, cumulativeV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })

        for (let i = 0; i < this.listOfTradableStocks.length; i++) {
            for (let j = 0; j < this.activeStrategies.length; j++) {
                this.stockInfoMap.set(JSON.stringify({ stockName: this.listOfTradableStocks[i], tradeStrategy: this.activeStrategies[j] }), { canTrade: true, numberOfTrades: 0, stopLoss: 0, stopLossGainThreshold: 0, tradeHigh: 0 })
            }

        }
        this.today.setHours(13, 30, 0, 0)
        this.startTime = this.today.getTime()
        this.today.setHours(19, 59, 50, 0)
        this.endTime = this.today.getTime()
        console.log(this.startTime)
        console.log(this.endTime)
    }


    static shouldExecuteOrder(stockData: DbCurrentDayStockData, strategy: string, lastOrder: DbOrders[]): { shouldTrade: boolean, log: tradeLogDto | null } {
        let stockStrategy = this.stockInfoMap.get(JSON.stringify({ stockName: stockData.stockName, tradeStrategy: strategy }))!
        let stockStrategyInfo: stockStrategyType
        let stockStrategyData: stockStrategyDataType
        switch (strategy) {

            case 'MACrossover':
                stockStrategyInfo = this.stockMovingAverageCrossoverMap.get(stockData.stockName)!
                stockStrategyData = this.stockMACrossDataMap.get(stockData.stockName)!
                return this.shouldExecuteMovingAverageCrossover(stockData, stockStrategy, stockStrategyInfo as MovingAvergeCrossoverDto, stockStrategyData, lastOrder)
            case 'VWAP Trend':
                stockStrategyInfo = this.VWAPTrendMap.get(stockData.stockName)!
                stockStrategyData = this.stockVWAPDataMap.get(stockData.stockName)!
                return this.shouldExecuteVWAPTrend(stockData, stockStrategy, stockStrategyInfo as VWAPTrendCrossDto, stockStrategyData as stockVWAPCrossData, lastOrder)
            default:
                return { shouldTrade: false, log: null }
        }


    }
    private static shouldExecuteMovingAverageCrossover(stockData: DbCurrentDayStockData, stockInfo: StockInfo, stockStrategyInfo: MovingAvergeCrossoverDto, stockStrategyData: stockMACrossData, lastOrder: DbOrders[]): { shouldTrade: boolean, log: tradeLogDto | null } {

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
        if (stockStrategyData.priceHistory.length == stockStrategyInfo.RollingVWAPLength) {
            stockStrategyData.RollingVWAP = stockStrategyData.cumulativePV / stockStrategyData.cumulativeV
        }
        else if (stockStrategyData.priceHistory.length > stockStrategyInfo.RollingVWAPLength) {
            let tempCumulativePV = stockStrategyData.cumulativePV - (stockStrategyData.priceHistory[stockStrategyData.priceHistory.length - stockStrategyInfo.RollingVWAPLength] * stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength])
            let tempCumulativeV = stockStrategyData.cumulativeV - stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength]
            stockStrategyData.RollingVWAP = tempCumulativePV / tempCumulativeV
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
                stockInfo.stopLoss = stockData.askPrice * (1 - stockStrategyInfo.TrailingStopAmt)
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
            /* if (stockInfo.tradeHigh > (lastOrder[0].stockPrice + stockStrategyInfo.TrailingStopAmt)) {
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
            } */

            if (stockStrategyData.EMA < stockStrategyData.RollingVWAP) {
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

            /* if (stockData.bidPrice <= stockInfo.stopLossGainThreshold) {
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
            } */
            else if (stockData.bidPrice <= stockInfo.stopLoss) {
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
            else if (stockData.time > this.endTime) {
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

    //cheange to vwap trend
    //buy when the 1800 rolling vwap dips below the cumulative vwap by .002
    //and when the rolling wap last 120 ticks trend turns positive
    //sell when the rolling 1200 vwap is grater than the cumulative vwap
    private static shouldExecuteVWAPTrend(stockData: DbCurrentDayStockData, stockInfo: StockInfo, stockStrategyInfo: VWAPTrendCrossDto, stockStrategyData: stockVWAPCrossData, lastOrder: DbOrders[]): { shouldTrade: boolean, log: tradeLogDto | null } {

        stockStrategyData.priceHistory.push(stockData.stockPrice)
        stockStrategyData.volumeHistory.push(stockData.volume)
        stockStrategyData.cumulativePV += (stockData.stockPrice * stockData.volume)
        stockStrategyData.cumulativeV += stockData.volume
        stockStrategyData.lastPrice = stockData.stockPrice
        stockStrategyData.lastAsk = stockData.askPrice
        stockStrategyData.lastBid = stockData.bidPrice

        if (stockStrategyData.priceHistory.length < stockStrategyInfo.RollingVWAPLength) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume)
            stockStrategyData.rollingV += stockData.volume
        }
        else if (stockStrategyData.priceHistory.length == stockStrategyInfo.RollingVWAPLength) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume)
            stockStrategyData.rollingV += stockData.volume
            stockStrategyData.RollingVWAP = stockStrategyData.rollingPV / stockStrategyData.rollingV
            stockStrategyData.CumulativeVWAP = stockStrategyData.cumulativePV / stockStrategyData.cumulativeV
            stockStrategyData.RollingVWAPTrendData.push(stockStrategyData.RollingVWAP)
        }
        else if (stockStrategyData.priceHistory.length > stockStrategyInfo.RollingVWAPLength && stockStrategyData.priceHistory.length < stockStrategyInfo.RollingVWAPLength + stockStrategyInfo.VWAPTrendLength) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume) - (stockStrategyData.priceHistory[stockStrategyData.priceHistory.length - stockStrategyInfo.RollingVWAPLength] * stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength])
            stockStrategyData.rollingV += stockData.volume - stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength]
            stockStrategyData.RollingVWAP = stockStrategyData.rollingPV / stockStrategyData.rollingV
            stockStrategyData.CumulativeVWAP = stockStrategyData.cumulativePV / stockStrategyData.cumulativeV

            stockStrategyData.RollingVWAPTrendData.push(stockStrategyData.RollingVWAP)
            //stockStrategyData.RollingVWAPTrend = (stockStrategyData.RollingVWAPTrendData[stockStrategyData.RollingVWAPTrendData.length - 1] - stockStrategyData.RollingVWAPTrendData[0]) / stockStrategyInfo.VWAPTrendLength
        }
        else if (stockStrategyData.priceHistory.length == stockStrategyInfo.RollingVWAPLength + stockStrategyInfo.VWAPTrendLength) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume) - (stockStrategyData.priceHistory[stockStrategyData.priceHistory.length - stockStrategyInfo.RollingVWAPLength] * stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength])
            stockStrategyData.rollingV += stockData.volume - stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength]
            stockStrategyData.RollingVWAP = stockStrategyData.rollingPV / stockStrategyData.rollingV
            stockStrategyData.CumulativeVWAP = stockStrategyData.cumulativePV / stockStrategyData.cumulativeV

            stockStrategyData.RollingVWAPTrendData.push(stockStrategyData.RollingVWAP)
            stockStrategyData.RollingVWAPTrend = (stockStrategyData.RollingVWAPTrendData[stockStrategyData.RollingVWAPTrendData.length - 1] - stockStrategyData.RollingVWAPTrendData[0]) / stockStrategyInfo.VWAPTrendLength
        }
        else if (stockStrategyData.priceHistory.length > stockStrategyInfo.RollingVWAPLength + stockStrategyInfo.VWAPTrendLength) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume) - (stockStrategyData.priceHistory[stockStrategyData.priceHistory.length - stockStrategyInfo.RollingVWAPLength] * stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength])
            stockStrategyData.rollingV += stockData.volume - stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength]
            stockStrategyData.RollingVWAP = stockStrategyData.rollingPV / stockStrategyData.rollingV
            stockStrategyData.CumulativeVWAP = stockStrategyData.cumulativePV / stockStrategyData.cumulativeV
            stockStrategyData.RollingVWAPTrendData.shift()
            stockStrategyData.RollingVWAPTrendData.push(stockStrategyData.RollingVWAP)
            stockStrategyData.RollingVWAPTrend = (stockStrategyData.RollingVWAPTrendData[stockStrategyData.RollingVWAPTrendData.length - 1] - stockStrategyData.RollingVWAPTrendData[0]) / stockStrategyInfo.VWAPTrendLength
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
                    strategy: 'VWAP Trend',
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
                    strategy: 'VWAP Trend',
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
            if ((((stockStrategyData.RollingVWAP - stockStrategyData.CumulativeVWAP) / stockStrategyData.CumulativeVWAP) < -.002) && stockStrategyData.RollingVWAPTrend > 0) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = stockData.askPrice * (1 - stockStrategyInfo.StopLossAmt)
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'VWAP Trend',
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

            if ((stockStrategyData.RollingVWAP > stockStrategyData.CumulativeVWAP) && stockStrategyData.RollingVWAPTrend < 0) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = 0
                stockInfo.tradeHigh = 0
                stockInfo.stopLossGainThreshold = 0
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'VWAP Trend',
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

            else if (stockData.bidPrice <= stockInfo.stopLoss) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = 0
                stockInfo.tradeHigh = 0
                stockInfo.stopLossGainThreshold = 0
                stockInfo.canTrade = false
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'VWAP Trend',
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
            else if (stockData.time > this.endTime) {
                stockInfo.numberOfTrades++
                stockInfo.stopLoss = 0
                stockInfo.tradeHigh = 0
                stockInfo.stopLossGainThreshold = 0
                stockInfo.canTrade = false
                return {
                    shouldTrade: true, log: {
                        stockName: stockData.stockName,
                        strategy: 'VWAP Trend',
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
}