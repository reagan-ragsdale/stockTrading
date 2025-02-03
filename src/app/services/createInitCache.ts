import { CachedData } from "./cachedDataService";
export const initialCache = () => {
    //constructor(private cachedData: CachedData){}

    CachedData.changeCurrentClientId(process.env['clientId']!)
    
    
}