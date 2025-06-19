import express from "express"
import "dotenv/config"
import cors from "cors"
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebhooks.js";

connectDB()

const app = express();
app.use(cors()) //Enable cross-origin resource sharing


//middleware
app.use(express.json());
app.use(clerkMiddleware());

//Api to listen to clerk webhooks
app.use("/api/clerk", clerkWebhooks);

app.get('/', (req, res) => res.send("API WORKING"))

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`)
)