import { SchwabOrderDTO } from "../app/Dtos/TradingBotDtos";
import { AuthController } from "../shared/controllers/AuthController";
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens";


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
export const getAccountInfo = async (accountNumber: string, accessToken: string): Promise<any> => {
    try {
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountNumber}`;
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

//get a list of orders for the account
export const getOrdersForAccount = async (): Promise<any> => {
    try {
        let token = await dbTokenRepo.findFirst({ id: 'asdfghjkl' }) as DbTOkens
        let startDate = new Date()
        startDate.setHours(5, 0, 0, 0)
        let fromDate = startDate.toUTCString()
        let toDate = new Date().toISOString()
        const url = `https://api.schwabapi.com/v1/accounts/${token.accountNum}/orders?fromEnteredTime=${fromDate}&toEnteredTime=${toDate}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.accessToken}`
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
export const placeOrderForAccount = async (accountNumber: string, accessToken: string, order: SchwabOrderDTO): Promise<any> => {
    try {
        const url = `https://api.schwabapi.com/v1/accounts/${accountNumber}/orders`;
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
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
        console.log('refreshToken server: ' + error.message)
        return ''
    }
}
//replace an order for an account
export const replaceOrderForAccount = async (accountNumber: string, accessToken: string, orderId: number): Promise<any> => {
    try {
        const url = `https://api.schwabapi.com/v1/accounts/${accountNumber}/orders?`;
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




