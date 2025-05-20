export type lineType = {
    id: number;
    lineLength: number;
    lineType: string;
    data: LineData[];
}

export type RuleDto = {
    BuyRules: BuyRule[];
    SellRules: SellRule[];

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
    primaryObject: string;
    primaryObjectType: string;
    primaryObjectLength: number;
    primaryObjectData: LineData[];
    //does an action: ex crosses over, is dips x amount below
    desiredAction: string;
    desiredActionAmnt: number;
    desiredActionLength: number;
    //the referenced line
    referencedObject: string;
    referencedObjectType: string;
    referencedObjectLength: number;
    referencedObjectData: LineData[];


}
export type SellRule = {
    id: number;
    lineId: number;
    //sell when:
    //the primary line
    andOr: string;
    conditionType: string;
    primaryObject: string;
    primaryObjectType: string;
    primaryObjectLength: number;
    primaryObjectData: LineData[];
    //does an action: ex crosses over, is dips x amount below
    desiredAction: string;
    desiredActionAmnt: number;
    desiredActionLength: number;
    desiredActionCurrent: number;
    tradeHigh: number;
    //the referenced line
    referencedObject: string;
    referencedObjectType: string;
    referencedObjectLength: number;
    referencedObjectData: LineData[];

}