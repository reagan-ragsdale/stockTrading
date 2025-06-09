import { BackendMethod, remult } from 'remult'
import { getAccountInfo, getAccountNumbers, getEnvironment, getOrdersForAccount } from '../../server/schwabApiCalls'
import { DbTOkens } from '../tasks/dbTokens.js'




export class SchwabController {

   static getAccountNumbers: typeof getAccountNumbers
   static getAccountInfo: typeof getAccountInfo
   static getEnvironment: typeof getEnvironment
   static getOrdersForAccount: typeof getOrdersForAccount

   @BackendMethod({ allowed: true })
   static async getAccountsNumberCall(accessToken: string): Promise<any> {
      return await SchwabController.getAccountNumbers(accessToken)

   }
   @BackendMethod({ allowed: true })
   static async getAccountInfoCall(accountInfo: DbTOkens): Promise<any> {
      return await SchwabController.getAccountInfo(accountInfo)

   }
   @BackendMethod({ allowed: true })
   static async getOrdersCall(accountInfo: DbTOkens): Promise<any> {
      return await SchwabController.getOrdersForAccount(accountInfo)

   }

   @BackendMethod({ allowed: true })
   static getEnvironmentCall(): string {
      return SchwabController.getEnvironment()
   }
}