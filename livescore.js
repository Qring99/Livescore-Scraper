const axios = require('axios');
const Apify = require('apify'); // Apify SDK
const chalk = require('chalk'); // Using v4.1.2
const figlet = require('figlet');

// Store the original console.log
const originalConsoleLog = console.log;

// Override console.log to write to terminal and collect logs for Apify dataset
const logs = []; // Array to store log lines
console.log = function (...args) {
    originalConsoleLog.apply(console, args);

    const plainText = args.map(arg => {
        if (typeof arg === 'string') {
            return arg.replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI codes
        }
        return arg;
    }).join(' ');

    logs.push(plainText);
};

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // e.g., "2025-03-17"
}

function formatMatchDate(dateString) {
    if (!dateString || dateString.length < 8) return "unknown";
    const year = dateString.slice(0, 4).slice(-2);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    return `${day}.${month}.${year}`; // e.g., "27.10.24"
}

function getTomorrowDate() {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

const tomorrowDate = getTomorrowDate();
const url = `https://prod-cdn-mev-api.livescore.com/v1/api/app/date/soccer/${tomorrowDate}/0?countryCode=NG&locale=en&MD=1`;

let urlCount = 0;
const allUrls = [];
const fixturesData = {
    "date": getTodayDate(),
    "total_matches_tomorrow": 0,
    "matches": []
};

// Top-level async execution (no Apify.main)
(async () => {
    console.log(chalk.white.bold(figlet.textSync('Football Fixtures Scraper by Qring', { font: 'Standard' })));
    console.log(chalk.white.bold('=== FOOTBALL FIXTURES SCRAPER ==='));

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (!data?.Stages?.length) {
            console.log(chalk.red('No stages found in initial response'));
            return;
        }

        data.Stages.forEach(stage => {
            const cnmT = stage.CnmT || "unknown";
            const scd = stage.Scd || "unknown";

            if (!stage.Events?.length) return;

            stage.Events.forEach(event => {
                const t1Name = event.T1?.[0]?.Nm || "unknown";
                const t2Name = event.T2?.[0]?.Nm || "unknown";

                if (event.Pids) {
                    Object.keys(event.Pids).forEach(key => {
                        if (key === "8") {
                            const pidsValue = event.Pids[key] || "unknown";
                            const newUrl = `https://www.livescore.com/_next/data/rBZqXyzFUTFIHBhe08WFB/en/football/${cnmT}/${scd}/${t1Name}-vs-${t2Name}/${pidsValue}/h2h.json`;
                            urlCount++;
                            allUrls.push({ url: newUrl, team1: t1Name, team2: t2Name });
                        }
                    });
                }
            });
        });

        console.log(chalk.magenta('Total Matches Found: ') + urlCount);
        fixturesData.total_matches_tomorrow = urlCount;

        if (!allUrls.length) {
            console.log(chalk.red('No Matches Found'));
            return;
        }

        const saveFixturesData = async () => {
            try {
                await Apify.setValue('FIXTURES', fixturesData, { contentType: 'application/json' });
                console.log(chalk.magenta('Fixtures data saved to Apify store'));
            } catch (error) {
                console.error(chalk.red('Error saving Fixtures data to Apify: ') + error.message);
            }
        };

        const processUrl = async (urlIndex) => {
            if (urlIndex >= allUrls.length) {
                console.log(chalk.magenta('All Fixtures processed'));
                await saveFixturesData();
                const dataset = await Apify.openDataset('OUTPUT');
                await dataset.pushData(logs.map(line => ({ log: line })));
                console.log(chalk.magenta('Output logs saved to Apify dataset'));
                return;
            }

            const { url: currentUrl, team1, team2 } = allUrls[urlIndex];
            console.log(chalk.blue(`\nProcessing Fixtures ${urlIndex + 1}: `) + `${team1} vs ${team2}`);

            try {
                const response = await axios.get(currentUrl);
                const h2hData = response.data;

                const matchData = {};
                let hasData = false;

                const metaParams = h2hData?.pageProps?.layoutContext?.metaParams;
                if (metaParams) {
                    const team1 = metaParams.team1 || "unknown";
                    const team2 = metaParams.team2 || "unknown";
                    matchData.teams = `${team1} vs ${team2}`;
                    console.log(chalk.cyan(`"${team1}" vs "${team2}"`));
                } else {
                    matchData.teams = "unknown vs unknown";
                    console.log(chalk.red('metaParams not found'));
                }

                const headToHead = h2hData?.pageProps?.initialEventData?.event?.headToHead?.h2h;
                if (headToHead?.length) {
                    matchData.h2h = [];
                    let h2hCounter = 1;
                    headToHead.forEach(h2hGroup => {
                        if (h2hGroup.events?.length) {
                            hasData = true;
                            h2hGroup.events.forEach(event => {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                console.log(chalk.white.bold(`H2H ${h2hCounter}:`));
                                console.log(chalk.green(`Stage Name: ${stageName}`));
                                console.log(chalk.yellow(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`));

                                matchData.h2h.push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                h2hCounter++;
                            });
                        }
                    });
                } else {
                    console.log(chalk.red('No H2H data found'));
                }

                const homeData = h2hData?.pageProps?.initialEventData?.event?.headToHead?.home;
                if (homeData?.length) {
                    matchData["Home last matches"] = [];
                    console.log(chalk.blue('\nHome last matches:'));
                    let hlmCounter = 1;
                    homeData.forEach(homeGroup => {
                        if (homeGroup.events?.length) {
                            homeGroup.events.forEach(event => {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                console.log(chalk.white.bold(`HLM ${hlmCounter}:`));
                                console.log(chalk.green(`Stage Name: ${stageName}`));
                                console.log(chalk.yellow(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`));

                                matchData["Home last matches"].push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                hlmCounter++;
                            });
                            hasData = true;
                        }
                    });
                } else {
                    console.log(chalk.red('No Home last matches found'));
                }

                const awayData = h2hData?.pageProps?.initialEventData?.event?.headToHead?.away;
                if (awayData?.length) {
                    matchData["Away last matches"] = [];
                    console.log(chalk.blue('\nAway last matches:'));
                    let almCounter = 1;
                    awayData.forEach(awayGroup => {
                        if (awayGroup.events?.length) {
                            homeGroup.events.forEach(event => {
                                const stageName = event.stage?.stageName || "unknown";
                                const homeTeam = event.homeName || "unknown";
                                const awayTeam = event.awayName || "unknown";
                                const homeScore = event.homeScore || "0";
                                const awayScore = event.awayScore || "0";
                                const matchDate = formatMatchDate(event.startDateTimeString);

                                console.log(chalk.white.bold(`ALM ${almCounter}:`));
                                console.log(chalk.green(`Stage Name: ${stageName}`));
                                console.log(chalk.yellow(`Score: ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`));

                                matchData["Away last matches"].push({
                                    "Score": `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
                                    "Stage Name": stageName,
                                    "date": matchDate
                                });
                                almCounter++;
                            });
                            hasData = true;
                        }
                    });
                } else {
                    console.log(chalk.red('No Away last matches found'));
                }

                if (hasData) {
                    fixturesData.matches.push(matchData);
                    await saveFixturesData();
                } else {
                    console.log(chalk.red('No H2H, Home, or Away data found for this URL'));
                }

                await processUrl(urlIndex + 1);
            } catch (error) {
                console.log(chalk.red(`Skipping URL ${urlIndex + 1} due to error: ${error.message}`));
                await saveFixturesData();
                await processUrl(urlIndex + 1);
            }
        };

        await processUrl(0);
    } catch (error) {
        console.error(chalk.red("Error in first API call: ") + error.message);
        await Apify.setValue('FIXTURES', fixturesData, { contentType: 'application/json' });
        const dataset = await Apify.openDataset('OUTPUT');
        await dataset.pushData(logs.map(line => ({ log: line })));
    }
})();
