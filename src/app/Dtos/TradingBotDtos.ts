export type StockInfo = {
    canTrade: boolean;
    numberOfTrades: number;
    stopLoss: number;
    stopLossGainThreshold: number;
    tradeHigh: number;
    numberOfLosses: number;
};
export type DayTradeValues = MovingAvergeCrossoverDto | VWAPTrendCrossDto | MADropDto
export type stockDataInfo = stockMACrossData | stockVWAPCrossData | MADropData
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
    PreviousEMA: number;
    VWAP: number;
    RollingVWAP: number;
    cumulativePV: number;
    cumulativeV: number;
    rollingPV: number;
    rollingV: number;
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
export type MADropDto = {
    EMALength: number;
    BuyTrendLength: number;
    SellTrendLength: number;
    BuyDipAmt: number;
    SellDipAmt: number;
    WaitTime: number;
    StopLossAmt: number;
}
export type MADropData = {
    priceHistoryLength: number;
    EMA: number;
    CumulativePrice: number;
    CumulativeSMA: number;
    BuyTrend: number;
    BuyTrendData: number[];
    SellTrend: number;
    SellTrendData: number[];
}


export type SchwabOrderDTO = {

    orderType: string;
    session: string;
    duration: string;
    orderStrategyType: string,
    orderLegCollection: [
        {
            instruction: string;
            quantity: number;
            instrument: {
                symbol: string;
                assetType: string;
            }
        }
    ]

}

export type OrderApiResponse = {
    code: number;
    message: string;
}


