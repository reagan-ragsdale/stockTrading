import { tradeLogDto } from "../Dtos/TradingBotDtos"

export class LogService {
    //need to set an order id on the insert stock side to distiguish the stock orders from each other

    private static dailyLogHistory: tradeLogDto[] = []

    static insertIntoLog(message: tradeLogDto){
        this.dailyLogHistory.push(message)
    }

    static getLogHistory(): any[]{
        return this.dailyLogHistory
    }
}