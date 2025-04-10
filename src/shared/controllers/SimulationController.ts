import { Allow, BackendMethod, remult } from "remult"
import { runIntraDaySim } from "../../server/runIntraDaySim"
import { DbStockHistoryData } from "../tasks/dbStockHistoryData"







export class SimulationController {


  static intraDaySimulation: typeof runIntraDaySim

  @BackendMethod({ allowed: true })
  static async runEntireSimulationIntraDay(stockName: string, date: string): Promise<any[]> {
    return SimulationController.intraDaySimulation(stockName, date)
  }


}