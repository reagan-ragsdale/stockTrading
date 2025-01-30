import { SimFinance } from "../../shared/controllers/SimFinance";


export class NewUserService{

    static async createNewUserData(){
        await SimFinance.createNewSimUser();
    }

}