import { refreshCall } from "../../server/refresh-token.js"
import { AuthController } from "../../shared/controllers/AuthController.js"
import { OAuthContoller } from "../../shared/controllers/OAuthController.js"
import { ServerTradeStrategies } from "../services/serverTradeStrategies.js"

export const loadNewToken = async () => {
    //let token = await OAuthContoller.sendRefreshCall()
    let users = await AuthController.getTokenUsers()
    for (let i = 0; i < users.length; i++) {
        let token = await refreshCall(users[i])
        if (token != '') {
            await AuthController.updateGlobalAccessToken(token, users[i].userId)
            ServerTradeStrategies.setAccessToken(token)
        }
        else {
            await AuthController.setNeedsNewTokens(users[i].userId)
        }
    }



}