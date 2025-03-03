
import { DbCurrentDayStockData, dbCurrentDayStockDataRepo } from "../shared/tasks/dbCurrentDayStockData.js"
import { dbTokenRepo, DbTOkens } from "../shared/tasks/dbTokens.js"
//import { Worker } from 'node:worker_threads'
import { WebSocket } from 'ws';
import pkg from 'pg';
const { Pool } = pkg;


export const socketCall = async (): Promise<void> => {
    console.log('here in insert file')
    const dbConfig = {
        user: process.env['PGUSER'],
        host: process.env['PGHOST'],
        database: process.env['PGDATABASE'],
        password: process.env['PGPASSWORD'],
        connectionString: process.env['DATABASE_URL'],
        port: Number(process.env['PGPORT']),
    };
    const poolConfig = {
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000
    };
    const pool = new Pool({
        ...dbConfig,
        ...poolConfig,
    });

    // Function for normal connection
    /* const normConnection = async () => {
        const client = new Client(dbConfig);
        // This creates a connection that allows the client to access the database
        client.connect();
        try {
            // Makes a query with the client
            await client.query("SELECT * FROM users");
        } catch (err) {
            console.error(err);
        } finally {
            // Close the client connection after making query
            await client.end();
        }
    }; */

    // Function for pooled connection
    const poolConnection = async (data: DbCurrentDayStockData) => {
        // Checks out an idle connection in the pool to access the database
        const client = await pool.connect();
        try {
            console.log('here before insert')
            // Makes a query with the client from the pool
            const text = 'INSERT INTO dbcurrentdaystockdata (stockname, stockprice, time) VALUES($1, $2, $3)';
            const values = [data.stockName, data.stockPrice, data.time]
            await client.query(text,values);
            console.log('here after insert')
        } catch (err) { 
            console.error(err);
        } finally {
            // Returns the connection back into the pool
            await client.release();
        }
    };

    const userData = await dbTokenRepo.findFirst({ id: { '!=': '' } }) as DbTOkens
    console.log('here 1')
    //const worker = new Worker("./spawnSocketWorker.js", { workerData: userData})

    /* worker.on('message', async (data) => {
        await dbCurrentDayStockDataRepo.insert(data)
    }) */

    const schwabWebsocket = new WebSocket(userData.streamerSocketUrl)
    let hasBeenSent = false
    const loginMsg = {
        "requests": [
            {
                "service": "ADMIN",
                "requestid": "0",
                "command": "LOGIN",
                "SchwabClientCustomerId": userData.schwabClientCustomerId,
                "SchwabClientCorrelId": userData.schwabClientCorrelId,
                "parameters": {
                    "Authorization": userData.accessToken,
                    "SchwabClientChannel": userData.schwabClientChannel,
                    "SchwabClientFunctionId": userData.schwabClientFunctionId
                }
            }
        ]
    }
    const socketSendMsg = {
        "requests": [
            {
                "service": "LEVELONE_EQUITIES",
                "requestid": "1",
                "command": "SUBS",
                "SchwabClientCustomerId": userData.schwabClientCustomerId,
                "SchwabClientCorrelId": userData.schwabClientCorrelId,
                "parameters": {
                    "keys": "AAPL, MSFT, PLTR",
                    "fields": "0,1,2,3,4,5,6,7,8,9,10,33"
                }
            }
        ]
    }
    schwabWebsocket.on('open', () => {
        console.log('asdfasdf')
        schwabWebsocket.send(JSON.stringify(loginMsg))
    })
    schwabWebsocket.on('message', async (event) => {
        console.log('hererere')
        let newEvent = JSON.parse(event.toString())
        console.log(newEvent)


        if (Object.hasOwn(newEvent, 'response')) {
            if (newEvent.response[0].requestid == 0 && hasBeenSent == false) {
                schwabWebsocket.send(JSON.stringify(socketSendMsg))
                hasBeenSent = true
            }
        }
        try{
            if (Object.hasOwn(newEvent, 'data') && hasBeenSent == true) {
                if (newEvent.data[0].service == 'LEVELONE_EQUITIES') {
                    let insertData: DbCurrentDayStockData[] = []
                    for (let i = 0; i < newEvent.data[0].content.length; i++) {
                        if (Object.hasOwn(newEvent.data[0].content[i], '3')) {
                            let data: DbCurrentDayStockData = {
                                stockName: newEvent.data[0].content[i].key,
                                stockPrice: newEvent.data[0].content[i]['3'],
                                time: Number(newEvent.data[0].timestamp)
                            }
                            //insertData.push(data)
                            console.log('here 2')
                            await poolConnection(data)
                            console.log('here 3')
                        }
    
                    }
                    //await dbCurrentDayStockDataRepo.insert(insertData)
    
                }
    
            }
        }
        catch(error: any){
            console.log(error.message)
        }
        
    });






}
