import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"

@Entity("dbStockBasicHistory", {
    allowApiCrud: true
})
export class DbStockBasicHistory {


    @Fields.string()
    stockName = ''

    @Fields.number()
    open = 0

    @Fields.number()
    high = 0

    @Fields.number()
    low = 0

    @Fields.number()
    close = 0

    @Fields.number()
    volume = 0

    @Fields.number()
    date = 0



}
export const dbStockBasicHistoryRepo = remult.repo(DbStockBasicHistory)