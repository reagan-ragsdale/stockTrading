import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("regressionFinance", {
    allowApiCrud: true
})
export class RegressionFinance {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    userId = ""

    @Fields.number()
    spending = 0

    @Fields.number()
    savings = 0


    @Fields.createdAt()
    createdAt?: Date


    

}
export const regFinRepo = remult.repo(RegressionFinance)