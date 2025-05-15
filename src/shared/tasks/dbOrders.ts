import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("dbOrders", {
    allowApiCrud: true
})
export class DbOrders {

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

    @Fields.number()
    orderId = 0

    @Fields.string()
    tradeStrategy = ''

    @Fields.createdAt()
    createdAt?: Date


    

}
export const dbOrdersRepo = remult.repo(DbOrders)