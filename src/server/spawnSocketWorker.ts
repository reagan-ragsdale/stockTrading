import { Worker } from 'node:worker_threads'
import path from 'path'

export const startWorker = async (): Promise<void> => {
    const workerPath = path.resolve(__dirname, 'insertStockData.js');
    const worker = new Worker(workerPath)
}