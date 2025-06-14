import { tradeLogDto } from "../Dtos/TradingBotDtos"

export class LogService {
    //need to set an order id on the insert stock side to distiguish the stock orders from each other

    private static dailyLogHistory: tradeLogDto[] = []
    private static schwabRunInfo: any[] = []

    static insertIntoLog(message: tradeLogDto) {
        this.dailyLogHistory.push(message)
    }

    static getLogHistory(): any[] {
        return this.dailyLogHistory
    }
    static clearLogHistory(): void {
        this.dailyLogHistory.length = 0
    }

    static insertSchwabLog(message: any) {
        this.schwabRunInfo.push(message)
    }
    static getSchwabLog() {
        return this.schwabRunInfo
    }
}