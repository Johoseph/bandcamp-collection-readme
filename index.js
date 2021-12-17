import express from "express";
import cors from "cors";
import log from "npmlog";

import { router } from "./router.js";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.use("/", router);

app.listen(port, () => {
  log.info(`Bandcamp collection scraper started at http://localhost:${port}`);
});
