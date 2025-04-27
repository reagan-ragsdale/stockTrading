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
}
export type stockDataInfo = {
    history: number[];
    last3600: number[];
    last3600sma: number;
    last1800sma: number;
    last300sma: number;
    last300Sellsma: number;
    lastPrice: number;
    lastAsk: number;
    lastBid: number;
}
export type tradeLogDto = {
    stockName: string;
    orderId: number;
    shares: number;
    dayTradeValues: DayTradeValues;
    stockInfo: StockInfo;
    longSma: number;
    mediumSma: number;
    shortSmaBuy: number;
    shortSmaSell: number;
    lastPrice: number;
    askPrice: number; 
    bidPrice: number;
    logType: string;
    time: number;

}