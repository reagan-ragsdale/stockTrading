import { Allow, BackendMethod, remult } from "remult"
import type { oauthCall } from "../../server/oauth-server"
import type { refreshCall } from "../../server/refresh-token"







export class OAuthContoller {


  static sendCall: typeof oauthCall
  static sendRefresh: typeof refreshCall

  @BackendMethod({ allowed: true })
  static async sendOauthCall(code: string) {
     await OAuthContoller.sendCall(code)

  }
  /* @BackendMethod({ allowed: true })
  static async sendRefreshCall(): Promise<string> {
    console.log('here in oauth controller call')
    return OAuthContoller.sendRefresh()
  } */


}

