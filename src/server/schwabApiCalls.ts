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
        console.log('Schwab get account numbers eror: ' + error.message)
        return ''
    }
}

//get the information for the account based on the above number
export const getAccountInfo = async (accountInfo: DbTOkens): Promise<any> => {
    try {
        console.log(accountInfo.accountNum)
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
        console.log('Schwab get account info error: ' + error.message)
        return ''
    }
}

//get a list of orders for the account
export const getOrdersForAccount = async (accountInfo: DbTOkens): Promise<any> => {
    try {

        let startDate = new Date()
        startDate.setHours(5, 0, 0, 0)
        let fromDate = startDate.toISOString()
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
        console.log('Schwab get orders for account error: ' + error.message)
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
                'Authorization': `Bearer ${accountInfo.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    "orderType": order.orderType,
                    "session": order.session,
                    "duration": order.duration,
                    "orderStrategyType": order.orderStrategyType,
                    "orderLegCollection": [
                        {
                            "instruction": order.orderLegCollection[0].instruction,
                            "quantity": order.orderLegCollection[0].quantity,
                            "instrument": {
                                "symbol": order.orderLegCollection[0].instrument.symbol,
                                "assetType": order.orderLegCollection[0].instrument.assetType
                            }
                        }
                    ]
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
        console.log('aschwab replace order error: ' + error.message)
        return ''
    }
}




