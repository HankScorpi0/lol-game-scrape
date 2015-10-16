/*
    LOL MATCH HISTORY SCRAPER

    This is intended to loop through a list of urls containing match history urls,
    gather up and cache those urls, then request game data through Riot's stats/game API and output a list of formatted results.

    Command-line arguments:

        --from-cache    If a fresh scrape was run, resulting game uris will be stored in game-uri-cache.txt. This option
                        loads game data from those uris instead of scraping the urls for fresh data. If the cache does not
                        exist, or is malformed, it will try a fresh scrape on the set of urls.
        -urls [urls]    A list of URLs to scrape for match histories.

    Example command:

        node game-scrape.js --from-cache -urls \
        http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/Europe/2015_Season/Summer_Season/Match_Details \
        http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/Europe/2015_Season/Summer_Playoffs/Match_Details \
        http://lol.esportspedia.com/wiki/2015_Season_Europe_Regional_Finals/Match_Details \
        http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/North_America/2015_Season/Summer_Season/Match_Details \
        http://lol.esportspedia.com/wiki/Riot_League_Championship_Series/North_America/2015_Season/Summer_Playoffs/Match_Details \
        http://lol.esportspedia.com/wiki/2015_Season_North_America_Regional_Finals/Match_Details \
        http://lol.esportspedia.com/wiki/2015_Season_World_Championship/Match_Details

*/

var fs = require('fs'), // for writing to output file
    moment = require('moment'),
    RequestQueue = require('./requestq'), // constructor
    CACHE_FILENAME = 'game-uri-cache.txt',
    RESULTS_FILENAME = 'game-scrape-results.txt',
    scrapeQueue, // instance of RequestQueue
    gameResultsQueue, // instance of RequestQueue
    statsCollection = [], // will contain fetched and processed game result data
    queued = 0, // number of matches we have queued
    processed = 0, // number of matches we have processed
    start = Date.now(),
    cache = {}, // cache file contents
    loadFromCache = process.argv.indexOf('--from-cache') > -1,
    scrape = true,
    scrapeUrls = process.argv.slice(process.argv.indexOf('-urls') + 1), // array of urls to scrape for match histories
    i;

gameResultsQueue = new RequestQueue(gameResultsDone, 10);

// attempt to load from cache
if (loadFromCache) {
    scrape = false;
    if (fs.existsSync(CACHE_FILENAME)) {
        try {
            cache = JSON.parse(fs.readFileSync(CACHE_FILENAME));
            for (i = 0; i < cache.uris.length; i++) {
                enqueueGameUriRequest(cache.uris[i]);
            };
            timelog('loaded from cache at');

            gameResultsQueue.start();
        } catch(e) {
            // if anything goes wrong, just re-scrape
            scrape = true;
        }
    } else {
        scrape = true;
    }
}
// no cache, or cache failed; scrape away!
if (scrape) {
    cache.uris = [];

    scrapeQueue = new RequestQueue(scrapeDone, 0);
    for (i = 0; i < scrapeUrls.length; i++) {
        // get the page
        scrapeQueue.enqueue(scrapeUrls[i], function(html) {
            // scrape it for match histories and queue up matched uris
            var rx = new RegExp(/http:\/\/matchhistory.na.leagueoflegends.com\/en\/\#match-details\/([^\&"]+)/g),
                match = rx.exec(html);

            while (match) {
                enqueueGameUriRequest(match[1]);
                match = rx.exec(html);
            }
        }, scrapeUrls[i].indexOf('https') > -1);
    };
    timelog('starting scrape q at');
    scrapeQueue.start();
}

function enqueueGameUriRequest(uri) {
    queued++;
    gameResultsQueue.enqueue('https://acs.leagueoflegends.com/v1/stats/game/' + uri, function(data) {
        if (data == 'Too Many Requests') {
            timelog('requeueing at');
            enqueueGameUriRequest(uri);
        } else {
            var gameData;
            try {
                gameData = JSON.parse(data);
                processGameData(gameData);
            } catch(e) {
                console.log('json fail', data, e);
            }
            if (scrape) cache.uris.push(uri);
        }
    }, true);
};

function processGameData(gameData) {
    var stats = {}, // game stats we care about
        blueTeam = gameData.teams[0],
        redTeam = gameData.teams[1],
        winnerIndex,
        loserIndex,
        gold = [0,0],
        date;

    if (blueTeam.win == 'Win') {
        winnerIndex = 0;
        loserIndex = 1;
    } else {
        winnerIndex = 1;
        loserIndex = 0;
    }
    // can get team tag name from first part of player name; just using first player from each team
    stats.blueTag = gameData.participantIdentities[0].player.summonerName.split(' ')[0];
    stats.redTag = gameData.participantIdentities[5].player.summonerName.split(' ')[0];
    stats.winnerTag = gameData.participantIdentities[winnerIndex * 5].player.summonerName.split(' ')[0];

    stats.blueTower = gameData.teams[0].towerKills;
    stats.blueDragon = gameData.teams[0].dragonKills;
    stats.blueBaron = gameData.teams[0].baronKills;

    stats.redTower = gameData.teams[1].towerKills;
    stats.redDragon = gameData.teams[1].dragonKills;
    stats.redBaron = gameData.teams[1].baronKills;

    stats.gameDate = moment(gameData.gameCreation);
    stats.gameLength = gameData.gameDuration;

    gameData.participants.forEach(function(participant, i) {
        // blue team is i: 0-4, red team is i: 5-9
        var goldEarned = participant.stats.goldEarned;
        if (i < 5) {
            gold[0] += goldEarned;
        } else {
            gold[1] += goldEarned;
        }
    });

    stats.blueGold = gold[0];
    stats.redGold = gold[1];

    statsCollection.push(stats);
    processed++;
    timelog('processed '+processed+' at');
}

function scrapeDone() {
    timelog('scrape done; starting results q with ' + queued + ' items at');
    gameResultsQueue.start();
}

function gameResultsDone() {
    var output = '';

    timelog('results done; outputting at');

    // order by game date
    statsCollection.sort(function(a, b) {
        return a.gameDate.unix() - b.gameDate.unix();
    })
    statsCollection.forEach(function(result) {
        output += formatGameResults(result);
    });

    // if we scraped a fresh set of matches, cache it to file
    if (scrape) {
        fs.writeFile(CACHE_FILENAME, JSON.stringify(cache), function (err) {
            if (err) throw err;
        });
    }

    fs.writeFile(RESULTS_FILENAME, output, function (err) {
        if (err) throw err;
        timelog('finished '+processed+' games in');
    });

}

function formatGameResults(stats) {
    var out = [
        stats.gameDate.format('L LT'),
        stats.blueTag,
        stats.redTag,
        stats.winnerTag,
        stats.gameLength,
        stats.blueGold,
        stats.redGold,
        stats.blueTower,
        stats.redTower,
        stats.blueDragon,
        stats.redDragon,
        stats.blueBaron,
        stats.redBaron,
    ];

    return out + '\n';
}

function timelog(label) {
    label = label || '';
    console.log(label + ' ' + ((Date.now() - start) / 1000) + ' seconds');
}
