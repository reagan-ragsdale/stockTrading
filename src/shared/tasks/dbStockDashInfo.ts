import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("dbStockDashInfo", {
    allowApiCrud: true
})
export class DbStockDashInfo {

    @Fields.string()
    stockName = ''

    @Fields.number()
    open = 0

    @Fields.number()
    current = 0
}
export const dbStockDashInfoRepo = remult.repo(DbStockDashInfo)