import { refreshCall } from "../../server/refresh-token.js"
import { AuthController } from "../../shared/controllers/AuthController.js"
import { OAuthContoller } from "../../shared/controllers/OAuthController.js"

export const loadNewToken = async () => {
    console.log('here in token')
    //let token = await OAuthContoller.sendRefreshCall()
    let users = await AuthController.getTokenUsers()
    for (let i = 0; i < users.length; i++) {
        let token = await refreshCall(users[i])
        if (token != '') {
            await AuthController.updateGlobalAccessToken(token, users[i].userId)
            console.log('updated token')
        }
        else{
            await AuthController.setNeedsNewTokens(users[i].userId)
        }
    }



}