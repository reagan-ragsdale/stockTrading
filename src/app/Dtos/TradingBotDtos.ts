export type StockInfo = {
    canTrade: boolean;
    numberOfTrades: number;
    stopLoss: number;
    stopLossGainThreshold: number;
    tradeHigh: number;
};
export type DayTradeValues = MovingAvergeCrossoverDto | VWAPTrendCrossDto
export type stockDataInfo = stockMACrossData | stockVWAPCrossData;
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
    RollingVWAPLength: number;
    WaitTime: number;
    TrailingStopAmt: number;
    StopLossAmt: number;
}
export type stockMACrossData = {
    priceHistory: number[];
    volumeHistory: number[];
    EMA: number;
    VWAP: number;
    RollingVWAP: number;
    cumulativePV: number;
    cumulativeV: number;
    lastPrice: number;
    lastBid: number;
    lastAsk: number;
}
export type VWAPTrendCrossDto = {
    RollingVWAPLength: number;
    VWAPTrendLength: number;
    WaitTime: number;
    StopLossAmt: number;
}
export type stockVWAPCrossData = {
    priceHistory: number[];
    volumeHistory: number[];
    CumulativeVWAP: number;
    RollingVWAP: number;
    RollingVWAPTrend: number;
    RollingVWAPTrendData: number[];
    cumulativePV: number;
    rollingPV: number;
    rollingV: number;
    cumulativeV: number;
    lastPrice: number;
    lastBid: number;
    lastAsk: number;
}