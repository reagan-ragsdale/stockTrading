import { Component, OnInit } from '@angular/core';
import { SimFInance } from '../../shared/tasks/simFinance';
import { SimFinance } from '../../shared/controllers/SimFinance';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-screen',
  imports: [CommonModule],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.css'
})
export class HomeScreenComponent implements OnInit{

  userSimFinData: SimFInance | null = null

  async ngOnInit(){
    this.userSimFinData = await SimFinance.getSimFinData()
  }

}
