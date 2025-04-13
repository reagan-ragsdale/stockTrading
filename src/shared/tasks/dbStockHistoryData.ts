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
    stockPrice = 0

    @Fields.number()
    askPrice = 0

    @Fields.number()
    bidPrice = 0

    @Fields.number()
    time = 0

    @Fields.string()
    date = ''

    @Fields.createdAt()
    createdAt?: Date


    

}
export const dbStockHistoryDataRepo = remult.repo(DbStockHistoryData)