import express from "express";
import scrapeIt from "scrape-it";

export const router = express.Router();

router.get("/", async (_req, res) => {
  return res
    .status(301)
    .redirect("https://github.com/Johoseph/bandcamp-collection-github");
});

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
  let {
    username,
    include_wishlist,
    items = 5,
    one_collection_item,
    hide_profile,
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
  hide_profile = hide_profile === "false";
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

  return res.render("svg", {
    data,
    config: {
      hide_profile,
      theme,
    },
  });
});
