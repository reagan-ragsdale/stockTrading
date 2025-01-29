import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("DbUsers", {
    allowApiCrud: true
})
export class DbUsers {

    @Fields.cuid()
    id? = ''

    @Fields.string()
    userName = ""

    @Fields.string({ includeInApi: false })
    userPass = ""

    @Fields.string({ includeInApi: false })
    IBKRApiKey = ""

    @Fields.boolean()
    isAdmin = false

    

    @Fields.createdAt()
    createdAt?: Date


    

}
export const userRepo = remult.repo(DbUsers)