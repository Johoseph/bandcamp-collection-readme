import express from "express";
import scrapeIt from "scrape-it";
import axios from "axios";

export const router = express.Router();

const REQUEST_TIMEOUT = 3000;

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

const getAlbumArt = async (artURL) => {
  return axios
    .get(artURL, {
      responseType: "arraybuffer",
    })
    .then((image) => Buffer.from(image.data).toString("base64"));
};

router.get("/getCollection", async (req, res) => {
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

  Promise.race([
    new Promise((resolve) => {
      setTimeout(() => resolve(), REQUEST_TIMEOUT);
    }),
    new Promise(async (resolve) => {
      // Default options
      include_wishlist = include_wishlist !== "false";
      one_collection_item = one_collection_item !== "false";
      theme = theme === "dark" ? "dark" : "light";

      const data = await scrapeData(username, include_wishlist);

      data.items = data.items
        .filter((item) => (include_wishlist ? true : item.isCollection))
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

      Promise.all(
        [...Array(data.items.length)].map((_, i) =>
          getAlbumArt(data.items[i].albumArt)
        )
      ).then((art) => {
        data.items.forEach((item, i) => (item.albumArt = art[i]));

        resolve(data);
      });
    }),
  ]).then((data) => {
    return res
      .setHeader("Content-type", "image/svg+xml")
      .setHeader("Cache-Control", "no-cache")
      .setHeader("Expires", new Date(Date.now() + 60).toUTCString())
      .render("svg", {
        data,
        theme,
        username,
        timeout: !data,
      });
  });
});
