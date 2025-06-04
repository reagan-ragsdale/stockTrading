export type lineType = {
    id: number;
    lineLength: number;
    lineType: string;
    data: LineData[];
}

export type RuleDto = {
    BuyRules: BuyRule[];
    SellRules: SellRule[];
    NumberOfLossesInARowToStop: number;
    TimeOutAfterStopLossSell: number;


}
export type LineData = {
    value: number | null;
    time: number;
}
export type BuyRule = {
    id: number;
    lineId: number;
    //buy when:
    //the primary line
    conditionType: string;
    buyTimeType: string;
    buyTime: number;
    buyTimeChecked: boolean;
    buyTimeCheckToAmnt: number;
    buyTimeCheckFromAmnt: number;
    buyTimeCheckStepAmnt: number;
    primaryObject: {
        name: string;
        type: string;
        length: number;
        lengthLoopChecked: boolean;
        lengthLoopCheckToAmnt: number;
        lengthLoopCheckFromAmnt: number;
        lengthLoopCheckStepAmnt: number;
        data: LineData[]
    },
    /*  primaryObject: string;
     primaryObjectType: string;
     primaryObjectLength: number;
     primaryObjectData: LineData[]; */
    //does an action: ex crosses over, is dips x amount below
    desiredAction: {
        type: string;
        amount: number;
        amountLoopChecked: boolean;
        amountLoopCheckToAmnt: number;
        amountLoopCheckFromAmnt: number;
        amountLoopCheckStepAmnt: number;
        length: number;
        lengthLoopChecked: boolean;
        lengthLoopCheckToAmnt: number;
        lengthLoopCheckFromAmnt: number;
        lengthLoopCheckStepAmnt: number;
    }
    /* desiredAction: string;
    desiredActionAmnt: number;
    desiredActionLength: number; */
    //the referenced line
    referencedObject: {
        name: string;
        type: string;
        length: number;
        lengthLoopChecked: boolean;
        lengthLoopCheckToAmnt: number;
        lengthLoopCheckFromAmnt: number;
        lengthLoopCheckStepAmnt: number;
        data: LineData[];
    }
    /* referencedObject: string;
    referencedObjectType: string;
    referencedObjectLength: number;
    referencedObjectData: LineData[]; */


}
export type SellRule = {
    id: number;
    lineId: number;
    //sell when:
    //the primary line
    andOr: string;
    conditionType: string;
    primaryObject: {
        name: string;
        type: string;
        length: number;
        lengthLoopChecked: boolean;
        lengthLoopCheckToAmnt: number;
        lengthLoopCheckFromAmnt: number;
        lengthLoopCheckStepAmnt: number;
        data: LineData[]
    },
    /* primaryObject: string;
    primaryObjectType: string;
    primaryObjectLength: number;
    primaryObjectData: LineData[]; */
    //does an action: ex crosses over, is dips x amount below
    desiredAction: {
        type: string;
        amount: number;
        amountLoopChecked: boolean;
        amountLoopCheckToAmnt: number;
        amountLoopCheckFromAmnt: number;
        amountLoopCheckStepAmnt: number;
        length: number;
        lengthLoopChecked: boolean;
        lengthLoopCheckToAmnt: number;
        lengthLoopCheckFromAmnt: number;
        lengthLoopCheckStepAmnt: number;
        current: number;
    }
    /* desiredAction: string;
    desiredActionAmnt: number;
    desiredActionLength: number;
    desiredActionCurrent: number; */
    tradeHigh: number;
    //the referenced line
    referencedObject: {
        name: string;
        type: string;
        length: number;
        lengthLoopChecked: boolean;
        lengthLoopCheckToAmnt: number;
        lengthLoopCheckFromAmnt: number;
        lengthLoopCheckStepAmnt: number;
        data: LineData[];
    }
    /* referencedObject: string;
    referencedObjectType: string;
    referencedObjectLength: number;
    referencedObjectData: LineData[]; */

}