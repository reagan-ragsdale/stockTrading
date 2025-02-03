import { Injectable } from "@angular/core";
import { BehaviorSubject } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class CachedData{
    


    static currentClientId = new BehaviorSubject<string | null>(null)

    constructor(){}

    static changeCurrentClientId(clientId: string){
        this.currentClientId.next(clientId)
    }


    
}