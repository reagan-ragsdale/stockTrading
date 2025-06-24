import { BackendMethod, remult } from 'remult'
import { getAccountInfo, getAccountNumbers, getEnvironment, getOrdersForAccount, getOrdersForAccountById, placeOrderForAccount } from '../../server/schwabApiCalls'
import { DbTOkens } from '../tasks/dbTokens.js'
import { SchwabOrderDTO } from '../../app/Dtos/TradingBotDtos'




export class SchwabController {

   static getAccountNumbers: typeof getAccountNumbers
   static getAccountInfo: typeof getAccountInfo
   static getEnvironment: typeof getEnvironment
   static getOrdersForAccount: typeof getOrdersForAccount
   static placeOrderForAccount: typeof placeOrderForAccount
   static getOrderByIdForAccount: typeof getOrdersForAccountById

   @BackendMethod({ allowed: true })
   static async getAccountsNumberCall(accessToken: string): Promise<any> {
      return await SchwabController.getAccountNumbers(accessToken)

   }
   @BackendMethod({ allowed: true })
   static async getAccountInfoCall(accountNum: string, accessToken: string): Promise<any> {
      return await SchwabController.getAccountInfo(accountNum, accessToken)

   }
   @BackendMethod({ allowed: true })
   static async getOrdersCall(accountNum: string, accessToken: string): Promise<any> {
      return await SchwabController.getOrdersForAccount(accountNum, accessToken)

   }
   @BackendMethod({ allowed: true })
   static async getOrderByIdCall(accountNum: string, accessToken: string, orderId: number): Promise<any> {
      return await SchwabController.getOrderByIdForAccount(accountNum, accessToken, orderId)

   }
   @BackendMethod({ allowed: true })
   static async placeOrdersCall(accountNum: string, accessToken: string, order: SchwabOrderDTO): Promise<any> {
      return await SchwabController.placeOrderForAccount(accountNum, accessToken, order)

   }

   @BackendMethod({ allowed: true })
   static getEnvironmentCall(): string {
      return SchwabController.getEnvironment()
   }
}