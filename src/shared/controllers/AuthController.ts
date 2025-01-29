import { BackendMethod, remult } from 'remult'
import type express from 'express'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type from 'cookie-session' // required to access the session member of the request object

import type { generate, verify } from 'password-hash'
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js'

declare module 'remult' {
    export interface RemultContext {
        request?: express.Request
    }
}



export class AuthController {
    static generate: typeof generate;
  static verify: typeof verify;

    @BackendMethod({ allowed: true })
    static async logIn(username: string, password: string) {
        const user = await userRepo.findFirst({ userName: username })
        if (!user)
          throw Error("Invalid Credentials")
        if (!AuthController.verify(password, user.userPass))
          throw Error("Invalid Credentials")
        return setSessionUser({
          id: user.id!,
          name: user.userName!,
          roles: user.isAdmin ? ['admin'] : []
        })
      }

    @BackendMethod({ allowed: true })
    static async signOut() {
        remult.context.request!.session!['user'] = undefined
        return undefined
    }

    @BackendMethod({ allowed: true })
    static async signUp(username: string, password: string, apiKey: string) {
        let users = await userRepo.find({ where: { userName: username } })
        if (users.length > 0) {
          throw Error('There is someone already with that username')
        }
        else {
          if (!password) throw Error('Password is required')
            if(password.length < 8) throw Error('Password length must be at least 8 characters')
          const user = await userRepo.insert({
            userName: username,
            userPass: AuthController.generate(password),
            IBKRApiKey: AuthController.generate(apiKey)
          })
        
          return setSessionUser({
            id: user.id!,
            name: user.userName!,
            roles: user.isAdmin ? ['admin'] : []
          })
        }
    
      }

      @BackendMethod({ allowed: true })
  static async currentUser() {
    return getCurrentUser();
  }
}