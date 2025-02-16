import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("simFinance", {
    allowApiCrud: true
})
export class SimFInance {

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
export const simFinRepo = remult.repo(SimFInance)