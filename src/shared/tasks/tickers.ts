import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("tickers", {
    allowApiCrud: true
})
export class tickers {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    name = ""

    @Fields.string()
    exchange = ""

    @Fields.createdAt()
    createdAt?: Date




}
export const tickerRepo = remult.repo(tickers)