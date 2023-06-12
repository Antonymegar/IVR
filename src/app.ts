import express from "express";
import { connect } from "mongoose";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import Auth from "./routes/auth";

const app = express();
config();


// middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

app.use("/api/auth/", Auth);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App is listening on port : ${port}`);
});
