import { OrderApiResponse, SchwabOrderDTO } from "../app/Dtos/TradingBotDtos";
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
export const getAccountInfo = async (accountNum: string, accessToken: string) => {
    try {
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountNum}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'accept': 'application/json'
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
export const getOrdersForAccount = async (accountNum: string, accessToken: string): Promise<any[]> => {
    try {

        let startDate = new Date()
        startDate.setHours(5, 0, 0, 0)
        let fromDate = startDate.toISOString()
        let toDate = new Date().toISOString()
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountNum}/orders?fromEnteredTime=${fromDate}&toEnteredTime=${toDate}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'accept': 'application/json'
            }
        };

        const response = await fetch(url, options);
        console.log('get specific order response')
        console.log(response)
        const result = await response.json();
        return result
    }
    catch (error: any) {
        console.log('Schwab get orders for account error: ' + error.message)
        return []
    }
}

//get specific order by id
export const getOrdersForAccountById = async (accountNum: string, accessToken: string, orderId: number): Promise<any> => {
    try {
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountNum}/orders/${orderId}`;
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'accept': 'application/json'
            }
        };

        const response = await fetch(url, options);
        const result = await response.json();
        return result
    }
    catch (error: any) {
        console.log('Schwab get orders for account error: ' + error.message)
        return {}
    }
}
//place an order for an account
export const placeOrderForAccount = async (accountNum: string, accessToken: string, order: SchwabOrderDTO) => {
    let returnData: OrderApiResponse = {
        code: 0,
        message: ''
    }
    try {
        const url = `https://api.schwabapi.com/trader/v1/accounts/${accountNum}/orders`;
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
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

        if (response.ok) {
            console.log('Trade response')
            console.log(response)
            const order = response.headers.get('Location')



            const orderId = order ? Number(order.split('/').pop()) : 0

            returnData.code = 201
            returnData.message = ''
            returnData.orderId = orderId
        }
        else {
            returnData.code = response.status
            returnData.message = 'Error'
        }


    }
    catch (error: any) {
        console.log('Schwab place order error: ' + error.message)
        returnData.code = 999
        returnData.message = error.message
    }
    return returnData

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




