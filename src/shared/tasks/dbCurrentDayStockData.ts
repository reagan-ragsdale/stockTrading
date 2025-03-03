import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"

@Entity("dbCurrentDayStockData", {
    allowApiCrud: true
})
export class DbCurrentDayStockData {


    @Fields.string()
    stockName = ''

    @Fields.number()
    stockPrice = 0

    @Fields.number()
    time = 0

    static getCurrentStockDataByName = Filter.createCustom<DbCurrentDayStockData[], { stockName: string}>(async ({ stockName }) => {
        return {
            stockName: stockName
        }
    });



}
export const dbCurrentDayStockDataRepo = remult.repo(DbCurrentDayStockData)