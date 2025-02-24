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
    static async insertOrUpdateAmount(spending: number, savings?: number) {
        const userInfo = getCurrentUser()
        const user = await userRepo.findFirst({ id: userInfo.id })
        const simFinUser = await simFinRepo.findFirst({userId: user?.userId})
        if (!simFinUser){
            await simFinRepo.insert({
                userId: user?.userId,
                spending: spending,
                savings: 0
            })
        }
        else{
            let newAmount = simFinUser.spending + spending
            let newSavings = simFinUser.savings
            if(savings !== undefined){
                newSavings += savings
            }
            await simFinRepo.save({...simFinUser, spending: newAmount, savings: newSavings})
        }
    }

    @BackendMethod({ allowed: true })
    static async getSimFinData(): Promise<SimFInance[]> {
        console.log('here in sim fin data')
        const userInfo = getCurrentUser()
        console.log('here after sim fin data')
        const user = await userRepo.findFirst({ id: userInfo.id })
        return await simFinRepo.find({where: {userId: user?.userId}})
    }

    @BackendMethod({ allowed: true })
    static async createNewSimUser() {
        const userInfo = getCurrentUser()
        const user = await userRepo.findFirst({ id: userInfo.id })
        await simFinRepo.insert({
            userId: user?.userId,
            savings: 0,
            spending: 0
        })
    }

}