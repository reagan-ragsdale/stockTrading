import { UserInfo, remult } from 'remult'
import type { Request } from 'express'
import type  session from "cookie-session"

declare module 'remult' {
    export interface RemultContext {
        session: CookieSessionInterfaces.CookieSessionObject
        
    }
}

export async function initRequest(req: Request) {
    remult.context.session = req.session!
    remult.user = req.session!['user']
    
}

export function setSessionUser(user: UserInfo | null): UserInfo {
    remult.context.session['user'] = user
    remult.user = user!
    return user!
}
export function getCurrentUser(): UserInfo {
    return remult.context.session['user']!
}