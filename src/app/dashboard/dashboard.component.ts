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
    let allData = await dbCurrentDayStockDataRepo.find({ orderBy: { time: 'asc' } })
    let distinctStocks = allData.map(e => e.stockName).filter((v, i, a) => a.indexOf(v) === i)
    for (let i = 0; i < distinctStocks.length; i++) {
      let filteredStock = allData.filter(e => e.stockName == distinctStocks[i])
      let currentPrice = filteredStock[filteredStock.length - 1].stockPrice
      let open = 0
      for (let j = 0; j < filteredStock.length; j++) {
        if(reusedFunctions.is830AMCT(filteredStock[j].time)){
          open = filteredStock[j].stockPrice;
          break;
        }
      }
      let priceChange = Math.abs(currentPrice - open)
      /* this.listOfStockData.push({
        stockName: distinctStocks[i]
      }) */
    }
  }
}
