import express from 'express'
import { api } from "./api.js"
import session from "cookie-session"
import cors from 'cors'

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
console.log(process.env["PORT"])
app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));
