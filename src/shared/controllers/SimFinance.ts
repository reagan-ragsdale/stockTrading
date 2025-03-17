import { BackendMethod, remult } from 'remult'
import type express from 'express'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type from 'cookie-session' // required to access the session member of the request object
import { v4 as uuidv4 } from 'uuid';

import type { generate, verify } from 'password-hash'
import { getCurrentUser, setSessionUser } from '../../server/server-session.js'
import { userRepo } from '../tasks/Users.js'
import { SimFInance, simFinRepo } from '../tasks/simFinance.js';
import { ROUTER_CONFIGURATION } from '@angular/router';

declare module 'remult' {
    export interface RemultContext {
        request?: express.Request
    }
}

export class SimFinance {

    @BackendMethod({ allowed: true })
    static async insertOrUpdateAmount(amnt: number) {
        const simFinUser = await simFinRepo.findFirst({userId: remult.context.request!.session!["user"].id})
        if (!simFinUser){
            await simFinRepo.insert({
                userId: remult.context.request!.session!["user"].id,
                spending: amnt,
                savings: 0
            })
        }
        else{
            let newAmount = simFinUser.spending + amnt
            await simFinRepo.save({...simFinUser, spending: newAmount})
        }
    }

    @BackendMethod({ allowed: true })
    static async getSimFinData(): Promise<SimFInance[]> {
        console.log(remult.context.request!.session!["user"])
        return await simFinRepo.find({where: {userId: remult.context.request!.session!["user"].id}})
    }
    @BackendMethod({ allowed: true })
    static async getSimFinDataByUser(userId: string): Promise<SimFInance[]> {
        return await simFinRepo.find({where: {userId: userId}})
    }
    

    @BackendMethod({ allowed: true })
    static async createNewSimUser() {
        await simFinRepo.insert({
            userId: remult.context.request!.session!["user"].id,
            savings: 0,
            spending: 0
        })
    }

}