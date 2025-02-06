import { Allow, BackendMethod, remult } from "remult"
import type { oauthCall } from "../../server/oauth-server"







export class OAuthContoller {


  static sendCall: typeof oauthCall

  @BackendMethod({ allowed: true })
  static async sendOauthCall(code: string): Promise<string[]> {
    return OAuthContoller.sendCall(code)

  }


}

