export type StockInfo = {
    canTrade: boolean;
    numberOfTrades: number;
    stopLoss: number;
    stopLossGainThreshold: number;
    tradeHigh: number;
};
export type DayTradeValues = {
    Buy: number;
    Sell: number;
    Check200: number;
    SmaLong: number;
    SmaMedium: number;
    SmaShort: number;
    SmaShortSell: number;
    SmaShortMinuteBuy: number;
}
export type stockDataInfo = {
    history: number[];
    last3600: number[];
    last3600sma: number;
    last1800sma: number;
    last300sma: number;
    last300Sellsma: number;
    last60Buysma: number;
    lastPrice: number;
    lastAsk: number;
    lastBid: number;
}
export type tradeLogDto = {
    stockName: string;
    tradingAmount: number;
    orderId: number;
    shares: number;
    dayTradeValues: DayTradeValues;
    stockInfo: StockInfo;
    stockDataInfo: stockDataInfo;
    logType: string;
    time: number;

}