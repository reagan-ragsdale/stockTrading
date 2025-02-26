export type buySellDto = {
    shouldExecuteOrder: boolean;
    isBuyOrSell?: string;
    targetPrice?: number;
    stopLossPrice?: number;
    initialAverage?:number;
    tradeHigh?: number;
    soldAtStopLoss?: boolean;
}