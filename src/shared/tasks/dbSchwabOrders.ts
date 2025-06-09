import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("dbSchwabOrders", {
    allowApiCrud: true
})
export class DbSchwabOrders {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    accountNum = ""

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
export const dbSchwabOrdersRepo = remult.repo(DbSchwabOrders)