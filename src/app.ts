import express from "express";
import { connect } from "mongoose";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import Auth from "./routes/auth.js";

const app = express();
config();


const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/voicex";

connect(mongoURI)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(`DB Connection Error: ${err.message}`));

// middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

app.use("/api", Auth);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App is listening on port : ${port}`);
});
