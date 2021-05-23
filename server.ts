import express = require("express");
import fs = require("fs");
import {Page} from "./Classes/Page";
import {Pages} from "./Classes/Pages";
import serverRouters from "./server/api/api";
import {RouterList} from "./Classes/RouterList";
import cors = require("cors");
import expressSession = require("express-session");
import cookieParser = require('cookie-parser');
import * as bodyParser from "body-parser";
import EventEmitter = require("events");
import {EventTypes} from "./EventTypes/EventTypes";
import redis = require("redis");
import RedisStore = require("connect-redis");
import {sockets} from "./sockets";
import {User} from "./Classes/User";
import {
    BLACKLIST_FILE,
    BLACKLISTED_COUNTRIES, COUNTRIES,
    FILES_DIFF,
    LISTED_COUNTRIES,
    RESULTS,
    RESULTS_ALL, TOP_MAX
} from "./constants/filesConstants";

let redisStore = RedisStore(expressSession);
let redisClient = redis.createClient();
const app = express();
const eventEmitter: EventEmitter = new EventEmitter();

app.use(expressSession({
    store: new redisStore({client: redisClient}),
    secret: 'secretlel',
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 60000,
    }
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
serverRouters.forEach((router: RouterList) => {
    app.use(router.apiName, router.routerApi);
});
app.use(express.static(__dirname + '/dist/pageviews-front'));

const isAnotherProject = (str: string) => {
    return !!str.includes('.');
}
const parseLine = (line: string): Page => {
    let page: Page;
    const parsedPage = line.split(' ');
    page = new Page(parsedPage[0], false, parsedPage[1], parsedPage[2], parsedPage[3]);
    return page;
}
const createPage = (i: number, line: string, langTmp: string, isBlacklisted: boolean): string => {
    let pageName;
    if (isBlacklisted) {
        pageName = line.slice(i + 1, line.length);
        return langTmp + ' ' + pageName;
    }
    let y = i + 1;
    while (line[y] !== ' ') {
        y++;
    }
    pageName = line.slice(i + 1, y);
    let x = y + 1;
    while (line[x] !== ' ') {
        x++;
    }
    let views = line.slice(y + 1, x);
    let responseSize = line[x + 1];
    return langTmp + ' ' + pageName + ' ' + views + ' ' + responseSize;
}

/**
 * This is the function that orders the downloaded and ungzipped pageview file by sub-domains.
 *
 * Deleting several elements existing in one list from another list is a very heavy operation.
 *
 * Since I knew that I wouldn't have much time to think and conceive a very specific algorithm for this task,
 * I chose to make a basic one.
 *
 * IMPORTANT: I am not saying that I didn't have much time at all, I'm saying that I planned other things for this
 * project than just the algorithmic part. So I just needed something that works correctly and if I'd have more time
 * by the end, I'll perfect it.
 *
 * Therefore, for my specific needs, I needed to sort each page by sub-domain and store it in dedicated sub-domain files.
 * This architecture have several advantages and disadvantages.
 * Advantages :
 * 1.    In order to take out blacklisted pages from the result list, every page (blacklisted or listed) will be stored in
 * a corresponding sub-domain file.
 * For each sub-domain file containing the listed pages, the algorithm just needs the corresponding blacklisted
 * file to filter blacklisted pages from it.
 *
 * 2.    Having and browsing very large arrays of data in the memory slows the global server operations
 * since the node server only uses the allocated memory.
 * Therefore, instead of having and browsing during the whole sorting process a very large array of blacklisted pages
 * and a another one of listed pages, I chose to have several small ones that contain the subdomains.
 * Since each file is being read asynchronously, this allows a fast availability of data for each sub-domain
 * (depending on the number of pages per domains).
 *
 * Disadvantages :
 * -    With each pageview file, there are in average 326 sub-domains. Sometime 327, sometime 325.
 * Since I create one file by sud-domains, reading each file can be redundant and consume a lot of memory.
 *
 * @param filename the name of the downloaded and ungzipped pageview file
 * @param isBlacklisted boolean specifying if it is the blacklisted or listed pageview file
 * @return an array of Pages which contains Pages.country and Pages.pagesByCountry
 * */
const orderByCountry = (filename: string, isBlacklisted: boolean): Array<any> => {
    // array containing each line of the file specified
    let lines = fs.readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
    let arrayCountries = [];
    let nextCountry = '';
    let allArrayCountries: Array<Pages> = new Array<Pages>();
    let x = 0;
    let z = 0;
    while (x < lines.length) {
        // One line of the lines array
        let line = lines[x];
        let i = 0;
        let langTmp = '';
        // Parsing the white space in the line, this first iteration fetches the sub-domain
        while (line[i] !== ' ') {
            langTmp += line[i];
            i++;
        }
        // Since the pageview file contains all Wikimedia projects pages, I make sure to have only the wikipedia project
        if (!isAnotherProject(langTmp)) {
            let page;
            /**
             * Creates a Page object which contains :
             * Page.country (sub-domain)
             * Page.name
             * Page.views
             * Page.responseSize
             * Page.blacklisted (deprecated, will be deleted)
             * */
            page = createPage(i, line, langTmp, isBlacklisted);
            if (lines[x + 1]) {
                let c = 0;
                while (lines[x + 1][c] !== ' ') {
                    nextCountry += lines[x + 1][c];
                    c++;
                }
                arrayCountries.push(page);
                if (nextCountry !== langTmp) {
                    const pages: Pages = new Pages();
                    pages.pagesByCountry = arrayCountries;
                    pages.country = langTmp;
                    allArrayCountries[z] = pages;
                    arrayCountries = [];
                    nextCountry = '';
                    z++;
                }
                nextCountry = '';
            } else {
                arrayCountries.push(page);
                if (nextCountry !== langTmp) {
                    const pages: Pages = new Pages();
                    pages.pagesByCountry = arrayCountries;
                    pages.country = langTmp;
                    allArrayCountries[z] = pages;
                    arrayCountries = [];
                    nextCountry = '';
                    z++;
                }
                nextCountry = '';
            }
        }
        x++;
    }
    return allArrayCountries;
}

/**
 * This is the function that computes the top 25 (TOP_MAX) pages for each sub-domains of the pageview file given
 * in parameters.
 *
 * I chose to split the pageview file by sub-domains for easy user's data restitution and display.
 * In order to make the user wait less - which I think is worse than having a bad algorithm
 * (which is the case here, I don't deny it) -, each time a sub-domain's top 25 pageviews has been processed,
 * it is sent to the user.
 *
 * Each line of that file will be an implementation of the Page class declared in Page.ts file
 * It allows easy CRUD operations during parsing.
 *
 * Since the algorithm is basic, it overloads the server and slows requests sent to it, which can cause client's
 * socket disconnection. Therefore, and in order to successfully restitute the data to the user, I check the user's
 * socketId upon reconnection. If it matches the previous one before disconnection, I restitute the data.
 *
 * @param pageviewsFilename the name of the pageview file that was downloaded and ungziped.
 * @param user the connected user that requested the pageview.
 * @param param parameter defined on download from profile
 * */
export const compute = (pageviewsFilename: string, user: User, param: any): any => {
    // Ordering the blacklisted pages by country
    const blacklistedPages = orderByCountry(FILES_DIFF + BLACKLIST_FILE, true);
    // Ordering the listed pages by country
    const listedPages = orderByCountry(FILES_DIFF + pageviewsFilename, false);

    /**
     * Since I chose to compute the pageview file by ordering it by sub-domains, each sub-domain will be written in
     * /files_diff/countries/blacklisted or /files_diff/countries/listed wether it is blacklisted or not.
     * */
    // Write files
    blacklistedPages.forEach(a => {
        fs.writeFileSync(FILES_DIFF + BLACKLISTED_COUNTRIES + a.country + '.txt', a.pagesByCountry);
    });
    listedPages.forEach(a => {
        fs.writeFileSync(FILES_DIFF + LISTED_COUNTRIES + a.country + '.txt', a.pagesByCountry);
    });

    /**
     * Here it starts. Because the number of sub-domains listed by Wikipedia in each pageviews is varying, I have no
     * way to know when all sub-domains have been computed.
     * I then thought about 'promisifying' the process since the node fs module can read files asynchronously.
     * Therefore, I used an array of promises to know when each promise has been fulfilled and in the end, to know when
     * all promises have been fulfilled.
     * */
    const promises = new Array<Promise<any>>();

    /**
     * Here, I have to take out blacklisted pages.
     * Since I sorted the pageview file and the blacklisted pageview file by sub-domains files,
     * each time I read a listed file, I just need to take out the pages existing in the same file name that contains
     * blacklisted pages.
     * */
    fs.readdir(FILES_DIFF + LISTED_COUNTRIES, (err, files) => {
        let arrayContainer_0 = '';
        files.forEach(file => {
            // Getting sub-domain name
            const country = file.split('.')[0];
            // Sub-domain file of listed pages
            const filePathListed = FILES_DIFF + LISTED_COUNTRIES + file;
            // Sub-domain file of blacklisted pages
            const filePathBlacklisted = FILES_DIFF + BLACKLISTED_COUNTRIES + file;
            let blacklistedLines: any = undefined;
            // Every wikipedia subdomain doesn't necessarily have blacklisted pages, checking that in this try/catch.
            try {
                if (fs.existsSync(filePathBlacklisted)) {
                    blacklistedLines = fs.readFileSync(filePathBlacklisted, 'utf-8').split(',');
                }
            } catch (err) {
                console.error(err);
            }
            /**
             * In order to successfully sort the sub-domain files by the most views, I chose an object data structure.
             * The advantage is that I won't need to use any browsing function to manipulate it.
             * For example, if I need to delete a blacklisted page from the listed page array, I just need
             * to know the element that indexes the former in the latter, then use the delete operator by target it.
             * */
            const newPromise = new Promise((resolve) => {
                // Reading sub-domain file of listed pages
                fs.readFile(filePathListed, (err1, data) => {
                    // Array of pages in the listed sub-domain file
                    let lines = data.toString().split(',');
                    /**
                     * Object that will contain each listed page indexed by their names
                     * Ex. for page 'en Main_Page 1 0', container will be equal to : {Main_Page: en Main_Page 1 0}
                     * */
                    let container: any = {};

                    // Object that contains the top TOP_MAX viewed page for the current sub-domain file.
                    const container_0: Page[] = [];

                    /** Object that contains the top TOP_MAX viewed page for the current sub-domain file and that will
                     * be written in the final results file needed for this exercice.
                     * */
                    const container_1 = [];

                    /** Temporary object that serves for comparison of the most viewed pages in the current
                     * sub-domain file */
                    let containerTmp: Page[] = [];


                    lines.forEach(line => {
                        // parseLine converts a line into a Page object
                        const parsedLine: Page = parseLine(line);
                        container[parsedLine.name] = parsedLine;
                    });

                    /**
                     * Here lies the advantage of the data structure I used.
                     * For this exercise, the blacklisted file will always be smaller than the listed file.
                     * Since all the blacklisted pages have been sorted by subdomains, the files containing the
                     * blacklisted pages is even smaller, which greatly increases the blacklisted page deletion from
                     * the listed pages.
                     * */
                    // Removing blacklisted pages existing in listed sub-domain pages
                    if (blacklistedLines) {
                        const blacklistedContainer: any = {};
                        blacklistedLines.forEach((bLines: any) => {
                            const parsedBline: Page = parseLine(bLines);
                            blacklistedContainer[parsedBline.name] = parsedBline;
                        });
                        for (const [key] of Object.entries(blacklistedContainer)) {
                            /**
                             * The delete operator just targets an indexed element in the object container
                             * previously declared and deletes it if it exists and is blacklisted */
                            if (container[key]) {
                                delete container[key];
                            }
                        }
                    }


                    /** Here, there are only listed pages, all blacklisted pages for the current sub-domain file
                     * have been deleted. */

                        // Algorithm that sorts top 25 pages
                    let l = TOP_MAX;
                    let largestView = 0;
                    while (l > 0) {
                        /** Browse the current subdomain file (without blacklisted pages) and stores the page with
                         * with the greatest view in a temporary array */
                        for (const [key, value] of Object.entries(container)) {
                            const p: any = value;
                            // @ts-ignore: property 'views' does not exist on type 'unknown'
                            if (parseInt(p.views) > largestView) {
                                // @ts-ignore: property 'views' does not exist on type 'unknown'
                                largestView = parseInt(p.views);
                                p['index'] = key;
                                // @ts-ignore: Argument of type 'unknown' is not assignable to parameter of type 'Page'
                                containerTmp.push(p);
                            }
                        }
                        /** Once the browsing is done, I have a temporary array (containerTmp) containing all of
                         * the greatest views and a variable (largestView) containing the largest view of the file. */
                        let p = 0;
                        /** Here, I find the page with largest view in the temporary array of pages with largest views.
                         * Then we store it in the object containing the TOP_MAX views.
                         * Then we delete that largest view from the original container.
                         * Which, when the loop will start again, will be a container without the largest view
                         * previously fetched.*/
                        while (p < containerTmp.length) {
                            if (largestView === parseInt(containerTmp[p].views)) {
                                const tmp = {...container[containerTmp[p]['index']]};
                                container_0.push(tmp);
                                container_1.push(tmp['country'] + ' ' + tmp['name'] + ' ' + tmp['views'] + ' ' + tmp['responseSize']);
                                delete container[containerTmp[p]['index']];
                            }
                            p++;
                        }
                        containerTmp = [];
                        largestView = 0;
                        l--;
                    }

                    /**
                     * Once the top 25 viewed pages have been fetched, I write them both in a JSON formatted file and
                     * a text file.
                     * The JSON formatted file will serve immediately for the user while the text file will be written
                     * once the whole process of all the sub-domains is done.*/
                    if (country.length > 0) {
                        let fileName = FILES_DIFF + RESULTS + pageviewsFilename + '/' + country + '.json';
                        container_1.forEach(c => {
                            arrayContainer_0 += c + '\n';
                        })
                        if (!fs.existsSync(FILES_DIFF + RESULTS))
                            fs.mkdirSync(FILES_DIFF + RESULTS);
                        fs.writeFile(fileName, JSON.stringify(container_0), () => {
                            eventEmitter.emit(EventTypes.fileData, container_0);
                            // Resolving the promise to signal that the treatment for the current file is done.
                            resolve('');
                        });
                    }
                });
            });
            // Adding the promise to the promises array, it will be useful once all sub-domains files have been treated.
            promises.push(newPromise);
        });
        Promise.all(promises).then(() => {
            // Once all promises have been resolved, write the file for the exercise.
            if (!fs.existsSync(FILES_DIFF + RESULTS_ALL))
                fs.mkdirSync(FILES_DIFF + RESULTS_ALL);
            fs.writeFile(FILES_DIFF + RESULTS_ALL + pageviewsFilename, arrayContainer_0, () => {
            })
            setTimeout(() => {
                // Timeout to make sure that the socket reconnection signal happens before the emition of the end signal.
                const objToEmit = {user: user, pageviewsFilename: pageviewsFilename, param: param};
                eventEmitter.emit(EventTypes.endOfWrite, objToEmit);

            }, 10000)
        }).catch(err => console.error(err));
    });
}

const s = app.listen(3001, () => {
    if (!fs.existsSync(FILES_DIFF))
        fs.mkdirSync(FILES_DIFF);
    if (!fs.existsSync(FILES_DIFF + COUNTRIES))
        fs.mkdirSync(FILES_DIFF + COUNTRIES);
    if (!fs.existsSync(FILES_DIFF + RESULTS))
        fs.mkdirSync(FILES_DIFF + RESULTS);
    if (!fs.existsSync(FILES_DIFF + BLACKLISTED_COUNTRIES))
        fs.mkdirSync(FILES_DIFF + BLACKLISTED_COUNTRIES);
    if (!fs.existsSync(FILES_DIFF + LISTED_COUNTRIES))
        fs.mkdirSync(FILES_DIFF + LISTED_COUNTRIES);
})
const so = sockets(s, eventEmitter);
export default so;
