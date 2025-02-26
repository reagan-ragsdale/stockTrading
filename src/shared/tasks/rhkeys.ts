import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"
import { getCurrentUser } from "../../server/server-session.js"
import { userRepo } from "./Users.js"

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

    @Fields.string({ includeInApi: true })
    accessToken = ""

    @Fields.string({ includeInApi: true })
    refreshToken = ""

    @Fields.createdAt()
    createdAt?: Date


    static getTokenUpdates = Filter.createCustom<Rhkeys, { id: string }>(async ({id}) => {
       
        return {
          userId: id
        }
      });


    

}
export const rhRepo = remult.repo(Rhkeys)