import { BackendMethod, remult } from 'remult'
import { getAccountNumbers } from '../../server/schwabApiCalls'




export class SchwabController {

    static getAccounts: typeof getAccountNumbers
  
    @BackendMethod({ allowed: true })
    static async getAccountsCall(accessToken: string): Promise<any> {
       return await SchwabController.getAccounts(accessToken)
  
    }
}