# Bandcamp Collection Readme

Share the items you have recently added to your [bandcamp](https://bandcamp.com/) collection on your GitHub readme. Inspired by similar projects, including [GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats) and [Spotify Recently Played README](https://github.com/JeffreyCA/spotify-recently-played-readme).

## Usage

Add the below snippet to your GitHub's `README.md` page to retreive the most recent items from your bandcamp collection. Make sure you update the `username` query parameter to reflect your username on bandcamp.

```
[![Bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph)](https://github.com/Johoseph/bandcamp-collection-readme)
```

[![Johoseph's bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph)](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph)

### Usage Note

This app has been deployed via [Vercel](https://github.com/vercel/vercel) under a 'hobby' account - this account tier allocates requests a maximum of 5 seconds to finish. Since your Bandcamp data has to be retrieved via a web-scrape (Bandcamp does not have a public developer API), requests will occasionally take longer than 5 seconds and fail (resulting in the below error). Unfortunately there is not much that can be done about this without upgrading my Vercel account, so make sure you are aware if you intend to use this service.

<img style="border-radius:5px;" src="https://user-images.githubusercontent.com/49534136/146941298-de1cac2d-ba12-4541-aee7-ec0549f4159c.png" alt="Timeout example" />

## Customisation

The following request query parameters can be used to customise the bandcamp collection list that is retrieved, see the below sub-headings for further explanation:

- `theme` - _"light"_ or _"dark"_
- `items` - _number_
- `include_wishlist` - _boolean_
- `one_collection_item` - _boolean_

### Dark Theme

Display your collection in dark mode by adding `&theme=dark` to your request URL.

```
![Bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&theme=dark)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&theme=dark)

### Item Count

Retrieve a custom number of collection items by adding the `items` parameter to your URL (defaults to `5` when not specified).

```
![Bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&items=1)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&items=1)

### Hide Wishlist

Show only the items you have purchased by adding `&include_wishlist=false` to your request URL.

```
![Bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&include_wishlist=false)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&include_wishlist=false)

### 'True' Most Recent

By default, the collection list will include at least `1` purchased item (provided the account has at least one purchased item). This means that at times, the default display of the list may not represent your 'true' most-recent bandcamp additions (i.e. you have wishlisted `x` items since you purchased your last item). If this behaviour is undesired, you can add `&one_collection_item=false` to your request URL to override it.

```
![Bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&one_collection_item=false)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.vercel.app/getCollection?username=Johoseph&one_collection_item=false)
