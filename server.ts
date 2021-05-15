import express = require("express");
import fs = require("fs");
import {Page} from "./Classes/Page";
import {Pages} from "./Classes/Pages";
import serverRouters from "./server/api/api";
import {RouterList} from "./Classes/RouterList";
import cors = require("cors");
import * as cookieParser from 'cookie-parser';
import * as bodyParser from "body-parser";
import { Server, Socket } from "socket.io";
import EventEmitter = require("events");
const http = require('http');

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

const eventEmitter : EventEmitter = new EventEmitter();
eventEmitter.emit('test', 'fdp1');

const isAnotherProject = (str) => {
    return !!str.includes('.');
}
const parseLine = (line): Page => {
    let page: Page;
    const parsedPage = line.split(' ');
    page = new Page(parsedPage[0], null, parsedPage[1], parsedPage[2], parsedPage[3]);
    return page;
}
const createPage = (i, line, langTmp, isBlacklisted): string => {
    let pageName;
    if (isBlacklisted) {
        pageName = line.slice(i + 1, line.length);
        return langTmp + ' ' + pageName;
        // return new Page(langTmp, isBlacklisted, pageName, null, null);
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
    // return new Page(langTmp, isBlacklisted, pageName, views, responseSize);
}
const orderByCountry = (filename: string, isBlacklisted: boolean): Array<any> => {
    let lines = fs.readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
    let arrayCountries = [];
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
            let page;
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

export const compute = async (pageviewsFilename) => {
    const blacklistedPages = orderByCountry('./files_diff/blacklist_domains_and_pages', true);
    const listedPages = orderByCountry('./files_diff/' + pageviewsFilename, false);

    console.log('Extracting data from files...');
    blacklistedPages.forEach(a => {
        fs.writeFileSync('./files_diff/countries/blacklisted/' + a.country + '.txt', a.pagesByCountry);
    });
    listedPages.forEach(a => {
        fs.writeFileSync('./files_diff/countries/listed/' + a.country + '.txt', a.pagesByCountry);
    });

    console.log('Data extracted. Computing...');

    fs.readdir('./files_diff/countries/listed', (err, files) => {
        files.forEach(file => {
            const country = file.split('.')[0];
            const filePathListed = './files_diff/countries/listed/' + file;
            const filePathBlacklisted = './files_diff/countries/blacklisted/' + file;
            let blacklistedLines = undefined;
            try {
                if (fs.existsSync(filePathBlacklisted)) {
                    blacklistedLines = fs.readFileSync(filePathBlacklisted, 'utf-8').split(',');
                }
            } catch (err) {
                console.error(err);
            }
            fs.readFile(filePathListed, (err1, data) => {
                let lines = data.toString().split(',');
                let container = {};
                const container_0: Page[] = [];
                let container1: Page[] = [];
                lines.forEach(line => {
                    const parsedLine: Page = parseLine(line);
                    container[parsedLine.name] = parsedLine;
                });
                // console.log('Removing blacklisted pages for country ' + country + '...')


                if (blacklistedLines) {
                    const blacklistedContainer = {};
                    blacklistedLines.forEach(bLines => {
                        const parsedBline: Page = parseLine(bLines);
                        blacklistedContainer[parsedBline.name] = parsedBline;
                    });
                    for (const [key, value] of Object.entries(blacklistedContainer)) {
                        if (container[key]) {
                            delete container[key];
                        }
                    }
                }

                // console.log('Blacklisted pages removed for country ' + country + '...');

                // console.log('Getting top 25 page views for country ' + country + '...')
                let l = 25;
                let largestView = 0;
                while (l > 0) {
                    for (const [key, value] of Object.entries(container)) {
                        const p = value;
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
                if (country.length > 0) {
                    let fileName = './files_diff/countries/results/'+ pageviewsFilename + '/' + country + '.json';
                    fs.writeFile(fileName, JSON.stringify(container_0), () => {
                        eventEmitter.emit('fileData', container_0);
                    });
                }
            });
            // console.log('Top 25 pages for country : ' + country + ' have been written to file : ' + fileName + '.');
        });
    });
    // fs.readdir('./files_diff/countries/listed', (err, files) => {
    //     files.forEach(file => {
    //         console.log('fdppppp');
    //         fs.unlinkSync('./files_diff/countries/listed/' + file)
    //     })
    // })
    // fs.readdir('./files_diff/countries/blacklisted', (err, files) => {
    //     files.forEach(file => {
    //         fs.unlinkSync('./files_diff/countries/blacklisted/' + file)
    //     })
    // })
    // fs.unlinkSync('./files_diff/' + pageviewsFilename)
}

const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});
let ss;
io.on('connection', (socket: Socket) => {
    console.log('a user connected');
    console.log(socket.id);
    socket.emit('fdp', 'fdp');
    ss = socket;
});
const pageviewsInputHandler = io.of('/');
pageviewsInputHandler.on('connection', (socket => {
    eventEmitter.on('fileData', (d) => {
        socket.emit('fileData', d);
    })
    socket.on('input', data => {
        eventEmitter.emit('first', 'connection')
        socket.emit('reception', 'data received');
        socket.emit('reception', 'data received1');
    })
}))

server.listen(3001, () => {
    // io.to('/').emit('ert', 'aeri');
        // ss.emit('ert', 'FDP');
    // compute('');
})
