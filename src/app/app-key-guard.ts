import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { remult } from "remult";
import { AuthController } from "../shared/controllers/AuthController.js";
import { SchwabController } from "../shared/controllers/SchwabController.js";

@Injectable({
  providedIn: 'root'
})
export class KeyGuard implements CanActivate {

  constructor(private router: Router) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    let environment = await SchwabController.getEnvironmentCall()
    console.log(environment)
    if (environment == 'Prod') {
      return true; // User is logged in, allow access
    } else {
      // User is not logged in, redirect to login page
      return this.router.createUrlTree(['/serverTradeList']);
    }
  }
}