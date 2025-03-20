import { Component, OnInit } from '@angular/core';
import { stockDashData } from '../Dtos/stockDashData';
import { dbCurrentDayStockDataRepo } from '../../shared/tasks/dbCurrentDayStockData';
import { reusedFunctions } from '../services/reusedFunctions';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit {

  listOfStockData: stockDashData[] = []
  async ngOnInit() {
  }
}
