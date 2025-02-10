import { Allow, Entity, Fields, Filter, remult, Validators } from "remult"
import { getCurrentUser } from "../../server/server-session"
import { userRepo } from "./Users"

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

    @Fields.string({ includeInApi: false })
    accessToken = ""

    @Fields.string({ includeInApi: false })
    refreshToken = ""

    @Fields.createdAt()
    createdAt?: Date


    static getTokenUpdates = Filter.createCustom<Rhkeys, {  }>(async () => {
        let currentUser = getCurrentUser()
        let userInfo = await userRepo.findFirst({id: currentUser.id})
        return {
          userId: userInfo?.userId 
        }
      });


    

}
export const rhRepo = remult.repo(Rhkeys)