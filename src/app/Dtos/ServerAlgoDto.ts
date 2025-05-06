export type lineType = {
    id: number;
    lineLength: number;
    lineType: string;
    data: any[];
}

export type RuleDto = {
    BuyRules: BuyRule[];
    SellRules: SellRule[];

}
export type BuyRule = {
    id: number;
    lineId: number;
    //buy when:
    //the primary line
    primaryObject: string;
    primaryObjectData: any[];
    //does an action: ex crosses over, is dips x amount below
    desiredAction: string;
    //the referenced line
    referencedObject: string;
    referencedObjectData: any[];


}
export type SellRule = {
    id: number;
    lineId: number;
    //sell when:
    //the primary line
    primaryObject: string;
    primaryObjectData: any[];
    //does an action: ex crosses over, is dips x amount below
    desiredAction: string;
    //the referenced line
    referencedObject: string;
    referencedObjectData: any[];

}