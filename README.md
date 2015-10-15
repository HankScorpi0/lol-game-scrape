# lol-game-scrape

This is intended to loop through a list of websites containing match history urls (in the example case, lol esportspedia's lists of LCS and Worlds games),
gather up and cache matched game uris (category?/id/hash), then request game data through Riot's stats/game API for those uris and output a list of formatted results to be dropped into Excel so statisticians can do statisticiomancy on them.

## Command-line arguments:

```
--from-cache    If a fresh scrape was run, resulting game uris will be stored in game-uri-cache.txt. This option
                loads game data from those uris instead of scraping the urls for fresh data. If the cache does not
                exist, or is malformed, it will try a fresh scrape on the set of urls.
-urls [urls]    A list of URLs to scrape for match histories.
```

## Example command:

```
node game-scrape.js --from-cache -urls \
http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/Europe/2015_Season/Summer_Season/Match_Details \
http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/Europe/2015_Season/Summer_Playoffs/Match_Details \
http://lol.esportspedia.com/wiki/2015_Season_Europe_Regional_Finals/Match_Details \
http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/North_America/2015_Season/Summer_Season/Match_Details \
http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/North_America/2015_Season/Summer_Playoffs/Match_Details \
http://lol.esportspedia.com/wiki/2015_Season_North_America_Regional_Finals/Match_Details \
http://lol.esportspedia.com/wiki/2015_Season_World_Championship/Match_Details
```