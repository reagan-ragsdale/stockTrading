import { DbCurrentDayStockData } from "../../shared/tasks/dbCurrentDayStockData"
import { DbSchwabOrders } from "../../shared/tasks/dbSchwabOrders";
import { DayTradeValues, MADropData, MADropDto, MovingAvergeCrossoverDto, stockDataInfo, StockInfo, stockMACrossData, stockVWAPCrossData, tradeLogDto, VWAPTrendCrossDto } from "../Dtos/TradingBotDtos"

type stockStrategyType = DayTradeValues;
type stockStrategyDataType = stockDataInfo;
export class ServerTradeStrategies {

    private static stockMovingAverageCrossoverMap = new Map<string, MovingAvergeCrossoverDto>()
    private static stockMACrossDataMap = new Map<string, stockMACrossData>()
    private static VWAPTrendMap = new Map<string, VWAPTrendCrossDto>()
    private static stockVWAPDataMap = new Map<string, stockVWAPCrossData>()
    private static MADropMap = new Map<string, MADropDto>()
    private static MADropDataMap = new Map<string, MADropData>()
    private static stockInfoMap = new Map<string, StockInfo>()
    private static listOfTradableStocks: string[] = ['AAPL', 'TSLA', 'PLTR']
    private static activeStrategies: string[] = ['MA Drop']
    private static startTime: number = 0
    private static endTime: number = 0




    static initialize() {
        /*  this.stockMovingAverageCrossoverMap.set('TSLA', { MovingAverageLength: 900, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .6, StopLossAmt: 0.002 })
         this.stockMovingAverageCrossoverMap.set('AAPL', { MovingAverageLength: 300, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .5, StopLossAmt: 0.002 })
         this.stockMovingAverageCrossoverMap.set('MSFT', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .6, StopLossAmt: 0.002 })
         this.stockMovingAverageCrossoverMap.set('AMD', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .4, StopLossAmt: 0.003 })
         this.stockMovingAverageCrossoverMap.set('PLTR', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .4, StopLossAmt: 0.003 })
         this.stockMovingAverageCrossoverMap.set('XOM', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .25, StopLossAmt: 0.003 })
         this.stockMovingAverageCrossoverMap.set('NVO', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .25, StopLossAmt: 0.003 })
         this.stockMovingAverageCrossoverMap.set('NEE', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 1800000, TrailingStopAmt: .25, StopLossAmt: 0.003 })
         this.stockMovingAverageCrossoverMap.set('NVDA', { MovingAverageLength: 600, RollingVWAPLength: 1800, WaitTime: 3600000, TrailingStopAmt: .5, StopLossAmt: 0.003 })
 
         this.stockMACrossDataMap.set('AAPL', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('MSFT', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('PLTR', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('AMD', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('TSLA', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('XOM', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('NVO', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('NEE', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
         this.stockMACrossDataMap.set('NVDA', { priceHistory: [], volumeHistory: [], EMA: 0, PreviousEMA: 0, VWAP: 0, RollingVWAP: 0, cumulativePV: 0, cumulativeV: 0, rollingPV: 0, rollingV: 0, lastPrice: 0, lastAsk: 0, lastBid: 0 })
 
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
  */

        this.MADropMap.set('TSLA', { EMALength: 450, BuyTrendLength: 20, SellTrendLength: 110, BuyDipAmt: 0.002, SellDipAmt: 0.004, WaitTime: 3600000, StopLossAmt: .003 })
        this.MADropMap.set('AAPL', { EMALength: 750, BuyTrendLength: 30, SellTrendLength: 130, BuyDipAmt: 0.004, SellDipAmt: 0.003, WaitTime: 1800000, StopLossAmt: .003 })
        //this.MADropMap.set('MSFT', { EMALength: 0, BuyTrendLength: 0, SellTrendLength: 0, BuyDipAmt: 0, SellDipAmt: 0, WaitTime: 1800000, StopLossAmt: .003 })
        //this.MADropMap.set('AMD', { EMALength: 0, BuyTrendLength: 0, SellTrendLength: 0, BuyDipAmt: 0, SellDipAmt: 0, WaitTime: 1800000, StopLossAmt: .003 })
        this.MADropMap.set('PLTR', { EMALength: 700, BuyTrendLength: 90, SellTrendLength: 180, BuyDipAmt: 0.005, SellDipAmt: 0.004, WaitTime: 1800000, StopLossAmt: .003 })
        //this.MADropMap.set('XOM', { EMALength: 0, BuyTrendLength: 0, SellTrendLength: 0, BuyDipAmt: 0, SellDipAmt: 0, WaitTime: 1800000, StopLossAmt: .003 })
        //this.MADropMap.set('NVO', { EMALength: 0, BuyTrendLength: 0, SellTrendLength: 0, BuyDipAmt: 0, SellDipAmt: 0, WaitTime: 1800000, StopLossAmt: .003 })
        //this.MADropMap.set('NEE', { EMALength: 0, BuyTrendLength: 0, SellTrendLength: 0, BuyDipAmt: 0, SellDipAmt: 0, WaitTime: 1800000, StopLossAmt: .003 })
        //this.MADropMap.set('NVDA', { EMALength: 0, BuyTrendLength: 0, SellTrendLength: 0, BuyDipAmt: 0, SellDipAmt: 0, WaitTime: 1800000, StopLossAmt: .003 })

        this.MADropDataMap.set('AAPL', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        //this.MADropDataMap.set('MSFT', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.MADropDataMap.set('PLTR', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        //this.MADropDataMap.set('AMD', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        this.MADropDataMap.set('TSLA', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        //this.MADropDataMap.set('XOM', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        //this.MADropDataMap.set('NVO', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        //this.MADropDataMap.set('NEE', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })
        //this.MADropDataMap.set('NVDA', { priceHistory: [], EMA: 0, CumulativePrice: 0, CumulativeSMA: 0, BuyTrend: 0, BuyTrendData: [], SellTrend: 0, SellTrendData: [], lastPrice: 0, lastAsk: 0, lastBid: 0 })

        for (let i = 0; i < this.listOfTradableStocks.length; i++) {
            for (let j = 0; j < this.activeStrategies.length; j++) {
                this.stockInfoMap.set(JSON.stringify({ stockName: this.listOfTradableStocks[i], tradeStrategy: this.activeStrategies[j] }), { canTrade: true, numberOfTrades: 0, stopLoss: 0, stopLossGainThreshold: 0, tradeHigh: 0, numberOfLosses: 0 })
            }

        }
        let today = new Date()
        today.setHours(13, 30, 0, 0)
        this.startTime = today.getTime()
        today.setHours(19, 59, 50, 0)
        this.endTime = today.getTime()
        console.log(this.startTime)
        console.log(this.endTime)
    }


    static shouldExecuteOrder(stockData: DbCurrentDayStockData, strategy: string, lastOrder: DbSchwabOrders[], isBuy: boolean, balance: number): { shouldTrade: boolean, tradeType?: string, log: tradeLogDto | null } {
        let stockStrategy = this.stockInfoMap.get(JSON.stringify({ stockName: stockData.stockName, tradeStrategy: strategy }))!
        switch (strategy) {
            case 'MACrossover':
                return this.shouldExecuteMovingAverageCrossover(stockData, stockStrategy, this.stockMovingAverageCrossoverMap.get(stockData.stockName)!, this.stockMACrossDataMap.get(stockData.stockName)!, lastOrder)
            case 'VWAP Trend':
                return this.shouldExecuteVWAPTrend(stockData, stockStrategy, this.VWAPTrendMap.get(stockData.stockName)!, this.stockVWAPDataMap.get(stockData.stockName)!, lastOrder)
            case 'MA Drop':
                return this.shouldExecuteMADrop(stockData, stockStrategy, this.MADropMap.get(stockData.stockName)!, this.MADropDataMap.get(stockData.stockName)!, lastOrder, isBuy, balance)
            default:
                return { shouldTrade: false, log: null }
        }


    }
    private static shouldExecuteMovingAverageCrossover(stockData: DbCurrentDayStockData, stockInfo: StockInfo, stockStrategyInfo: MovingAvergeCrossoverDto, stockStrategyData: stockMACrossData, lastOrder: DbSchwabOrders[]): { shouldTrade: boolean, tradeType?: string, log: tradeLogDto | null } {

        stockStrategyData.priceHistory.push(stockData.stockPrice)
        stockStrategyData.volumeHistory.push(stockData.volume)
        stockStrategyData.cumulativePV += (stockData.stockPrice * stockData.volume)
        stockStrategyData.cumulativeV += stockData.volume
        stockStrategyData.lastPrice = stockData.stockPrice
        stockStrategyData.lastAsk = stockData.askPrice
        stockStrategyData.lastBid = stockData.bidPrice
        const multiplyer = 2 / (stockStrategyInfo.MovingAverageLength + 1)

        let nonTradeLog: tradeLogDto | null = null

        //if the length of the history is equal to what the long moving average length is then set the moving averages
        if (stockStrategyData.priceHistory.length == stockStrategyInfo.MovingAverageLength - 1) {
            stockStrategyData.EMA = stockStrategyData.priceHistory.reduce((sum, val) => sum + val, 0) / stockStrategyInfo.MovingAverageLength
        }
        //else if its greater than then we do a revolving door first in first out and recalculate the moving averages
        else if (stockStrategyData.priceHistory.length > stockStrategyInfo.MovingAverageLength - 1) {
            stockStrategyData.PreviousEMA = stockStrategyData.EMA
            stockStrategyData.EMA = (stockData.stockPrice * multiplyer) + (stockStrategyData.EMA * (1 - multiplyer))
            stockStrategyData.VWAP = stockStrategyData.cumulativePV / stockStrategyData.cumulativeV
        }
        if (stockStrategyData.priceHistory.length < stockStrategyInfo.RollingVWAPLength - 1) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume)
            stockStrategyData.rollingV += stockData.volume
        }
        else if (stockStrategyData.priceHistory.length == stockStrategyInfo.RollingVWAPLength - 1) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume)
            stockStrategyData.rollingV += stockData.volume
            stockStrategyData.RollingVWAP = stockStrategyData.rollingPV / stockStrategyData.rollingV
        }
        else if (stockStrategyData.priceHistory.length > stockStrategyInfo.RollingVWAPLength - 1) {
            stockStrategyData.rollingPV += (stockData.stockPrice * stockData.volume) - (stockStrategyData.priceHistory[stockStrategyData.priceHistory.length - stockStrategyInfo.RollingVWAPLength] * stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength])
            stockStrategyData.rollingV += stockData.volume - stockStrategyData.volumeHistory[stockStrategyData.volumeHistory.length - stockStrategyInfo.RollingVWAPLength]
            stockStrategyData.RollingVWAP = stockStrategyData.rollingPV / stockStrategyData.rollingV


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

            if (isBuy && stockInfo.canTrade && stockInfo.numberOfLosses < 2) {
                if ((stockStrategyData.EMA > stockStrategyData.VWAP) && (stockStrategyData.PreviousEMA <= stockStrategyData.VWAP)) {
                    stockInfo.numberOfTrades++
                    stockInfo.stopLoss = stockData.askPrice * (1 - stockStrategyInfo.StopLossAmt)
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

                if ((stockStrategyData.EMA < stockStrategyData.RollingVWAP) && (stockStrategyData.PreviousEMA >= stockStrategyData.RollingVWAP)) {
                    stockInfo.numberOfTrades++
                    stockInfo.stopLoss = 0
                    stockInfo.tradeHigh = 0
                    stockInfo.stopLossGainThreshold = 0
                    if (stockData.bidPrice < lastOrder[0].stockPrice) {
                        stockInfo.numberOfLosses++
                    }
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
                    if (stockData.bidPrice < lastOrder[0].stockPrice) {
                        stockInfo.numberOfLosses++
                    }
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
        }


        return { shouldTrade: false, log: nonTradeLog }
    }

    //cheange to vwap trend
    //buy when the 1800 rolling vwap dips below the cumulative vwap by .002
    //and when the rolling wap last 120 ticks trend turns positive
    //sell when the rolling 1200 vwap is grater than the cumulative vwap
    private static shouldExecuteVWAPTrend(stockData: DbCurrentDayStockData, stockInfo: StockInfo, stockStrategyInfo: VWAPTrendCrossDto, stockStrategyData: stockVWAPCrossData, lastOrder: DbSchwabOrders[]): { shouldTrade: boolean, tradeType?: string, log: tradeLogDto | null } {

        stockStrategyData.priceHistory.push(stockData.stockPrice)
        stockStrategyData.volumeHistory.push(stockData.volume)
        stockStrategyData.cumulativePV += (stockData.stockPrice * stockData.volume)
        stockStrategyData.cumulativeV += stockData.volume
        stockStrategyData.lastPrice = stockData.stockPrice
        stockStrategyData.lastAsk = stockData.askPrice
        stockStrategyData.lastBid = stockData.bidPrice
        let nonTradeLog: tradeLogDto | null = null

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

            if (isBuy && stockInfo.canTrade && stockInfo.numberOfLosses < 2) {
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
                    if (stockData.bidPrice < lastOrder[0].stockPrice) {
                        stockInfo.numberOfLosses++
                    }
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
                    stockInfo.numberOfLosses++
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

        }



        return { shouldTrade: false, log: nonTradeLog }
    }

    private static shouldExecuteMADrop(stockData: DbCurrentDayStockData, stockInfo: StockInfo, stockStrategyInfo: MADropDto, stockStrategyData: MADropData, lastOrder: DbSchwabOrders[], isBuy: boolean, balance: number): { shouldTrade: boolean, tradeType?: string, log: tradeLogDto | null } {


        /* if (stockData.stockName == 'PLTR' && isBuy && lastOrder.length == 0) {
            return {
                shouldTrade: true, tradeType: 'BUY', log: {
                    stockName: stockData.stockName,
                    strategy: 'MA Drop',
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
        else if (stockData.stockName == 'PLTR' && !isBuy && lastOrder.length == 1) {
            return {
                shouldTrade: true, tradeType: 'SELL', log: {
                    stockName: stockData.stockName,
                    strategy: 'MA Drop',
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
        else {
            return { shouldTrade: false, log: null }
        } */
        stockStrategyData.priceHistory.push(stockData.stockPrice)
        stockStrategyData.lastPrice = stockData.stockPrice
        stockStrategyData.lastAsk = stockData.askPrice
        stockStrategyData.lastBid = stockData.bidPrice
        let nonTradeLog: tradeLogDto | null = null

        const multiplyer = 2 / (stockStrategyInfo.EMALength + 1)

        if (stockStrategyData.priceHistory.length < stockStrategyInfo.EMALength) {
            stockStrategyData.CumulativePrice += stockData.stockPrice
        }
        else if (stockStrategyData.priceHistory.length == stockStrategyInfo.EMALength) {
            stockStrategyData.CumulativePrice += stockData.stockPrice
            stockStrategyData.CumulativeSMA = stockStrategyData.CumulativePrice / stockStrategyData.priceHistory.length
            stockStrategyData.EMA = stockStrategyData.CumulativePrice / stockStrategyData.priceHistory.length
            stockStrategyData.BuyTrendData.push(stockStrategyData.EMA)
            stockStrategyData.SellTrendData.push(stockStrategyData.EMA)
        }
        else if (stockStrategyData.priceHistory.length > stockStrategyInfo.EMALength) {
            stockStrategyData.CumulativePrice += stockData.stockPrice
            stockStrategyData.CumulativeSMA = stockStrategyData.CumulativePrice / stockStrategyData.priceHistory.length
            stockStrategyData.EMA = (stockData.stockPrice * multiplyer) + (stockStrategyData.EMA * (1 - multiplyer))
            if (stockStrategyData.BuyTrendData.length < stockStrategyInfo.BuyTrendLength - 1) {
                stockStrategyData.BuyTrendData.push(stockStrategyData.EMA)
            }
            else if (stockStrategyData.BuyTrendData.length == stockStrategyInfo.BuyTrendLength - 1) {
                stockStrategyData.BuyTrendData.push(stockStrategyData.EMA)
                stockStrategyData.BuyTrend = (stockStrategyData.BuyTrendData[stockStrategyData.BuyTrendData.length - 1] - stockStrategyData.BuyTrendData[0]) / stockStrategyInfo.BuyTrendLength
            }
            else if (stockStrategyData.BuyTrendData.length > stockStrategyInfo.BuyTrendLength - 1) {
                stockStrategyData.BuyTrendData.shift()
                stockStrategyData.BuyTrendData.push(stockStrategyData.EMA)
                stockStrategyData.BuyTrend = (stockStrategyData.BuyTrendData[stockStrategyData.BuyTrendData.length - 1] - stockStrategyData.BuyTrendData[0]) / stockStrategyInfo.BuyTrendLength
            }
            if (stockStrategyData.SellTrendData.length < stockStrategyInfo.SellTrendLength - 1) {
                stockStrategyData.SellTrendData.push(stockStrategyData.EMA)
            }
            else if (stockStrategyData.SellTrendData.length == stockStrategyInfo.SellTrendLength - 1) {
                stockStrategyData.SellTrendData.push(stockStrategyData.EMA)
                stockStrategyData.SellTrend = (stockStrategyData.SellTrendData[stockStrategyData.SellTrendData.length - 1] - stockStrategyData.SellTrendData[0]) / stockStrategyInfo.SellTrendLength
            }
            else if (stockStrategyData.SellTrendData.length > stockStrategyInfo.SellTrendLength - 1) {
                stockStrategyData.SellTrendData.shift()
                stockStrategyData.SellTrendData.push(stockStrategyData.EMA)
                stockStrategyData.SellTrend = (stockStrategyData.SellTrendData[stockStrategyData.SellTrendData.length - 1] - stockStrategyData.SellTrendData[0]) / stockStrategyInfo.SellTrendLength
            }

            if (stockInfo.numberOfTrades == 0 && stockStrategyInfo.WaitTime > 0) {
                if (stockData.time < (this.startTime + stockStrategyInfo.WaitTime)) {
                    stockInfo.canTrade = false
                }
                else {
                    stockInfo.canTrade = true
                    nonTradeLog ??= {
                        stockName: stockData.stockName,
                        strategy: 'MA Drop',
                        tradingAmount: 0,
                        orderId: 0,
                        shares: 0,
                        dayTradeValues: structuredClone(stockStrategyInfo),
                        stockInfo: structuredClone(stockInfo),
                        stockDataInfo: structuredClone(stockStrategyData),
                        logType: '',
                        time: stockData.time,
                    }
                    //nonTradeLog.logType += 'Stock Free To Trade After Initial Wait Time - '
                }
            }
            if (stockInfo.numberOfTrades > 0 && stockInfo.canTrade == false) {
                if ((Date.now() - lastOrder[0].orderTime) > 1800000) {
                    stockInfo.canTrade = true
                    nonTradeLog ??= {
                        stockName: stockData.stockName,
                        strategy: 'MA Drop',
                        tradingAmount: 0,
                        orderId: 0,
                        shares: 0,
                        dayTradeValues: structuredClone(stockStrategyInfo),
                        stockInfo: structuredClone(stockInfo),
                        stockDataInfo: structuredClone(stockStrategyData),
                        logType: '',
                        time: stockData.time,
                    }
                    //nonTradeLog.logType += 'Stock Free To Trade After Stop Loss Timeout - '
                }
            }

            if (isBuy && stockInfo.canTrade && stockInfo.numberOfLosses < 2 && stockStrategyData.BuyTrendData.length >= stockStrategyInfo.BuyTrendLength && stockData.askPrice < balance) {
                if ((((stockStrategyData.EMA - stockStrategyData.CumulativeSMA) / stockStrategyData.CumulativeSMA) < (stockStrategyInfo.BuyDipAmt * -1)) && stockStrategyData.BuyTrend > 0) {
                    stockInfo.numberOfTrades++
                    stockInfo.stopLoss = stockData.askPrice * (1 - stockStrategyInfo.StopLossAmt)
                    return {
                        shouldTrade: true, tradeType: 'BUY', log: {
                            stockName: stockData.stockName,
                            strategy: 'MA Drop',
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
            else if (!isBuy && stockInfo.canTrade && stockStrategyData.SellTrendData.length >= stockStrategyInfo.SellTrendLength) {

                if ((((stockStrategyData.EMA - stockStrategyData.CumulativeSMA) / stockStrategyData.CumulativeSMA) > stockStrategyInfo.SellDipAmt) && stockStrategyData.SellTrend < 0) {
                    stockInfo.numberOfTrades++
                    stockInfo.stopLoss = 0
                    stockInfo.tradeHigh = 0
                    stockInfo.stopLossGainThreshold = 0
                    if (stockData.bidPrice < lastOrder[0].stockPrice) {
                        stockInfo.numberOfLosses++
                    }
                    return {
                        shouldTrade: true, tradeType: 'SELL', log: {
                            stockName: stockData.stockName,
                            strategy: 'MA Drop',
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
                    stockInfo.numberOfLosses++
                    return {
                        shouldTrade: true, tradeType: 'SELL', log: {
                            stockName: stockData.stockName,
                            strategy: 'MA Drop',
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
                        shouldTrade: true, tradeType: 'SELL', log: {
                            stockName: stockData.stockName,
                            strategy: 'MA Drop',
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

        }



        return { shouldTrade: false, log: nonTradeLog }
    }
}