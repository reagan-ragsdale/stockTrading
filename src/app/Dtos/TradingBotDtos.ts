export type StockInfo = {
    canTrade: boolean;
    numberOfTrades: number;
    stopLoss: number;
    stopLossGainThreshold: number;
    tradeHigh: number;
};
export type DayTradeValues = MovingAvergeCrossoverDto
export type stockDataInfo = stockMACrossData;
export type tradeLogDto = {
    stockName: string;
    strategy: string;
    tradingAmount: number;
    orderId: number;
    shares: number;
    dayTradeValues: DayTradeValues;
    stockInfo: StockInfo;
    stockDataInfo: stockDataInfo;
    logType: string;
    time: number;

}
export type MovingAvergeCrossoverDto = {
    MovingAverageLength: number;
    WaitTime: number;
    TrailingStopAmt: number;
}
export type stockMACrossData = {
    priceHistory: number[];
    volumeHistory: number[];
    EMA: number;
    VWAP: number;
    cumulativePV: number;
    cumulativeV: number;
    lastPrice: number;
    lastBid: number;
    lastAsk: number;
}