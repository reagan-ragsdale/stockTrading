import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"

@Entity("dbLevelTwoData", {
    allowApiCrud: true
})
export class DbLevelTwoData {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    stockName = ''

    @Fields.number()
    marketSnapShotTime = 0

    @Fields.string()
    orderType = '' 

    @Fields.number()
    price = 0

    @Fields.number()
    aggregateSize = 0

    @Fields.number()
    marketMakerCount = 0

    @Fields.number()
    marketMakerId = 0

    @Fields.number()
    size = 0

    @Fields.number()
    quoteTime = 0

    @Fields.createdAt()
    createdAt?: Date

   /*  static getCurrentStockDataByName = Filter.createCustom<DbLevelTwoData[], { stockName: string}>(async ({ stockName }) => {
        return {
            stockName: stockName
        }
    }); */



}
export const dbLevelTwoDataRepo = remult.repo(DbLevelTwoData)