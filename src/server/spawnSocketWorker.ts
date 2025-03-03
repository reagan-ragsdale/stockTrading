


/* const dbConfig = {
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
}); */
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
   /*  const poolConnection = async (data: DbCurrentDayStockData) => {
        // Checks out an idle connection in the pool to access the database
        const client = await pool.connect();
        try {
            // Makes a query with the client from the pool
            const text = 'INSERT INTO dbcurrentdaystockdata (stockname, stockprice, time) VALUES($1, $2, $3)';
            const values = [data.stockName, data.stockPrice, data.time]
            await client.query(text,values);
            
        } catch (err) { 
            console.error(err);
        } finally {
            // Returns the connection back into the pool
            await client.release();
        }
    }; */
     //await poolConnection(data)