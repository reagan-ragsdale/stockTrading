import { BackendMethod, remult } from 'remult'
import type express from 'express'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type from 'cookie-session' // required to access the session member of the request object
import { v4 as uuidv4 } from 'uuid';

import type { generate, verify } from 'password-hash'
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js'
import { rhRepo } from '../tasks/rhkeys.js';
import { api } from '../../server/api.js';

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
  static async signUp(username: string, password: string, confirmPassword: string) {
    if (password != confirmPassword) throw Error('Passwords must match')
    let users = await userRepo.find({ where: { userName: username } })
    if (users.length > 0) {
      throw Error('There is someone already with that username')
    }
    else {
      if (!password) throw Error('Password is required')
      if (password.length < 8) throw Error('Password length must be at least 8 characters')
      const user = await userRepo.insert({
        userName: username,
        userPass: AuthController.generate(password),
        userId: AuthController.generate(uuidv4())
      })

      return setSessionUser({
        id: user.id!,
        name: user.userName!,
        roles: user.isAdmin ? ['admin'] : []
      })
    }

  }

  @BackendMethod({ allowed: true })
  static async insertKeyPairs(publicKey: string, privateKey: string, apiKey: string) {
    let currentUser = await this.currentUser()
    let userInfo = await userRepo.findFirst({id: currentUser.id})
      await rhRepo.insert({
        userId: userInfo?.userId,
        publicKey: AuthController.generate(publicKey),
        privateKey: AuthController.generate(privateKey),
        apiKey: AuthController.generate(apiKey)
      })

  }

  @BackendMethod({ allowed: true })
  static async checkKeyGeneration(): Promise<boolean> {
    let currentUser = await this.currentUser()
    let userInfo = await userRepo.findFirst({id: currentUser.id})
    let userKeyData = await rhRepo.findFirst({userId: userInfo?.userId})
    if(userKeyData){
      return true
    }
    else{
      return false
    }
  }

  @BackendMethod({ allowed: true })
  static async changeUserName(username: string){
    const currentUser = await this.currentUser()
    const user = await userRepo.findFirst({id: currentUser.id})
    await userRepo.save({...user, userName: username})
  }
  @BackendMethod({ allowed: true })
  static async changePassword(password: string){
    const currentUser = await this.currentUser()
    const user = await userRepo.findFirst({id: currentUser.id})
    await userRepo.save({...user, userPass: AuthController.generate(password)})
  }


  

  @BackendMethod({ allowed: true })
  static async currentUser() {
    return getCurrentUser();
  }
}