import dotenv from "dotenv";
dotenv.config();
import express from "express";
import uploadRoute from "./routes/upload";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("hello world!");
});

app.use("/api/upload", uploadRoute);
app.listen(8080, () => {
  console.log("server up port 8080");
});
