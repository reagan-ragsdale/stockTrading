export const getAccounts = async (accessToken: string): Promise<any> => {
    try {
        
        const url = `https://api.schwabapi.com/trader/v1/accounts`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const response = await fetch(url, options);
        const result = await response.json();
        return result
    }
    catch (error: any) {
        console.log('refreshToken server: ' + error.message)
        return ''
    }
}

export const getAccountInfo = async (accountNumber: string, accessToken: string): Promise<any> => {
    try {
        
        const url = `https://api.schwabapi.com/v1/accounts/${accountNumber}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const response = await fetch(url, options);
        const result = await response.json();
        return result
    }
    catch (error: any) {
        console.log('refreshToken server: ' + error.message)
        return ''
    }
}
export const getOrdersForAccount = async (accountNumber: string, accessToken: string): Promise<any> => {
    try {
        let startDate = new Date()
        startDate.setHours(5, 0, 0, 0)
        let fromDate = startDate.toISOString()
        let toDate = new Date().toISOString()
        const url = `https://api.schwabapi.com/v1/accounts/${accountNumber}/orders?fromEnteredTime=${fromDate}&toEnteredTime=${toDate}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const response = await fetch(url, options);
        const result = await response.json();
        return result
    }
    catch (error: any) {
        console.log('refreshToken server: ' + error.message)
        return ''
    }
}
export const placeOrderForAccount = async (accountNumber: string, accessToken: string): Promise<any> => {
    try {
        let startDate = new Date()
        startDate.setHours(5, 0, 0, 0)
        let fromDate = startDate.toISOString()
        let toDate = new Date().toISOString()
        const url = `https://api.schwabapi.com/v1/accounts/${accountNumber}/orders?fromEnteredTime=${fromDate}&toEnteredTime=${toDate}`;
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const response = await fetch(url, options);
        const result = await response.json();
        return result
    }
    catch (error: any) {
        console.log('refreshToken server: ' + error.message)
        return ''
    }
}


