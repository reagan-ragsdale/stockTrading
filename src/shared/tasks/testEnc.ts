import { Allow, Entity, Fields, remult, Validators } from "remult"

@Entity("testEnc", {
    allowApiCrud: true
})
export class testEnc {

    @Fields.cuid()
    id? = ''


    @Fields.string({ includeInApi: false })
    userId = ""

    @Fields.string({ includeInApi: false })
    testPass = ""

    @Fields.createdAt()
    createdAt?: Date


    

}
export const testEncRepo = remult.repo(testEnc)