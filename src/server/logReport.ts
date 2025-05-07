import excelJS from "exceljs"
import { tradeLogDto } from "../app/Dtos/TradingBotDtos";
import { dbOrdersRepo } from "../shared/tasks/dbOrders.js";
export const createExcel = async (logArray: tradeLogDto[]): Promise<excelJS.Buffer> => {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Log");
    const ResultsWorksheet = workbook.addWorksheet("Results")

    ResultsWorksheet.columns = [
        { header: "Stock Name", key: "stockName", width: 15, alignment: { horizontal: 'center' } },
        { header: "Profit", key: "profit", width: 15, alignment: { horizontal: 'center' }, numFmt: '$#,##0.00' },
        { header: "Wins", key: "wins", width: 15, alignment: { horizontal: 'center' } },
        { header: "Losses", key: "losses", width: 15, alignment: { horizontal: 'center' } },
        { header: "Avg Win", key: "avgWin", width: 15, alignment: { horizontal: 'center' }, numFmt: '$#,##0.00' },
        { header: "Avg Loss", key: "avgLoss", width: 15, alignment: { horizontal: 'center' }, numFmt: '$#,##0.00' },
    ]
    let blankResultRow = {
        stockName: '',
        profit: '',
        wins: '',
        losses: '',
        avgWin: '',
        avgLoss: ''
    }

    let stockResults = []

    worksheet.columns = [
        { header: "Stock Name", key: "stockName", width: 15, alignment: { horizontal: 'center' } },
        { header: "Tading Amount", key: "tradingAmount", width: 15, alignment: { horizontal: 'center' }, numFmt: '$#,##0.00' },
        { header: "Order ID", key: "orderId", width: 20, alignment: { horizontal: 'center' } },
        { header: "Time", key: "time", width: 20, alignment: { horizontal: 'center' } },
        { header: "Description", key: "description", width: 30, alignment: { horizontal: 'center' } },
        { header: "Shares", key: "shares", width: 10, alignment: { horizontal: 'center' } },
        { header: "Last Price", key: "lastPrice", width: 10, alignment: { horizontal: 'center' } },
        { header: "Last Ask/Buy", key: "lastAsk", width: 10, alignment: { horizontal: 'center' } },
        { header: "Last Bid/Sell", key: "lastBid", width: 10, alignment: { horizontal: 'center' } },
        { header: "Can Trade", key: "canTrade", width: 10, alignment: { horizontal: 'center' } },
        { header: "Number Of Trades", key: "numberOfTrades", width: 10, alignment: { horizontal: 'center' } },
        { header: "Stop Loss", key: "stopLoss", width: 10, alignment: { horizontal: 'center' } },
        { header: "Stop Loss Gain Threshold", key: "stopLossGainThreshold", width: 10, alignment: { horizontal: 'center' } },
        { header: "Trade High", key: "tradeHigh", width: 10, alignment: { horizontal: 'center' } },
        { header: "Long SMA", key: "longSma", width: 10, alignment: { horizontal: 'center' } },
        { header: "Medium SMA", key: "mediumSma", width: 10, alignment: { horizontal: 'center' } },
        { header: "Short SMA Buy", key: "shortSmaBuy", width: 10, alignment: { horizontal: 'center' } },
        { header: "Short SMA Minute Buy", key: "shortSmaMinuteBuy", width: 10, alignment: { horizontal: 'center' } },
        { header: "Short SMA Sell", key: "shortSmaSell", width: 10, alignment: { horizontal: 'center' } },
        { header: "Buy Param", key: "buyParam", width: 10, alignment: { horizontal: 'center' } },
        { header: "Sell Param", key: "sellParam", width: 10, alignment: { horizontal: 'center' } },
        { header: "Check Param", key: "checkParam", width: 10, alignment: { horizontal: 'center' } },
        { header: "Long SMA Length", key: "longSmaLength", width: 10, alignment: { horizontal: 'center' } },
        { header: "Medium SMA Length", key: "mediumSmaLength", width: 10, alignment: { horizontal: 'center' } },
        { header: "Short SMA Buy Length", key: "shortSmaBuyLength", width: 10, alignment: { horizontal: 'center' } },
        { header: "Short SMA Sell Length", key: "shortSmaSellLength", width: 10, alignment: { horizontal: 'center' } }
    ];
    let blankRow = {
        stockName: '',
        tradingAmount: '',
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
        shortSmaMinuteBuy: '',
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
                tradingAmount: filteredByOrder[j].tradingAmount,
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
                shortSmaMinuteBuy: filteredByOrder[j].stockDataInfo.last60Buysma,
                shortSmaSell: filteredByOrder[j].stockDataInfo.last300Sellsma,
                buyParam: filteredByOrder[j].dayTradeValues.Buy,
                sellParam: filteredByOrder[j].dayTradeValues.Sell,
                checkParam: filteredByOrder[j].dayTradeValues.Check200,
                longSmaLength: filteredByOrder[j].dayTradeValues.SmaLong,
                mediumSmaLength: filteredByOrder[j].dayTradeValues.SmaMedium,
                shortSmaBuyLength: filteredByOrder[j].dayTradeValues.SmaShort,
                shortSmaSellLength: filteredByOrder[j].dayTradeValues.SmaShortSell
            })
            if (filteredByOrder[j].shares == 1) {
                stockResults.push({ stockName: filteredByOrder[j].stockName, orderType: filteredByOrder[j].logType, buyPrice: filteredByOrder[j].stockDataInfo.lastAsk, sellPrice: filteredByOrder[j].stockDataInfo.lastBid })
            }
        }
        worksheet.addRow(blankRow)
    }
    let finalResults = []
    let allProfit = 0
    let allWins = 0
    let allLosses = 0
    let allTotalWinAmt = 0
    let allTotalLossAmt = 0
    let allAvgWinAmt = 0
    let allAvgLossAmt = 0
    let today = new Date()
    today.setHours(5,0,0,0)
    let orders = await dbOrdersRepo.find({where: {orderTime: {$gt: today.getTime()}}})
    let distinctStocks = orders.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    for (let i = 0; i < distinctStocks.length; i++) {
        let stockProfit = 0
        let totalWins = 0
        let totalLosses = 0
        let totalLossAmt = 0
        let totalWinAmt = 0
        let avgWinAmt = 0
        let avgLossAmt = 0
        let filteredByStock = orders.filter(e => e.stockName == distinctStocks[i])
        for (let j = 0; j < filteredByStock.length; j++) {
            //need to find each pair of buy and sells
            if (filteredByStock[j].orderType == 'Sell') {
                let profit = filteredByStock[j].stockPrice - filteredByStock[j - 1].stockPrice
                stockProfit += profit
                allProfit += stockProfit
                if (profit > 0) {
                    totalWins++
                    totalWinAmt += profit
                }
                else {
                    totalLosses++
                    totalLossAmt += profit
                }
            }

        }
        avgLossAmt = totalLosses == 0 ? 0 : totalLossAmt / totalLosses
        avgWinAmt = totalWins == 0 ? 0 : totalWinAmt / totalWins

        allProfit += stockProfit
        allWins += totalWins
        allLosses += totalLosses
        allTotalWinAmt += totalWinAmt
        allTotalLossAmt += totalLossAmt

        finalResults.push({ stockName: distinctStocks[i], profit: stockProfit, numWins: totalWins, numLosses: totalLosses, winAmt: avgWinAmt, lossAmt: avgLossAmt })
    }
    allAvgWinAmt = allWins == 0 ? 0 : allTotalWinAmt / allWins
    allAvgLossAmt = allLosses == 0 ? 0 : allTotalLossAmt / allLosses
    finalResults.unshift({ stockName: 'All', profit: allProfit, numWins: allWins, numLosses: allLosses, winAmt: allAvgWinAmt, lossAmt: allAvgLossAmt })
    for (let i = 0; i < finalResults.length; i++) {
        ResultsWorksheet.addRow({
            stockName: finalResults[i].stockName,
            profit: finalResults[i].profit,
            wins: finalResults[i].numWins,
            losses: finalResults[i].numLosses,
            avgWin: finalResults[i].winAmt,
            avgLoss: finalResults[i].lossAmt
        })
    }

    const buffer = await workbook.xlsx.writeBuffer();
    console.log("written")
    return buffer
}