import express = require("express");
import fs = require("fs");
import {Page} from "./Classes/Page";
import {Pages} from "./Classes/Pages";
import mongoose = require("mongoose");
import {dbConnect} from "./db/db.tools";
import {Schema} from "mongoose";
import serverRouters from "./server/api/api";
import {RouterList} from "./Classes/RouterList";
import cors = require("cors");
// import * as cors from "cors";
import * as cookieParser from 'cookie-parser';
import * as bodyParser from "body-parser";


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
serverRouters.forEach((router: RouterList) => {
    app.use(router.apiName, router.routerApi);
})
const isAnotherProject = (str) => {
    if (str.includes('.')) {
        return true
    }
    return false;
}
const parseLine = (line): Page => {
    let page: Page;
    const parsedPage = line;
    page = new Page(parsedPage.country, parsedPage.blacklisted, parsedPage.name, parsedPage.views, parsedPage.responseSize);
    return page;
}
const createPage = (i, line, langTmp, isBlacklisted): Page => {
    let pageName;
    if (isBlacklisted) {
        pageName = line.slice(i + 1, line.length);
        return new Page(langTmp, isBlacklisted, pageName, null, null);
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
    return new Page(langTmp, isBlacklisted, pageName, views, responseSize);
}
const orderByCountry = (filename: string, isBlacklisted: boolean): Array<Pages> => {
    let lines = fs.readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
    let arrayCountries: Page[] = [];
    let nextCountry = '';
    let allArrayCountries: Array<Pages> = new Array<Pages>();
    let x = 0;
    let z = 0;
    while (x < lines.length) {
        let line = lines[x];
        let i = 0;
        let langTmp = '';
        while (line[i] !== ' ') {
            langTmp += line[i];
            i++;
        }
        if (!isAnotherProject(langTmp)) {
            let page: Page;
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

export const compute = (pageviewsFilename) => {
    const blacklistedPages: Array<Pages> = orderByCountry('./files_diff/blacklist_domains_and_pages', true);
    const listedPages = orderByCountry('./files_diff/' + pageviewsFilename, false);

    console.log('Extracting data from files...');
    blacklistedPages.forEach(a => {
        fs.writeFileSync('./files_diff/countries/blacklisted/' + a.country + '.txt', JSON.stringify(a.pagesByCountry));
    });
    listedPages.forEach(a => {
        fs.writeFileSync('./files_diff/countries/listed/' + a.country + '.txt', JSON.stringify(a.pagesByCountry));
    });

    console.log('Data extracted. Computing...');

    fs.readdir('./files_diff/countries/listed', (err, files) => {
        files.forEach(file => {
            const country = file.split('.')[0];
            const filePathListed = './files_diff/countries/listed/' + file;
            const filePathBlacklisted = './files_diff/countries/blacklisted/' + file;
            let lines = fs.readFileSync(filePathListed, 'utf-8').split('\n');
            let blacklistedLines = undefined;
            try {
                if (fs.existsSync(filePathBlacklisted)) {
                    blacklistedLines = fs.readFileSync(filePathBlacklisted, 'utf-8').split('\n');
                }
            } catch (err) {
                console.error(err);
            }

            let container = {};
            const container_0: Page[] = [];
            let container1: Page[] = [];
            const parsedLines = JSON.parse(lines[0]);
            parsedLines.forEach(line => {
                const parsedLine: Page = parseLine(line);
                container[parsedLine.name] = parsedLine;
            });
            console.log('Removing blacklisted pages for country ' + country + '...')


            if (blacklistedLines) {
                const blacklistedContainer = {};
                const parsedBlacklistedLines = JSON.parse(blacklistedLines[0]);
                parsedBlacklistedLines.forEach(bLines => {
                    const parsedBline: Page = parseLine(bLines);
                    blacklistedContainer[parsedBline.name] = parsedBline;
                });
                for (const [key, value] of Object.entries(blacklistedContainer)) {
                    if (container[key]) {
                        delete container[key];
                    }
                }
            }

            console.log('Blacklisted pages removed for country ' + country + '...');

            console.log('Getting top 25 page views for country ' + country + '...')
            let l = 25;
            let largestView = 0;
            while (l > 0) {
                for (const [key, value] of Object.entries(container)) {
                    const p: Page = parseLine(value);
                    if (parseInt(p.views) > largestView) {
                        largestView = parseInt(p.views);
                        p['index'] = key;
                        container1.push(p);
                    }
                }
                let p = 0;
                while (p < container1.length) {
                    if (largestView === parseInt(container1[p].views)) {
                        const tmp = {...container[container1[p]['index']]};
                        container_0.push(tmp);
                        delete container[container1[p]['index']];
                    }
                    p++;
                }
                container1 = [];
                largestView = 0;
                l--;
            }
            let fileName = './files_diff/countries/results/'+ pageviewsFilename + '/' + country + '.json';
            fs.writeFileSync(fileName, JSON.stringify(container_0));
            console.log('Top 25 pages for country : ' + country + ' have been written to file : ' + fileName + '.');
        });
    });

    fs.readdir('./files_diff/countries/listed', (err, files) => {
        files.forEach(file => {
            fs.unlinkSync('./files_diff/countries/listed/' + file)
        })
    })
    fs.readdir('./files_diff/countries/blacklisted', (err, files) => {
        files.forEach(file => {
            fs.unlinkSync('./files_diff/countries/blacklisted/' + file)
        })
    })
    fs.unlinkSync('./files_diff/' + pageviewsFilename)
}
app.listen(3001, () => {

    // compute('');
})
