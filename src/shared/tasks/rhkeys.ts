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
    publicKey = ""

    @Fields.string({ includeInApi: false })
    privateKey = ""

    @Fields.string({ includeInApi: false })
    apiKey = ""


    @Fields.createdAt()
    createdAt?: Date


    

}
export const rhRepo = remult.repo(Rhkeys)