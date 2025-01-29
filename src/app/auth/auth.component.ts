import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UserInfo, remult } from 'remult'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { TodoComponent } from '../todo/todo.component'
import { AuthController } from '../../shared/controllers/AuthController'

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, TodoComponent, HttpClientModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  signInUsername = ''
  remult = remult

  async signIn() {
    try {
      remult.user = await AuthController.signIn(this.signInUsername)
    } catch (error: unknown) {
      alert((error as { message: string }).message)
    }
  }

  async signOut() {
    await AuthController.signOut()
    remult.user = undefined
  }

  ngOnInit() {
    remult.initUser()
  }
}