import { Worker } from 'node:worker_threads'

export const startWorker = async (): Promise<void> => {
    const worker = new Worker('../insertStockData.js')
}