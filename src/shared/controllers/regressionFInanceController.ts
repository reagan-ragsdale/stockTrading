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
        const regFinUser = await regFinRepo.findFirst({userId: remult.context.request!.session!["user"].id})
        if (!regFinUser){
            await regFinRepo.insert({
                userId: remult.context.request!.session!["user"].id,
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
        return await regFinRepo.find({where: {userId: remult.context.request!.session!["user"].id}})
    }

    @BackendMethod({ allowed: true })
    static async createNewRegSimUser() {
        await regFinRepo.insert({
            userId: remult.context.request!.session!["user"].id,
            savings: 0,
            spending: 0
        })
    }

}