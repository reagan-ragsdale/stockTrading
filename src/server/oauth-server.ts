import { Buffer} from 'node:buffer'
import { AuthController } from '../shared/controllers/AuthController.js'
export const oauthCall = async (code: string): Promise<string[]> => {
    let userKeys = await AuthController.getKeyPairs()
    console.log('here')
    let credentials = Buffer.from(`${userKeys.appKey}:${userKeys.appSecret}`).toString('base64')
    console.log(credentials)
    console.log(code)
    const url = 'https://api.schwabapi.com/v1/oauth/token';
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify({
            grant_type: 'authorization_code', code: code, redirect_uri: 'https://stocktrading.up.railway.app'
        })
        
    };


    try {
        const response = await fetch(url, options);
        const result = await response.json();
        console.log(result)
        let refreshToken = result['refresh_token']
        let accessToken = result['access_token']
        return [accessToken, refreshToken]
    }
    catch (error: any) {
        console.log(error.message)
        return []
    }
}

