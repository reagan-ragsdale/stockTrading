import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"

@Entity("dbTokens", {
    allowApiCrud: true
})
export class DbTOkens {

    @Fields.cuid()
    id? = ''
    @Fields.string({ includeInApi: false })
    appKey = ""

    @Fields.string({ includeInApi: false })
    appSecret = ""

    @Fields.string({ includeInApi: true })
    accessToken = ""

    @Fields.string({ includeInApi: true })
    refreshToken = ""

    @Fields.createdAt()
    createdAt?: Date
    

}
export const dbTokenRepo = remult.repo(DbTOkens)