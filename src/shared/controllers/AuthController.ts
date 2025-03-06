import { BackendMethod, remult, UserInfo } from 'remult'
import type express from 'express'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type from 'cookie-session' // required to access the session member of the request object
import { v4 as uuidv4 } from 'uuid';

import type { generate, verify } from 'password-hash'
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js'
import { Rhkeys, rhRepo } from '../tasks/rhkeys.js';
import { dbTokenRepo, DbTOkens } from '../tasks/dbTokens.js';

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
    remult.user = {
      id: user.userId,
      name: user.userName,
      roles: user.isAdmin ? ["admin"] : [],
    };
    console.log(remult.user)
    remult.context.request!.session!["user"] = remult.user;
    return remult.user;
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
        id: user.userId!,
        name: user.userName!,
        roles: user.isAdmin ? ['admin'] : []
      })
    }

  }

  @BackendMethod({ allowed: true })
  static async insertKeyPairs(publicKey: string, privateKey: string) {
    let token = await dbTokenRepo.findFirst({userId: remult.context.request!.session!["user"].id})
    await dbTokenRepo.save({...token,
      appKey: publicKey,
      appSecret: privateKey
    })

  }
  @BackendMethod({ allowed: true })
  static async getKeyPairs(): Promise<DbTOkens> {
    return await dbTokenRepo.findFirst({ userId: remult.context.request!.session!["user"].id }) as DbTOkens

  }

  @BackendMethod({ allowed: true })
  static async checkKeyGeneration(): Promise<boolean> {
    let userKeyData = await dbTokenRepo.findFirst({ userId: remult.context.request!.session!["user"].id })
    if (userKeyData?.appKey !== '') {
      return true
    }
    else {
      return false
    }
  }

  @BackendMethod({ allowed: true })
  static async updateTokens(tokens: string[]) {
    let keys = await rhRepo.findFirst({ userId: remult.context.request!.session!["user"].id })
    await rhRepo.save({ ...keys, accessToken: tokens[0], refreshToken: tokens[1] })
    let tokenRepo = await dbTokenRepo.findFirst({ id: { '!=': '' } })
    await dbTokenRepo.save({ ...tokenRepo, accessToken: tokens[0], refreshToken: tokens[1] })

  }

  @BackendMethod({ allowed: true })
  static async updateAccessToken(token: string) {
    let keys = await rhRepo.findFirst({ userId: remult.context.request!.session!["user"].id })
    await rhRepo.save({ ...keys, accessToken: token })

  }


  @BackendMethod({ allowed: true })
  static async changeUserName(username: string) {
    const currentUser = getCurrentUser()
    const user = await userRepo.findFirst({ id: currentUser.id })
    await userRepo.save({ ...user, userName: username })
  }
  @BackendMethod({ allowed: true })
  static async changePassword(password: string) {
    const currentUser = await this.currentUser()
    const user = await userRepo.findFirst({ id: currentUser.id })
    await userRepo.save({ ...user, userPass: AuthController.generate(password) })
  }
  @BackendMethod({ allowed: true })
  static async updateGlobalAccessToken(accessToken: string, userId: string) {
    let tokenObj = await dbTokenRepo.findFirst({ userId: userId })
    await dbTokenRepo.save({ ...tokenObj, accessToken: accessToken,  needsNewAuth: false})
  }
  @BackendMethod({ allowed: true })
  static async updateGlobalAccessTokens(accessToken: string, refreshToken: string, userId: string) {
    let tokenObj = await dbTokenRepo.findFirst({ userId: userId })
    await dbTokenRepo.save({ ...tokenObj, accessToken: accessToken, refreshToken: refreshToken,  needsNewAuth: false})
  }
  @BackendMethod({ allowed: true })
  static async setNeedsNewTokens(userId: string) {
    let tokenObj = await dbTokenRepo.findFirst({ userId: userId })
    await dbTokenRepo.save({ ...tokenObj,  needsNewAuth: true})
  }


  /* @BackendMethod({ allowed: true })
  static async getUserPreference(){
    let tokenObj = dbTokenRepo.findFirst({id: {"!=" : ''}})
    await dbTokenRepo.save({...tokenObj, accessToken: accessToken})
  } */

  @BackendMethod({ allowed: true })
  static async resetUser() {
    remult.context.request!.session!["user"] = remult.user;
  }

  @BackendMethod({ allowed: true })
  static async insertTokenData(userPReference: any) {
    let userToken = await dbTokenRepo.findFirst({userId: remult.context.request!.session!["user"].id})
    await dbTokenRepo.save({...userToken, 
       streamerSocketUrl: userPReference.streamerInfo[0].streamerSocketUrl,
      schwabClientCustomerId: userPReference.streamerInfo[0].schwabClientCustomerId, schwabClientCorrelId: userPReference.streamerInfo[0].schwabClientCorrelId,
      schwabClientChannel: userPReference.streamerInfo[0].schwabClientChannel, schwabClientFunctionId: userPReference.streamerInfo[0].schwabClientFunctionId
    })
  }

  @BackendMethod({ allowed: true })
  static async getTokenUsers(): Promise<DbTOkens[]> {
    return await dbTokenRepo.find({where: {needsNewAuth: false}})
  }
  @BackendMethod({ allowed: true })
  static async getTokenUser(userId: string): Promise<DbTOkens | undefined> {
    return await dbTokenRepo.findFirst({userId: userId})
  }
  @BackendMethod({ allowed: true })
  static async getTokenUserByRemult(): Promise<DbTOkens | undefined> {
    return await dbTokenRepo.findFirst({userId: remult.context.request!.session!["user"].id})
  }
  @BackendMethod({ allowed: true })
  static async createTokenUser(userId:string) {
    await dbTokenRepo.insert({userId: userId})
  }

  








  @BackendMethod({ allowed: true })
  static async currentUser() {
    return getCurrentUser();
  }
}