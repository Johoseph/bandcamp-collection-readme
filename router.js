import express from "express";
import scrapeIt from "scrape-it";
import axios from "axios";
import { Cache } from "memory-cache";
import log from "npmlog";

export const router = express.Router();

const collectionCache = new Cache();

const scrapeConfig = (isCollection) => ({
  profileName: {
    selector: "[data-bind='text: name']",
  },
  /* profilePicture: {
    selector: ".popupImage > img",
    attr: "src",
  },
  collectionCount: {
    selector: "[data-tab='collection'] .count",
  },
  wishlistCount: {
    selector: "[data-tab='wishlist'] .count",
  }, */
  items: {
    listItem: ".collection-item-container",
    data: {
      title: {
        selector: ".item-link-alt .collection-item-title",
      },
      artist: {
        selector: ".item-link-alt .collection-item-artist",
      },
      albumLink: {
        selector: ".item-link:not(.also-link)",
        attr: "href",
      },
      albumArt: {
        selector: ".collection-item-art",
        attr: "src",
      },
      dateAdded: {
        attr: "data-token",
        convert: (val) => val.split(":")[0],
      },
      favFeatTrack: {
        selector: ".fav-track-link",
      },
      favFeatTrackLink: {
        selector: ".fav-track-link",
        attr: "href",
      },
      isCollection: {
        convert: () => isCollection,
      },
    },
  },
});

const scrapeData = async (username, includeWishlist = true) => {
  log.info("Is scraping");

  let data;
  let itemsArr = [];

  await Promise.all([
    scrapeIt(`https://bandcamp.com/${username}`, scrapeConfig(true)).then(
      (scrape) => {
        data = scrape.data;
        itemsArr = [...itemsArr, ...scrape.data.items];
      }
    ),
    ...(includeWishlist
      ? [
          scrapeIt(
            `https://bandcamp.com/${username}/wishlist`,
            scrapeConfig(false)
          ).then((scrape) => (itemsArr = [...itemsArr, ...scrape.data.items])),
        ]
      : []),
  ]);

  data.items = itemsArr;

  return data;
};

router.get("/cacheUser", async (req, res) => {
  let { username } = req.query;

  if (!username)
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      error: "Bad Request",
      message: "No Bandcamp 'username' param specified in request.",
      path: `${req.headers.host}/getCollection`,
      help: `${req.headers.host}/getCollection?username=Your-Bandcamp-Username`,
    });

  const data = await scrapeData(username);

  const cacheKey = encodeURIComponent(username.toLowerCase());

  // Cache for 1 day
  collectionCache.put(cacheKey, data, 86400000);

  return res.status(200).json({
    timestamp: new Date(),
    status: 200,
    message: `Cache for '${data.profileName}' updated successfully.`,
  });
});

router.get("/getCollection", async (req, res) => {
  let isTimeout = false;

  // Catering for vercel 5 second timeout
  // https://vercel.com/docs/concepts/limits/overview#serverless-function-execution-timeout
  let timeout = setTimeout(() => {
    isTimeout = true;

    res.setHeader("Content-type", "image/svg+xml");
    return res.render("svg", {
      theme,
      timeout: true,
    });
  }, 4800);

  let {
    username,
    include_wishlist,
    items = 5,
    one_collection_item,
    theme,
  } = req.query;

  if (!username)
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      error: "Bad Request",
      message: "No Bandcamp 'username' param specified in request.",
      path: `${req.headers.host}/getCollection`,
      help: `${req.headers.host}/getCollection?username=Your-Bandcamp-Username`,
    });

  if (isNaN(items))
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      error: "Bad Request",
      message: "Items specified must be a number.",
      path: `${req.headers.host}/getCollection`,
      help: `${req.headers.host}/getCollection?username=${username}&items=10`,
    });

  // Default options
  include_wishlist = include_wishlist !== "false";
  one_collection_item = one_collection_item !== "false";
  theme = theme === "dark" ? "dark" : "light";

  const cacheKey = encodeURIComponent(username.toLowerCase());

  let data = collectionCache.get(cacheKey);

  if (!data) data = await scrapeData(username, include_wishlist);
  else data = JSON.parse(JSON.stringify(data));

  data.items = data.items
    .sort((a, b) =>
      parseInt(a.dateAdded, 10) < parseInt(b.dateAdded, 10) ? 1 : -1
    )
    .reduce((cur, item) => {
      if (
        one_collection_item &&
        !cur.some((ci) => ci.isCollection) &&
        cur.length === parseInt(items, 10) - 1 &&
        !item.isCollection
      )
        return cur;

      if (cur.length < parseInt(items, 10)) return [...cur, item];
      return cur;
    }, []);

  for (let i = 0; i < data.items.length; i++) {
    let image = await axios.get(data.items[i].albumArt, {
      responseType: "arraybuffer",
    });
    data.items[i].albumArt = Buffer.from(image.data).toString("base64");
  }

  if (!isTimeout) {
    clearTimeout(timeout);

    res.setHeader("Content-type", "image/svg+xml");
    return res.render("svg", {
      data,
      theme,
      timeout: false,
    });
  }
});
