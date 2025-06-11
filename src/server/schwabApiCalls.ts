import { SchwabOrderDTO } from "../app/Dtos/TradingBotDtos";
import { AuthController } from "../shared/controllers/AuthController";
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js";


export const getEnvironment = (): string => {
    return process.env['environment']!
}

//get the encrypted account number
export const getAccountNumbers = async (accessToken: string): Promise<any> => {
    try {

        const url = `https://api.schwabapi.com/trader/v1/accounts/accountNumbers`;
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

//get the information for the account based on the above number
export const getAccountInfo = async (accountInfo: DbTOkens): Promise<any> => {
    try {
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountInfo.accountNum}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accountInfo.accessToken}`
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

//get a list of orders for the account
export const getOrdersForAccount = async (accountInfo: DbTOkens): Promise<any> => {
    try {

        let startDate = new Date()
        startDate.setHours(5, 0, 0, 0)
        let fromDate = startDate.toUTCString()
        let toDate = new Date().toISOString()
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountInfo.accountNum}/orders?fromEnteredTime=${fromDate}&toEnteredTime=${toDate}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accountInfo.accessToken}`
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
//place an order for an account
export const placeOrderForAccount = async (accountInfo: DbTOkens, order: SchwabOrderDTO): Promise<any> => {
    try {
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountInfo.accountNum}/orders`;
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accountInfo.accessToken}`
            },
            body: JSON.stringify(
                {
                    "orderType": order.orderType,
                    "session": order.session,
                    "duration": order.duration,
                    "orderStrategyType": order.orderStrategyType,
                    "orderLegCollection": order.orderLegCollection
                }
            )
        };

        const response = await fetch(url, options);
        const result = await response.json();
        return result
    }
    catch (error: any) {
        console.log('Schwab place order error: ' + error.message)
        return ''
    }
}
//replace an order for an account
export const replaceOrderForAccount = async (accountNumber: string, accessToken: string, orderId: number): Promise<any> => {
    try {
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountNumber}/orders?`;
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




