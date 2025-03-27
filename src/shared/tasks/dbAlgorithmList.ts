import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"

@Entity("dbAlgorithmList", {
    allowApiCrud: true
})
export class DbAlgorithmList {

    @Fields.string()
    userId = ''

    @Fields.boolean()
    sma200sma50 = false

}
export const dbAlgorithmListRepo = remult.repo(DbAlgorithmList)