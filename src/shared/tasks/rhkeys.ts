import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("rhkeys", {
    allowApiCrud: true
})
export class Rhkeys {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    userId = ""

    @Fields.string({ includeInApi: false })
    appKey = ""

    @Fields.string({ includeInApi: false })
    appSecret = ""


    @Fields.createdAt()
    createdAt?: Date


    

}
export const rhRepo = remult.repo(Rhkeys)