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

## Example output:

Output request was for:
Game date, blue team, red team, winner, game length (seconds), blue gold total, red gold total, blue tower kills, red tower kills, blue dragon kills, red dragon kills, blue baron kills, red baron kills
```
10/01/2015 6:27 AM,FNC,IG,FNC,1834,54695,40136,7,0,3,0,1,0
10/01/2015 8:24 AM,C9,AHQ,C9,1438,42637,33361,7,2,2,0,1,0
10/01/2015 9:18 AM,SKT,H2K,SKT,1872,56435,44416,11,2,4,0,1,0
10/01/2015 10:17 AM,EDG,BKT,EDG,1221,40010,25384,8,0,2,0,0,0
10/01/2015 11:07 AM,CLG,FW,CLG,2515,67182,67686,9,6,2,3,0,1
10/01/2015 12:20 PM,PNG,KOO,KOO,1864,41892,60932,3,9,1,3,0,1
```