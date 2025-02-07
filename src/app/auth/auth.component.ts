import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { remult } from 'remult'
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'
import { AuthController } from '../../shared/controllers/AuthController'
import { MatCardModule } from '@angular/material/card'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatInputModule } from '@angular/material/input';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { NewUserService } from '../services/newUserService.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CachedData } from '../services/cachedDataService';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule,MatProgressSpinnerModule, MatCardModule, MatToolbarModule, MatFormFieldModule, MatSnackBarModule, MatInputModule, MatButtonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  constructor(private router: Router, private _snackBar: MatSnackBar, private sharedCache: CachedData) {
  }
  signInUsername = ''
  signInPassword = ''
  signInConfirmPassword = ''
  isLoginMode: boolean = true;
  remult = remult

  signUpMessage = `Don't have an account? Sign Up`
  loginMessage = `Already have an account? Login`



  async onSubmit() {

    if (this.isLoginMode) {
      try {

        remult.user = await AuthController.logIn(this.signInUsername, this.signInPassword)
        if (remult.authenticated()) {
          this.router.navigate(['/keys'])
        }
      }
      catch (error: any) {
        this._snackBar.open(error.message, 'close',{duration: 8000})
      }

    }
    else {
      try {
        remult.user = await AuthController.signUp(this.signInUsername, this.signInPassword, this.signInConfirmPassword)
        await NewUserService.createNewUserData();
        if (remult.authenticated()) {
          this.router.navigate(['/keys'])
        }
      } catch (error: any) {
        this._snackBar.open(error.message, 'close',{duration: 8000})
      }
      
    }
    








  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode
  }


  
  async ngOnInit() {
    let user = await remult.initUser()
  }
}