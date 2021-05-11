import express = require("express");
import * as fs from 'fs'
import {Page} from "./Classes/Page";
import {Pages} from "./Classes/Pages";
import {mergeSort} from "./Methods";
import mongoose = require("mongoose");

import {dbConnect} from "./db/db.tools";
import {Schema} from "mongoose";
const app = express();

const createPage = (y, line2, line1Tmp, line2Tmp, langTmp): Page => {
    let x = y + 1;
    while (line2[x] !== ' ') {
        x++;
    }
    let views = line2.slice(y + 1, x);
    let responseSize = line2[x + 1];
    if (line1Tmp && line1Tmp === line2Tmp)
        return new Page(langTmp, true, line2Tmp, views, responseSize);
    else
        return new Page(langTmp, false, line2Tmp, views, responseSize);
}
const isAnotherProject = (str) => {
    if (str.includes('.')) {
        return true
    }
    return false;
}
const isBlacklisted = (line1, line2): Page => {
    let i = 0;
    let langTmp = '';
    while (line1[i] !== ' ') {
        langTmp += line1[i];
        i++;
    }
    if (!isAnotherProject(langTmp)) {
        let y = i + 1;
        while (line1[y] !== ' ') {
            y++;
        }
        //Checking the blacklist file by country code
        if (line2.includes(langTmp + ' ')) {
            let line2Tmp = line2.slice(i + 1, line1.length);
            let line1Tmp = line1.slice(i + 1, y);
            return createPage(y, line1, line2Tmp, line1Tmp, langTmp);
        } else {
            //if we're here, the country is not blacklisted
            let line1Tmp = line1.slice(i + 1, y);
            return createPage(y, line1, undefined, line1Tmp, langTmp);
        }
    } else {
        return null;
    }
}
const parseLine = (line): Page => {
    let page: Page;
    const parsedPage = line;
    page = new Page(parsedPage.country, parsedPage.blacklisted, parsedPage.name, parsedPage.views, parsedPage.responseSize);
    return page;
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
            let pageName = line.slice(i + 1, line.length);
            let page: Page;
            if (!isBlacklisted) {

                let y = i + 1;
                while (line[y] !== ' ') {
                    y++;
                }
                pageName = line.slice(i + 1, y);
                let z = y + 1;
                while (line[z] !== ' ') {
                    z++;
                }
                let views = line.slice(y + 1, z);
                let responseSize = line[z + 1];
                page = new Page(langTmp, isBlacklisted, pageName, views, responseSize);
            } else {
                page = new Page(langTmp, isBlacklisted, pageName, null, null);
            }
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
app.listen(3000, () => {


    let lines = fs.readFileSync('./files_diff/countries/listed/' + 'en' + '.txt', 'utf-8').split('\n');
    let lines1 = fs.readFileSync('./files_diff/countries/listed/' + 'el' + '.txt', 'utf-8').split('\n');

    const container: Page[] = [];
    const container1: Page[] = [];
    const parsedLines = JSON.parse(lines[0]);
    const parsedLines1 = JSON.parse(lines1[0]);
    parsedLines1.forEach(line1 => {
        container1.push(parseLine(line1));
    })
    parsedLines.forEach(line => {
        container.push(parseLine(line));
    })

    const pageSchema = new Schema({
        country: {type: String},
        blacklisted: {type: Boolean},
        name: {type: String},
        views: {type: String},
        responseSize: {type: String}
    })
    const dbConnection = dbConnect('pageviews');
    const Page = mongoose.model('en', pageSchema);
    dbConnection.on('error', function (err) {
        console.error(err);
    });
    dbConnection.once('open', function () {
        Page.insertMany(container).then(res => {
            console.log(res);
            console.log('success');
        }).catch(err => {
            console.log('failure');
            console.log(err);
        })
    })
    // const promise1 = (): Promise<any> => {
    //     return new Promise<any>((resolve, reject) => {
    //         console.log('here1 ?')
    //         resolve(mergeSort(container1));
    //     })
    // }
    // const promise = (): Promise<any> => {
    //     return new Promise<any>((resolve, reject) => {
    //         console.log('here ?')
    //         resolve(mergeSort(container));
    //     })
    // }
    //
    // console.log('nani?')
    // const pr = promise();
    // const pr1 = promise1();
    // pr.then(ar => {
    //     console.log('wsh')
    //     ar.reverse();
    //     const newArray = ar.slice(0, 25);
    //     console.log(newArray);
    //     console.log(newArray.length);
    //     console.log('doney');
    // })
    // pr1.then(ar => {
    //     console.log('wsh1')
    //     ar.reverse();
    //     const newArray = ar.slice(0, 25);
    //     console.log(newArray);
    //     console.log(newArray.length);
    //     console.log('doney1');
    // })
    // const promise: Promise<any> = new Promise<any>((resolve, reject) => {
    //     resolve(mergeSort(container));
    // })
    // console.log(container);
    // const m = mergeSort(container);
    // m.reverse();
    // const newArray = m.slice(0, 25);
    // console.log(newArray);
    // console.log(newArray.length);
    console.log('done');
    // console.log(newArray);
    // console.log(ar[0]);
    // console.log(ar[1]);
    // const m = mergeSort(ar);
    // console.log(m);
    // const blacklistedPages: Array<Pages> = orderByCountry('./files_diff/blacklist_domains_and_pages', true);
    // const listedPages = orderByCountry('./files_diff/pageviews-20210501-000000', false);
    //
    // blacklistedPages.forEach(a => {
    //     fs.writeFileSync('./files_diff/countries/blacklisted/' + a.country + '.txt', JSON.stringify(a.pagesByCountry));
    // })
    // listedPages.forEach(a => {
    //     if (a.country === 'ace') {
    //         let lines = fs.readFileSync('./files_diff/countries/blacklisted/' + a.country + '.txt', 'utf-8').split('\n').filter(Boolean);
    //
    //     }
    //
    //     fs.writeFileSync('./files_diff/countries/listed/' + a.country + '.txt', JSON.stringify(a.pagesByCountry));
    // })
})
