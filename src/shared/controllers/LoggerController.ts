import { BackendMethod } from 'remult'
import { LogService } from '../../app/services/LogService.js'
import { tradeLogDto } from '../../app/Dtos/TradingBotDtos'
import { emailer } from '../../server/log-emailer'
import { createExcel } from '../../server/logReport'




export class LoggerController {

    static sendEmail: typeof emailer
    static generateExcel: typeof createExcel


    @BackendMethod({ allowed: true })
    static async sendEmailCall() {
        //let logData = LogService.getLogHistory()
        let logData: tradeLogDto[] = [
            {
                stockName: 'Stock 1',
                orderId: 1,
                shares: 1,
                dayTradeValues: {
                    Buy: 0,
                    Sell: 0,
                    Check200: 0,
                    SmaLong: 0,
                    SmaMedium: 0,
                    SmaShort: 0,
                    SmaShortSell:0
                },
                stockInfo: {
                    canTrade: true,
                    numberOfTrades: 0,
                    stopLoss: 0,
                    stopLossGainThreshold: 0,
                    tradeHigh: 0
                },
                longSma: 0,
                mediumSma: 0,
                shortSmaBuy: 0,
                shortSmaSell: 0,
                lastPrice: 0,
                askPrice: 0,
                bidPrice: 0,
                logType: 'Log 1',
                time: 100
            },{
                stockName: 'Stock 1',
                orderId: 1,
                shares: 1,
                dayTradeValues: {
                    Buy: 0,
                    Sell: 0,
                    Check200: 0,
                    SmaLong: 0,
                    SmaMedium: 0,
                    SmaShort: 0,
                    SmaShortSell:0
                },
                stockInfo: {
                    canTrade: true,
                    numberOfTrades: 0,
                    stopLoss: 0,
                    stopLossGainThreshold: 0,
                    tradeHigh: 0
                },
                longSma: 0,
                mediumSma: 0,
                shortSmaBuy: 0,
                shortSmaSell: 0,
                lastPrice: 0,
                askPrice: 0,
                bidPrice: 0,
                logType: 'Log 2',
                time: 105
            },{
                stockName: 'Stock 2',
                orderId: 2,
                shares: 1,
                dayTradeValues: {
                    Buy: 0,
                    Sell: 0,
                    Check200: 0,
                    SmaLong: 0,
                    SmaMedium: 0,
                    SmaShort: 0,
                    SmaShortSell:0
                },
                stockInfo: {
                    canTrade: true,
                    numberOfTrades: 0,
                    stopLoss: 0,
                    stopLossGainThreshold: 0,
                    tradeHigh: 0
                },
                longSma: 0,
                mediumSma: 0,
                shortSmaBuy: 0,
                shortSmaSell: 0,
                lastPrice: 0,
                askPrice: 0,
                bidPrice: 0,
                logType: 'Log 3',
                time: 102
            },{
                stockName: 'Stock 2',
                orderId: 2,
                shares: 1,
                dayTradeValues: {
                    Buy: 0,
                    Sell: 0,
                    Check200: 0,
                    SmaLong: 0,
                    SmaMedium: 0,
                    SmaShort: 0,
                    SmaShortSell:0
                },
                stockInfo: {
                    canTrade: true,
                    numberOfTrades: 0,
                    stopLoss: 0,
                    stopLossGainThreshold: 0,
                    tradeHigh: 0
                },
                longSma: 0,
                mediumSma: 0,
                shortSmaBuy: 0,
                shortSmaSell: 0,
                lastPrice: 0,
                askPrice: 0,
                bidPrice: 0,
                logType: 'Log 4',
                time: 109
            }
        ]

        await LoggerController.generateExcel(logData)
        await LoggerController.sendEmail()

    }


    @BackendMethod({ allowed: true })
    static addToLog(message: tradeLogDto) {
        LogService.insertIntoLog(message)
    }

}