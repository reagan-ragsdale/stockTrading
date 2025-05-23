import { Buffer} from 'node:buffer'
import { AuthController } from '../shared/controllers/AuthController.js'
import { URLSearchParams } from 'node:url';
export const oauthCall = async (code: string) => {
    await AuthController.resetUser()
    let userKeys = await AuthController.getTokenUserByRemult()
    let credentials = Buffer.from(`${userKeys!.appKey}:${userKeys!.appSecret}`).toString('base64')
    let payload = new URLSearchParams({
        grant_type: 'authorization_code', code: code, redirect_uri: 'https://stocktrading.up.railway.app/auth'
    })
    const url = 'https://api.schwabapi.com/v1/oauth/token';
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
        
    };


    try {
        const response = await fetch(url, options);
        const result = await response.json();
        let refreshToken = result['refresh_token']
        let accessToken = result['access_token']
        await AuthController.updateGlobalAccessTokens(accessToken, refreshToken, userKeys!.userId)
    }
    catch (error: any) {
        console.log('OAuth-server call: ' + error.message)
    }
}

