import excelJS from "exceljs"
import { tradeLogDto } from "../app/Dtos/TradingBotDtos";
export const createExcel = async (logArray: tradeLogDto[]): Promise<excelJS.Buffer> => {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Log");

    worksheet.columns = [
        { header: "Stock Name", key: "stockName", width: 15, alignment: {horizontal: 'center'} },
        { header: "Order ID", key: "orderId", width: 20, alignment: {horizontal: 'center'} },
        { header: "Time", key: "time", width: 20, alignment: {horizontal: 'center'} },
        { header: "Description", key: "description", width: 30, alignment: {horizontal: 'center'} },
        { header: "Shares", key: "shares", width: 10, alignment: {horizontal: 'center'} },
        { header: "Last Price", key: "lastPrice", width: 10, alignment: {horizontal: 'center'} },
        { header: "Last Ask/Buy", key: "lastAsk", width: 10, alignment: {horizontal: 'center'} },
        { header: "Last Bid/Sell", key: "lastBid", width: 10, alignment: {horizontal: 'center'} },
        { header: "Can Trade", key: "canTrade", width: 10, alignment: {horizontal: 'center'} },
        { header: "Number Of Trades", key: "numberOfTrades", width: 10, alignment: {horizontal: 'center'} },
        { header: "Stop Loss", key: "stopLoss", width: 10, alignment: {horizontal: 'center'} },
        { header: "Stop Loss Gain Threshold", key: "stopLossGainThreshold", width: 10, alignment: {horizontal: 'center'} },
        { header: "Trade High", key: "tradeHigh", width: 10, alignment: {horizontal: 'center'} },
        { header: "Long SMA", key: "longSma", width: 10, alignment: {horizontal: 'center'} },
        { header: "Medium SMA", key: "mediumSma", width: 10, alignment: {horizontal: 'center'} },
        { header: "Short SMA Buy", key: "shortSmaBuy", width: 10, alignment: {horizontal: 'center'} },
        { header: "Short SMA Sell", key: "shortSmaSell", width: 10, alignment: {horizontal: 'center'} },
        { header: "Buy Param", key: "buyParam", width: 10, alignment: {horizontal: 'center'} },
        { header: "Sell Param", key: "sellParam", width: 10, alignment: {horizontal: 'center'} },
        { header: "Check Param", key: "checkParam", width: 10, alignment: {horizontal: 'center'} },
        { header: "Long SMA Length", key: "longSmaLength", width: 10, alignment: {horizontal: 'center'} },
        { header: "Medium SMA Length", key: "mediumSmaLength", width: 10, alignment: {horizontal: 'center'} },
        { header: "Short SMA Buy Length", key: "shortSmaBuyLength", width: 10, alignment: {horizontal: 'center'} },
        { header: "Short SMA Sell Length", key: "shortSmaSellLength", width: 10, alignment: {horizontal: 'center'} }
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
        shortSmaSellLength: ''
    }

    let distinctOrders = logArray.map(e => e.orderId).filter((v, i, a) => a.indexOf(v) === i)
    for (let i = 0; i < distinctOrders.length; i++) {
        let filteredByOrder = logArray.filter(e => e.orderId == distinctOrders[i])
        filteredByOrder.sort((a, b) => a.time - b.time)
        for (let j = 0; j < filteredByOrder.length; j++) {
            worksheet.addRow({
                stockName: filteredByOrder[j].stockName,
                orderId: filteredByOrder[j].orderId,
                time: new Date(filteredByOrder[j].time).toLocaleTimeString('en-US', {
                    timeZone: 'America/Chicago',
                }),
                description: filteredByOrder[j].logType,
                shares: filteredByOrder[j].shares,
                lastPrice: filteredByOrder[j].stockDataInfo.lastPrice,
                lastAsk: filteredByOrder[j].stockDataInfo.lastAsk,
                lastBid: filteredByOrder[j].stockDataInfo.lastBid,
                canTrade: filteredByOrder[j].stockInfo.canTrade,
                numberOfTrades: filteredByOrder[j].stockInfo.numberOfTrades,
                stopLoss: filteredByOrder[j].stockInfo.stopLoss,
                stopLossGainThreshold: filteredByOrder[j].stockInfo.stopLossGainThreshold,
                tradeHigh: filteredByOrder[j].stockInfo.tradeHigh,
                longSma: filteredByOrder[j].stockDataInfo.last3600sma,
                mediumSma: filteredByOrder[j].stockDataInfo.last1800sma,
                shortSmaBuy: filteredByOrder[j].stockDataInfo.last300sma,
                shortSmaSell: filteredByOrder[j].stockDataInfo.last300Sellsma,
                buyParam: filteredByOrder[j].dayTradeValues.Buy,
                sellParam: filteredByOrder[j].dayTradeValues.Sell,
                checkParam: filteredByOrder[j].dayTradeValues.Check200,
                longSmaLength: filteredByOrder[j].dayTradeValues.SmaLong,
                mediumSmaLength: filteredByOrder[j].dayTradeValues.SmaMedium,
                shortSmaBuyLength: filteredByOrder[j].dayTradeValues.SmaShort,
                shortSmaSellLength: filteredByOrder[j].dayTradeValues.SmaShortSell
            })
        }
        worksheet.addRow(blankRow)
    }

    const buffer = await workbook.xlsx.writeBuffer();
    console.log("written")
    return buffer
}