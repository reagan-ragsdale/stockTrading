import { BackendMethod, remult } from 'remult'
import type express from 'express'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type from 'cookie-session' // required to access the session member of the request object
import { getCurrentUser } from '../../server/server-session.js';
import { userRepo } from '../tasks/Users.js'
import { regFinRepo, RegressionFinance } from '../tasks/regressionFinance.js';

declare module 'remult' {
    export interface RemultContext {
        request?: express.Request
    }
}

export class RegFinanceController {

    @BackendMethod({ allowed: true })
    static async insertOrUpdateAmountReg(spending: number, savings?: number) {
        const userInfo = getCurrentUser()
        const user = await userRepo.findFirst({ id: userInfo.id })
        const regFinUser = await regFinRepo.findFirst({userId: user?.userId})
        if (!regFinUser){
            await regFinRepo.insert({
                userId: user?.userId,
                spending: spending,
                savings: 0
            })
        }
        else{
            let newAmount = regFinUser.spending + spending
            let newSavings = regFinUser.savings
            if(savings !== undefined){
                newSavings += savings
            }
            await regFinRepo.save({...regFinUser, spending: newAmount, savings: newSavings})
        }
    }

    @BackendMethod({ allowed: true })
    static async getRegSimFinData(): Promise<RegressionFinance[]> {
        const userInfo = getCurrentUser()
        const user = await userRepo.findFirst({ id: userInfo.id })
        return await regFinRepo.find({where: {userId: user?.userId}})
    }

    @BackendMethod({ allowed: true })
    static async createNewRegSimUser() {
        const userInfo = getCurrentUser()
        const user = await userRepo.findFirst({ id: userInfo.id })
        await regFinRepo.insert({
            userId: user?.userId,
            savings: 0,
            spending: 0
        })
    }

}