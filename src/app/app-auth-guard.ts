import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { remult } from "remult";

@Injectable({
    providedIn: 'root'
  })
export class AuthGuard implements CanActivate{

    constructor( private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> | boolean | UrlTree {

    if (remult.authenticated()) {
      return true; // User is logged in, allow access
    } else {
      // User is not logged in, redirect to login page
      return this.router.createUrlTree(['/login']);
    }
  }
}