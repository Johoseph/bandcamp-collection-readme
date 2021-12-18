import express from "express";
import cors from "cors";
import log from "npmlog";
import path from "path";

import { router } from "./router.js";
import { initHandlebars } from "./handlebars.js";

const app = express();
const port = process.env.PORT || 8080;

initHandlebars();

app.set("view engine", "hbs");
app.set("views", path.resolve());

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.use("/", router);

app.all("*", function (req, res) {
  res
    .status(301)
    .redirect("https://github.com/Johoseph/bandcamp-collection-github");
});

app.listen(port, () => {
  log.info(`Bandcamp collection scraper started at http://localhost:${port}`);
});
