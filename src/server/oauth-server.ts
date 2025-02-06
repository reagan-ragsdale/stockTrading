export const oauthCall = async (credentials: string, code: string): Promise<string[]> => {
    console.log('here')
    const url = 'https://api.schwabapi.com/v1/oauth/token';
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
            'grant_type': 'authorization_code', 'code': code, 'redirect_uri': 'https://stocktrading.up.railway.app'
        }
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

