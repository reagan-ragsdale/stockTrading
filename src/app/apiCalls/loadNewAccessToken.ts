import { AuthController } from "../../shared/controllers/AuthController.js"
import { OAuthContoller } from "../../shared/controllers/OAuthController.js"

export const loadNewToken = async () => {
    console.log('here in token')
    let token = await OAuthContoller.sendRefreshCall()
    if(token != ''){
        await AuthController.updateAccessToken(token)
        console.log('updated token')
    }
    
    
}