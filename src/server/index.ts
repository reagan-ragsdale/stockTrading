import express from 'express'
import { api } from "./api.js"
import session from "cookie-session"
import cors from 'cors'

const app = express()
app.use(cors({
  origin: 'https://stocktrading.up.railway.app', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Origin', 'Authorization']
}))
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
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://stocktrading.up.railway.app");
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type,Authorization");
  res.header("Access-Control-Allow-Methods", "POST")
  next();
});
console.log(process.env["PORT"])
app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));
