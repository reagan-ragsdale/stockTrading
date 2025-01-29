import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UserInfo, remult } from 'remult'
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { TodoComponent } from '../todo/todo.component'
import { AuthController } from '../../shared/controllers/AuthController'
import { MatCardModule } from '@angular/material/card'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatInputModule } from '@angular/material/input';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MatCardModule, MatToolbarModule, MatFormFieldModule, MatSnackBarModule, MatInputModule, MatButtonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  constructor(private router: Router, private _snackBar: MatSnackBar) {
  }
  signInUsername = ''
  signInPassword = ''
  signInApiKey = ''
  isLoginMode: boolean = false;
  remult = remult

  signUpMessage = `Don't have an account? Sign Up`
  loginMessage = `Already have an account? Login`



  async onSubmit() {

    if (this.isLoginMode) {
      try {
        remult.user = await AuthController.logIn(this.signInUsername, this.signInPassword)
      }
      catch (error: any) {
        this._snackBar.open(error.message, 'close',{duration: 8000})
      }

    }
    else {
      try {
        remult.user = await AuthController.signUp(this.signInUsername, this.signInPassword, this.signInApiKey)
      } catch (error: any) {
        this._snackBar.open(error.message, 'close',{duration: 8000})
      }
    }
    if (remult.authenticated()) {
      this.router.navigate(['home'])
    }








  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode
  }

  ngOnInit() {
    remult.initUser()
    console.log(remult.user?.name)
  }
}