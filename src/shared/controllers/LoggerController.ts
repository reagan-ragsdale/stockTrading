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
        try {
            let logData = LogService.getLogHistory()
            let excelBuffer = await LoggerController.generateExcel(logData)
            await LoggerController.sendEmail(excelBuffer)
            let today = new Date()
            today.setHours(5, 0, 0, 0)
            let listOfOrders = await dbOrdersRepo.find({ where: { orderTime: { $gt: today.getTime() } }, orderBy: { orderTime: 'asc' } })
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
        catch(error: any){
            console.log('report log error: ' + error.message)
        }
        



    }


    @BackendMethod({ allowed: true })
    static addToLog(message: tradeLogDto) {
        LogService.insertIntoLog(message)
    }

}