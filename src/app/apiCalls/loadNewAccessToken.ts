import { AuthController } from "../../shared/controllers/AuthController.js"
import { OAuthContoller } from "../../shared/controllers/OAuthController.js"

export const loadNewToken = async () => {
    let token = await OAuthContoller.sendRefreshCall()
    if(token != ''){
        await AuthController.updateAccessToken(token)
    }
    
}