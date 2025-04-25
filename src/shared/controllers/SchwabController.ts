import { BackendMethod, remult } from 'remult'
import { getAccounts } from '../../server/schwabApiCalls'




export class SchwabController {

    static getAccounts: typeof getAccounts
  
    @BackendMethod({ allowed: true })
    static async getAccountsCall(accessToken: string): Promise<any> {
       return await SchwabController.getAccounts(accessToken)
  
    }
}