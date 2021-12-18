import express from "express";
import cors from "cors";
import log from "npmlog";
import path from "path";

import { router } from "./router.js";

const app = express();
const port = process.env.PORT || 8080;

app.set("view engine", "hbs");
app.set("views", path.resolve());

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.use("/", router);

app.listen(port, () => {
  log.info(`Bandcamp collection scraper started at http://localhost:${port}`);
});
