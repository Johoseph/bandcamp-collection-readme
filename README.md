# Bandcamp Collection Readme

Share the items you have recently added to your [bandcamp](https://bandcamp.com/) collection on your GitHub readme. Inspired by similar projects, including [GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats) and [Spotify Recently Played README](https://github.com/JeffreyCA/spotify-recently-played-readme).

## Usage

Add the below snippet to your GitHub's `README.md` page to retreive the most recent items from your bandcamp collection. Make sure you update the `username` query parameter to reflect your username on bandcamp.

```
[![Bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph)](https://github.com/Johoseph/bandcamp-collection-readme)
```

[![Johoseph's bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph)](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph)

### Add a workflow to cache your collection

The above usage will work on its own, but it is recommended that you additionally add a Github workflow action that intermittently caches your Bandcamp data (see [Why a workflow?](https://github.com/Johoseph/bandcamp-collection-readme#why-a-workflow) for further explanation).

1. Create a `bandcamp-collection.yml` file within the `.github/workflows` directory of the desired repository.
2. Add the following contents, make sure to replace **Johoseph** with your bandcamp username.

```yml
name: Cache Bandcamp data
on:
  schedule:
    # Runs every hour
    - cron: "0 * * * *"
  workflow_dispatch:

jobs:
  cache-bandcamp-data:
    runs-on: ubuntu-latest
    steps:
      - name: Send cache request
        uses: fjogeleit/http-request-action@master
        with:
          url: "https://bandcamp-collection-readme.herokuapp.com/cacheUser?username=Johoseph"
          method: "GET"
          timeout: 10000
```

### Why a workflow?

Bandcamp does not have a public developer API, so to enable this app your Bandcamp data has to be retrieved via a web-scrape. A usual scrape request can take anywhere from **2** to **5** seconds - this creates a problem for [Github's anonymised URL engine Camo](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls), which has a maximum request time of **4** seconds. What this means is that longer scrape requests will occassional timeout, resulting in a `504` error from Camo and no image returned. The addition of a workflow allows for Bandcamp data to be pre-gathered and cached, so that when a `getCollection` request is fired, the collection svg can be generated and returned to the client much faster.

## Customisation

The following request query parameters can be used to customise the bandcamp collection list that is retrieved, see the below sub-headings for further explanation:

- `theme` - _"light"_ or _"dark"_
- `items` - _number_
- `include_wishlist` - _boolean_
- `one_collection_item` - _boolean_

### Dark Theme

Display your collection in dark mode by adding `&theme=dark` to your request URL.

```
![Bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&theme=dark)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&theme=dark)

### Item Count

Retrieve a custom number of collection items by adding the `items` parameter to your URL (defaults to `5` when not specified).

```
![Bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&items=1)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&items=1)

### Hide Wishlist

Show only the items you have purchased by adding `&include_wishlist=false` to your request URL.

```
![Bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&include_wishlist=false)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&include_wishlist=false)

### 'True' Most Recent

By default, the collection list will include at least `1` purchased item (provided the account has at least one purchased item). This means that at times, the default display of the list may not represent your 'true' most-recent bandcamp additions (i.e. you have wishlisted `x` items since you purchased your last item). If this behaviour is undesired, you can add `&one_collection_item=false` to your request URL to override it.

```
![Bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&one_collection_item=false)
```

![Johoseph's bandcamp collection](https://bandcamp-collection-readme.herokuapp.com/getCollection?username=Johoseph&one_collection_item=false)
