import express from "express";
import scrapeIt from "scrape-it";
import axios from "axios";

export const router = express.Router();

const scrapeConfig = (isCollection) => ({
  profileName: {
    selector: "[data-bind='text: name']",
  },
  profilePicture: {
    selector: ".popupImage > img",
    attr: "src",
  },
  collectionCount: {
    selector: "[data-tab='collection'] .count",
  },
  wishlistCount: {
    selector: "[data-tab='wishlist'] .count",
  },
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

router.get("/getCollection", async (req, res) => {
  let isTimeout = false;

  res.setHeader("Content-type", "image/svg+xml");

  // Catering for vercel 5 second timeout
  // https://vercel.com/docs/concepts/limits/overview#serverless-function-execution-timeout
  let timeout = setTimeout(() => {
    isTimeout = true;

    return res.render("svg", {
      theme,
      timeout: true,
    });
  }, 1000);

  let {
    username,
    include_wishlist,
    items = 5,
    one_collection_item,
    theme,
  } = req.query;

  let data;
  let itemsArr = [];

  if (!username)
    return res.status(400).send("No Bandcamp user specified in request.");

  if (isNaN(items))
    return res.status(400).send("Items specified must be a number.");

  // Default options
  include_wishlist = include_wishlist !== "false";
  one_collection_item = one_collection_item !== "false";
  theme = theme === "dark" ? "dark" : "light";

  await Promise.all([
    scrapeIt(`https://bandcamp.com/${username}`, scrapeConfig(true)).then(
      (scrape) => {
        data = scrape.data;
        itemsArr = [...itemsArr, ...scrape.data.items];
      }
    ),
    ...(include_wishlist
      ? [
          scrapeIt(
            `https://bandcamp.com/${username}/wishlist`,
            scrapeConfig(false)
          ).then((scrape) => (itemsArr = [...itemsArr, ...scrape.data.items])),
        ]
      : []),
  ]);

  data.items = itemsArr
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

    return res.render("svg", {
      data,
      theme,
      timeout: false,
    });
  }
});
