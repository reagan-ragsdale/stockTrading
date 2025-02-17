import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("dbRegressionUserStocks", {
    allowApiCrud: true
})
export class dbRegressionUserStocks {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    userId = ""

    @Fields.string()
    stockName = ''

    @Fields.number()
    shareQty = 0

    @Fields.createdAt()
    createdAt?: Date

}
export const dbRegressionUserStocksRepo = remult.repo(dbRegressionUserStocks)