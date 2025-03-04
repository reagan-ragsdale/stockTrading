export type buySellDto = {
    shouldExecuteOrder: boolean;
    isBuyOrSell?: string;
    targetPrice?: number;
    stopLossPrice?: number;
    initialAverage?: number;
    tradeHigh?: number;
    soldAtStopLoss?: boolean;
    containsTrendInfo?: boolean;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    aboveyMin?: number;
    aboveyMax?: number;
    belowyMin?: number;
    belowyMax?: number;
    gutterLineAboveMin?: number;
    gutterLineAboveMax?: number;
    gutterLineBelowMin?: number;
    gutterLineBelowMax?: number;
}