import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"

@Entity("dbTokens", {
    allowApiCrud: true
})
export class DbTOkens {

    @Fields.cuid()
    id? = ''

    @Fields.string({ includeInApi: true })
    userId = ''

    @Fields.string({ includeInApi: true })
    appKey = ""

    @Fields.string({ includeInApi: true })
    appSecret = ""

    @Fields.string({ includeInApi: true })
    accessToken = ""

    @Fields.string({ includeInApi: true })
    refreshToken = ""

    @Fields.string({ includeInApi: true })
    streamerSocketUrl = ""

    @Fields.string({ includeInApi: true })
    schwabClientCustomerId = ""

    @Fields.string({ includeInApi: true })
    schwabClientCorrelId = ""

    @Fields.string({ includeInApi: true })
    schwabClientChannel = ""

    @Fields.string({ includeInApi: true })
    schwabClientFunctionId = ""

    @Fields.boolean({ includeInApi: true })
    needsNewAuth = true

    @Fields.createdAt()
    createdAt?: Date
    
}
export const dbTokenRepo = remult.repo(DbTOkens)