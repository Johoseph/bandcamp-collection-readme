import express from "express";
import scrapeIt from "scrape-it";

export const router = express.Router();

router.get("/", async (_req, res) => {
  return res
    .status(301)
    .redirect("https://github.com/Johoseph/bandcamp-collection-github");
});

const scrapeConfig = (isCollection) => ({
  items: {
    listItem: ".collection-item-container",
    data: {
      title: {
        selector: ".item-link-alt .collection-item-title",
      },
      artist: {
        selector: ".item-link-alt .collection-item-artist",
      },
      dateAdded: {
        attr: "data-token",
        convert: (val) => val.split(":")[0],
      },
      favFeatTrack: {
        selector: ".fav-track-link",
      },
      isCollection: {
        convert: () => isCollection,
      },
    },
  },
});

router.get("/getCollection", async (req, res) => {
  let {
    username,
    include_wishlist,
    items = 5,
    one_collection_item,
  } = req.query;
  let collection = [];

  if (!username)
    return res.status(400).send("No Bandcamp user specified in request.");

  if (isNaN(items))
    return res.status(400).send("Items specified must be a number.");

  include_wishlist = include_wishlist !== "false";
  one_collection_item = one_collection_item !== "false";

  await Promise.all([
    scrapeIt(`https://bandcamp.com/${username}`, scrapeConfig(true)).then(
      (data) => (collection = [...collection, ...data.data.items])
    ),
    ...(include_wishlist
      ? [
          scrapeIt(
            `https://bandcamp.com/${username}/wishlist`,
            scrapeConfig(false)
          ).then((data) => (collection = [...collection, ...data.data.items])),
        ]
      : []),
  ]);

  collection = collection
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

  return res.status(200).json(collection);
});
