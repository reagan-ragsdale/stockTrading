import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("dbStockHistoryData", {
    allowApiCrud: true
})
export class DbStockHistoryData {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    stockName = ''

    @Fields.number()
    stockPrice = ''

    @Fields.number()
    time = 0

    @Fields.createdAt()
    createdAt?: Date


    

}
export const dbStockHistoryDataRepo = remult.repo(DbStockHistoryData)