import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("usersStocks", {
    allowApiCrud: true
})
export class UsersStocks {

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
export const usersStocksRepo = remult.repo(UsersStocks)