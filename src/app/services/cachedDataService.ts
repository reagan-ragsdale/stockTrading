import { Injectable } from "@angular/core";
import { BehaviorSubject } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class CachedData{
    


    public currentAppKey = new BehaviorSubject<string | null>(null)
    public currentAppSecret = new BehaviorSubject<string | null>(null)
    public currentCode = new BehaviorSubject<string | null>(null)
    public currentAccessToken = new BehaviorSubject<string | null>(null)
    public currentRefreshToken = new BehaviorSubject<string | null>(null)
    

    constructor(){}

    public changeCurrentAppKey(appKey: string){
        this.currentAppKey.next(appKey)
    }
    public changeCurrentAppSecret(appScret: string){
        this.currentAppSecret.next(appScret)
    }
    public changeCurrentCode(code: string){
        this.currentCode.next(code)
    }
    public changeAccessToken(accessToken: string){
        this.currentAccessToken.next(accessToken)
    }
    public changeRefreshToken(refreshToken: string){
        this.currentRefreshToken.next(refreshToken)
    }


    
}