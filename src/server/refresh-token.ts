import { Buffer} from 'node:buffer'
import { AuthController } from '../shared/controllers/AuthController.js'
import { URLSearchParams } from 'node:url';
export const refreshCall = async (): Promise<string> => {
    console.log('here in before fetch')
    let userKeys = await AuthController.getKeyPairs()
    let credentials = Buffer.from(`${userKeys.appKey}:${userKeys.appSecret}`).toString('base64')
    let payload = new URLSearchParams({
        grant_type: 'refresh_token', refresh_token: userKeys.refreshToken
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
        console.log(result)
        let accessToken = result['access_token']
        return accessToken
    }
    catch (error: any) {
        console.log(error.message)
        return ''
    }
}

