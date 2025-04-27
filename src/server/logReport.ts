import excelJS from "exceljs"
import { tradeLogDto } from "../app/Dtos/TradingBotDtos";
export const createExcel = async (logArray: tradeLogDto[]): Promise<excelJS.Buffer> => {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Log");

    worksheet.columns = [
        { header: "Stock Name", key: "stockName", width: 30 },
        { header: "Order ID", key: "orderId", width: 30 },
        { header: "Time", key: "time", width: 60 },
        { header: "Description", key: "description", width: 30 },
        { header: "Shares", key: "shares", width: 30 },
        { header: "Last Price", key: "lastPrice", width: 30 },
        { header: "Last Ask", key: "lastAsk", width: 30 },
        { header: "Last Bid", key: "lastBid", width: 30 },
        { header: "Can Trade", key: "canTrade", width: 30 },
        { header: "Number Of Trades", key: "numberOfTrades", width: 30 },
        { header: "Stop Loss", key: "stopLoss", width: 30 },
        { header: "Stop Loss Gain Threshold", key: "stopLossGainThreshold", width: 30 },
        { header: "Trade High", key: "tradeHigh", width: 30 },
        { header: "Long SMA", key: "longSma", width: 30 },
        { header: "Medium SMA", key: "mediumSma", width: 30 },
        { header: "Short SMA Buy", key: "shortSmaBuy", width: 30 },
        { header: "Short SMA Sell", key: "shortSmaSell", width: 30 },
        { header: "Buy Param", key: "buyParam", width: 30 },
        { header: "Sell Param", key: "sellParam", width: 30 },
        { header: "Check Param", key: "checkParam", width: 30 },
        { header: "Long SMA Length", key: "longSmaLength", width: 30 },
        { header: "Medium SMA Length", key: "mediumSmaLength", width: 30 },
        { header: "Short SMA Buy Length", key: "shortSmaBuyLength", width: 30 },
        { header: "Short SMA Sell Length", key: "shortSmaSellLength", width: 30 }
    ];
    let blankRow = {
        stockName: '',
        orderId: '',
        time: '',
        description: '',
        shares: '',
        lastPrice: '',
        lastAsk: '',
        lastBid: '',
        canTrade: '',
        numberOfTrades: '',
        stopLoss: '',
        stopLossGainThreshold: '',
        tradeHigh: '',
        longSma: '',
        mediumSma: '',
        shortSmaBuy: '',
        shortSmaSell: '',
        buyParam: '',
        sellParam: '',
        checkParam: '',
        longSmaLength: '',
        mediumSmaLength: '',
        shortSmaBuyLength: '',
        shortSmaSellLengt: ''
    }

    let distinctOrders = logArray.map(e => e.orderId).filter((v, i, a) => a.indexOf(v) === i)
    for (let i = 0; i < distinctOrders.length; i++) {
        let filteredByOrder = logArray.filter(e => e.orderId == distinctOrders[i])
        filteredByOrder.sort((a, b) => a.time - b.time)
        for (let j = 0; j < filteredByOrder.length; j++) {
            worksheet.addRow({
                stockName: filteredByOrder[j].stockName,
                orderId: filteredByOrder[j].orderId,
                time: filteredByOrder[j].time,
                description: filteredByOrder[j].logType,
                shares: filteredByOrder[j].shares,
                lastPrice: filteredByOrder[j].lastPrice,
                lastAsk: filteredByOrder[j].askPrice,
                lastBid: filteredByOrder[j].bidPrice,
                canTrade: filteredByOrder[j].stockInfo.canTrade,
                numberOfTrades: filteredByOrder[j].stockInfo.numberOfTrades,
                stopLoss: filteredByOrder[j].stockInfo.stopLoss,
                stopLossGainThreshold: filteredByOrder[j].stockInfo.stopLossGainThreshold,
                tradeHigh: filteredByOrder[j].stockInfo.tradeHigh,
                longSma: filteredByOrder[j].longSma,
                mediumSma: filteredByOrder[j].mediumSma,
                shortSmaBuy: filteredByOrder[j].shortSmaBuy,
                shortSmaSell: filteredByOrder[j].shortSmaSell,
                buyParam: filteredByOrder[j].dayTradeValues.Buy,
                sellParam: filteredByOrder[j].dayTradeValues.Sell,
                checkParam: filteredByOrder[j].dayTradeValues.Check200,
                longSmaLength: filteredByOrder[j].dayTradeValues.SmaLong,
                mediumSmaLength: filteredByOrder[j].dayTradeValues.SmaMedium,
                shortSmaBuyLength: filteredByOrder[j].dayTradeValues.SmaShort,
                shortSmaSellLengt: filteredByOrder[j].dayTradeValues.SmaShortSell
            })
        }
        worksheet.addRow(blankRow)
    }

    const buffer = await workbook.xlsx.writeBuffer();
    //workbook.xlsx.writeFile("dailyLog.xlsx")
    console.log("written")
    return buffer
}