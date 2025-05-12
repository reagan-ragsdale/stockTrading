import { BackendMethod } from 'remult'
import { LogService } from '../../app/services/LogService.js'
import { tradeLogDto } from '../../app/Dtos/TradingBotDtos'
import { emailer } from '../../server/log-emailer'
import { createExcel } from '../../server/logReport'
import { dbOrdersRepo } from '../tasks/dbOrders.js'
import { simFinRepo } from '../tasks/simFinance.js'




export class LoggerController {

    static sendEmail: typeof emailer
    static generateExcel: typeof createExcel


    @BackendMethod({ allowed: true })
    static async sendEmailCall() {
        let logData = LogService.getLogHistory()
        /*  let logData: tradeLogDto[] = [
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
               stockDataInfo: {
                   history: [],
                   last3600: [],
                   last3600sma: 0,
                   last1800sma: 0,
                   last300sma: 0,
                   last300Sellsma: 0,
                   lastAsk: 0,
                   lastBid: 0,
                   lastPrice: 0
               },
               logType: 'Log 1',
               time: 1745793625000
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
               stockDataInfo: {
                   history: [],
                   last3600: [],
                   last3600sma: 0,
                   last1800sma: 0,
                   last300sma: 0,
                   last300Sellsma: 0,
                   lastAsk: 0,
                   lastBid: 0,
                   lastPrice: 0
               },
               logType: 'Log 2',
               time: 1745793629000
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
               stockDataInfo: {
                   history: [],
                   last3600: [],
                   last3600sma: 0,
                   last1800sma: 0,
                   last300sma: 0,
                   last300Sellsma: 0,
                   lastAsk: 0,
                   lastBid: 0,
                   lastPrice: 0
               },
               logType: 'Log 3',
               time: 1745793635000
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
               stockDataInfo: {
                   history: [],
                   last3600: [],
                   last3600sma: 0,
                   last1800sma: 0,
                   last300sma: 0,
                   last300Sellsma: 0,
                   lastAsk: 0,
                   lastBid: 0,
                   lastPrice: 0
               },
               logType: 'Log 4',
               time: 1745793639000
           }
       ]   */

        let excelBuffer = await LoggerController.generateExcel(logData)
        await LoggerController.sendEmail(excelBuffer)
        let today = new Date()
        today.setHours(5, 0, 0, 0)
        let listOfOrders = await dbOrdersRepo.find({ where: { orderTime: { $gt: today.getTime() } }, orderBy: { orderTime: 'desc' } })
        let totalProfit = 0
        for (let i = 0; i < listOfOrders.length; i++) {
            if (listOfOrders[i].orderType == 'Sell') {
                totalProfit += listOfOrders[i].stockPrice
            }
        }
        let sharedFinance = await simFinRepo.findFirst({ userId: 'Shared' })
        let newSpending = sharedFinance?.spending! + totalProfit
        await simFinRepo.save({ ...sharedFinance, spending: newSpending })
        LogService.clearLogHistory()



    }


    @BackendMethod({ allowed: true })
    static addToLog(message: tradeLogDto) {
        LogService.insertIntoLog(message)
    }

}