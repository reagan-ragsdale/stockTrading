import { Injectable } from "@angular/core";
import { BehaviorSubject } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class CachedData{
    


    public currentClientId = new BehaviorSubject<string | null>(null)

    constructor(){}

    public changeCurrentClientId(clientId: string){
        this.currentClientId.next(clientId)
    }


    
}