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
    primaryObjectType: string;
    primaryObjectLength: number;
    primaryObjectData: any[];
    //does an action: ex crosses over, is dips x amount below
    desiredAction: string;
    desiredActionAmnt: number;
    //the referenced line
    referencedObject: string;
    referencedObjectType: string;
    referencedObjectLength: number;
    referencedObjectData: any[];


}
export type SellRule = {
    id: number;
    lineId: number;
    //sell when:
    //the primary line
    primaryObject: string;
    primaryObjectType: string;
    primaryObjectLength: number;
    primaryObjectData: any[];
    //does an action: ex crosses over, is dips x amount below
    desiredAction: string;
    desiredActionAmnt: number;
    //the referenced line
    referencedObject: string;
    referencedObjectType: string;
    referencedObjectLength: number;
    referencedObjectData: any[];

}