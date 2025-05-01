import { dbTokenRepo } from "../../shared/tasks/dbTokens.js"

export const resetTokens = async () => {
    console.log('here in reset token file')
    let listOfUsers = await dbTokenRepo.find()
    for(let i = 0; i < listOfUsers.length; i++){
        let selectectedUser = listOfUsers[i]
        await dbTokenRepo.save({...selectectedUser, needsNewAuth: true})
    }
}