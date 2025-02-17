import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("dbREgressionOrders", {
    allowApiCrud: true
})
export class DbRegressionOrders {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    userId = ""

    @Fields.string()
    stockName = ''

    @Fields.string()
    orderType = ''

    @Fields.number()
    stockPrice = 0

    @Fields.number()
    shareQty = 0

    @Fields.number()
    orderTime = 0

    @Fields.createdAt()
    createdAt?: Date


    

}
export const dbRegressionOrdersRepo = remult.repo(DbRegressionOrders)