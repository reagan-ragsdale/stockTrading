
import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"

@Entity("dbListOfProfits", {
    allowApiCrud: true
})
export class DbListOfProfits {

    @Fields.number()
    buyBuffer = 0

    @Fields.number()
    sellBuffer = 0

    @Fields.number()
    checkBuffer = 0

    @Fields.number()
    smaLong = 0

    @Fields.number()
    smaMedium = 0

    @Fields.number()
    smaShort = 0

    @Fields.number()
    profit = 0
    
    @Fields.number()
    numberOfTrades = 0

}
export const dbListOfProfitsRepo = remult.repo(DbListOfProfits)