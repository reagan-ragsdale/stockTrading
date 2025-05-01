import { BackendMethod, remult } from 'remult'
import { getAccountNumbers } from '../../server/schwabApiCalls'




export class SchwabController {

    static getAccountNumbers: typeof getAccountNumbers
  
    @BackendMethod({ allowed: true })
    static async getAccountsNumberCall(accessToken: string): Promise<any> {
       return await SchwabController.getAccountNumbers(accessToken)
  
    }
}