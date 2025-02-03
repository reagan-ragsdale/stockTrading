import { CachedData } from "./cachedDataService.js";
export const initialCache = () => {
    //constructor(private cachedData: CachedData){}

    CachedData.changeCurrentClientId(process.env['clientId']!)
    
    
}