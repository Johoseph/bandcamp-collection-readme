import express from "express";
import scrapeIt from "scrape-it";
import axios from "axios";
import log from "npmlog";

type BandcampItem = {
  title: string;
  artist: string;
  albumLink: string;
  albumArt: string;
  dateAdded: string;
  favFeatTrack?: string;
  favFeatTrackLink?: string;
  isCollection: boolean;
};

type BandcampScrape = {
  profileName: string;
  items: BandcampItem[];
};

export const router = express.Router();

const REQUEST_TIMEOUT = 3000;

const SCRAPE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Connection: "close",
};

const scrapeConfig = (page: "collection" | "wishlist") => ({
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
        convert: (val: string) => val.split(":")[0],
      },
      favFeatTrack: {
        selector: ".fav-track-link",
      },
      favFeatTrackLink: {
        selector: ".fav-track-link",
        attr: "href",
      },
      isCollection: {
        convert: () => page === "collection",
      },
    },
  },
});

const withRetry = async (
  scrape: () => Promise<scrapeIt.ScrapeResult<BandcampScrape>>,
  attempt = 1
) => {
  if (attempt > 3)
    return {
      profileName: "",
      items: [],
    };

  try {
    const scrapeResult = await scrape();

    return scrapeResult.data;
  } catch (err) {
    log.warn("", `Scrape attempt ${attempt} failed, retrying...`);
    return await withRetry(scrape, attempt + 1);
  }
};

const scrapeData = async (
  username: string,
  includeWishlist = true
): Promise<BandcampScrape> => {
  const scrapePromises = [
    withRetry(() =>
      scrapeIt<BandcampScrape>(
        {
          url: `https://bandcamp.com/${username}`,
          headers: SCRAPE_HEADERS,
        },
        scrapeConfig("collection")
      )
    ),
  ];

  if (includeWishlist)
    scrapePromises.push(
      withRetry(() =>
        scrapeIt<BandcampScrape>(
          {
            url: `https://bandcamp.com/${username}/wishlist`,
            headers: SCRAPE_HEADERS,
          },
          scrapeConfig("wishlist")
        )
      )
    );

  const [collectionData, maybeWishListData] = await Promise.all(scrapePromises);

  // TODO: Could add error handling, unknown username not catered for, etc
  if (!collectionData)
    return {
      profileName: "",
      items: [],
    };

  return {
    profileName: collectionData.profileName,
    items: [...collectionData.items, ...(maybeWishListData?.items ?? [])],
  };
};

const getAlbumArt = async (artURL: string) => {
  return axios
    .get(artURL, {
      responseType: "arraybuffer",
    })
    .then((image) => Buffer.from(image.data).toString("base64"));
};

router.get("/collection", async (req, res) => {
  let {
    username,
    include_wishlist,
    items = "5",
    one_collection_item,
    theme,
  } = req.query;

  if (!username || typeof username !== "string")
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      error: "Bad Request",
      message: "No Bandcamp 'username' param specified in request.",
      path: `${req.headers.host}/collection`,
      help: `${req.headers.host}/collection?username=Your-Bandcamp-Username`,
    });

  if (typeof items !== "string" || isNaN(parseInt(items)))
    return res.status(400).json({
      timestamp: new Date(),
      status: 400,
      error: "Bad Request",
      message: "Items specified must be a number.",
      path: `${req.headers.host}/collection`,
      help: `${req.headers.host}/collection?username=${username}&items=10`,
    });

  Promise.race([
    new Promise((resolve) => {
      setTimeout(resolve, REQUEST_TIMEOUT);
    }),
    new Promise(async (resolve) => {
      // Default options
      const includeWishlist = include_wishlist !== "false";
      const oneCollectionItem = one_collection_item !== "false";
      theme = theme === "dark" ? "dark" : "light";

      const data = await scrapeData(username, includeWishlist);

      data.items = data.items
        .filter((item) => (includeWishlist ? true : item.isCollection))
        .sort((a, b) =>
          parseInt(a.dateAdded, 10) < parseInt(b.dateAdded, 10) ? 1 : -1
        )
        .reduce((cur: BandcampItem[], item) => {
          if (
            oneCollectionItem &&
            // @ts-ignore

            !cur.some((ci) => ci.isCollection) &&
            cur.length === parseInt(items, 10) - 1 &&
            !item.isCollection
          )
            return cur;

          if (cur.length < parseInt(items, 10)) return [...cur, item];
          return cur;
        }, []);

      data.items = await Promise.all(
        data.items.map(async (item) => {
          const albumArt = await getAlbumArt(item.albumArt);

          return {
            ...item,
            albumArt,
          };
        })
      );

      resolve(data);
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
