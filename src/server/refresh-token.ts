import { Buffer } from 'node:buffer'
import { AuthController } from '../shared/controllers/AuthController.js'
import { URLSearchParams } from 'node:url';
import { dbTokenRepo, DbTOkens } from '../shared/tasks/dbTokens.js';
export const refreshCall = async (): Promise<string> => {
    console.log('here in before fetch')
    try {
        let userKeys = await dbTokenRepo.findFirst({id: { "!=":''}}) as DbTOkens
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



        const response = await fetch(url, options);
        const result = await response.json();
        let accessToken = result['access_token']
        return accessToken
    }
    catch (error: any) {
        console.log(error.message)
        return ''
    }
}

