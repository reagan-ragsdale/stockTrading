import { Worker } from 'node:worker_threads'

export const startWorker = async (): Promise<void> => {
    console.log('start worker')
    const worker = new Worker('./insertStockData')
}