import express from 'express'
import { api } from "./api.js"
import session from "cookie-session"

const app = express()
app.use(
    session({
      secret: process.env["SESSION_SECRET"] || "my secret"
    })
  )
app.use(api)

const frontendFiles = process.cwd() + "/dist/stock-trading/browser";
app.use(express.static(frontendFiles));
app.get("/*", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});
app.listen(process.env["PGPORT"] || 3002, () => console.log("Server started"));
