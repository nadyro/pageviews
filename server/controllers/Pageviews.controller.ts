import {DateTimeFormat} from "../../Classes/DateTimeFormat";
import got from "got"
import fs = require("fs");
import {compute} from "../../server";
import {spawn} from "child_process";
import {Pages} from "../../Classes/Pages";
import {Page} from "../../Classes/Page";
import {EventTypes} from "../../EventTypes/EventTypes";
import EventEmitter = require("events");
import {User} from "../../Classes/User";
import {blacklistUrl, pageViewsUrl} from "../../constants/urlConstants";
import {BLACKLIST_FILE, FILES_DIFF, pageViewsPrefix, RESULTS} from "../../constants/filesConstants";
import {ResponseStatus} from "../../Classes/ResponseStatus";
import {DateRange} from "../utils/dateRange";
import {dbConnect} from "../../db/db.tools";
import {DB_NAME_PAGEVIEWS} from "../../properties/db/db.properties";
import {ResponseCodes} from "../../Classes/ResponseCodes";
import mongoose = require("mongoose");
import {generateSchema} from "../../db/generateSchema";
import {PageViews} from "../../Classes/PageViews";
import {MongoError} from "mongodb";
import {promisify} from 'util';
import stream = require('stream');
const ObjectId = require('mongodb').ObjectID;


const pageViewsSchema = generateSchema(PageViews);
export const statusEventEmitter: EventEmitter = new EventEmitter();

export class PageviewsController {
    /**
     * This is the function that parses the results in order to send them as a formatted object class to the client.
     * @param fileName name of the result file previously generated
     * @return an array containing all top viewed pages sorted by country and most views.
     * */
    private getArrayAllPagesByCountry(fileName) {
        // Fetches JSON formatted files in the result directory previously computed.
        const files = fs.readdirSync(FILES_DIFF + RESULTS + fileName);
        const arrayPages = [];
        files.forEach(file => {
            // Reads each file and stores its data
            const pages = fs.readFileSync(FILES_DIFF + RESULTS + fileName + '/' + file).filter(Boolean);
            // Stringify the data in order to process it since the readFileSync renders a buffer and not an array
            let lines = pages ? pages.toString() : undefined;
            if (lines && lines.length > 0 || true) {
                let parsedLines = JSON.parse(lines);
                arrayPages.push(parsedLines);
            }
        });
        let arrayAllPage = [];
        let arrayAllPagesByCountry = {};
        // All pages with a JSON format are mapped to a Page object
        arrayPages.forEach(data => {
            let totalViews = 0;
            arrayAllPage = data.map((d) => {
                const pagesByCountry: Pages = new Pages();
                pagesByCountry.pagesByCountry = new Array<Page>();
                totalViews += parseInt(d.views, 10);
                const page = new Page(d.country, d.blacklisted, d.name, d.views, d.responseSize);
                pagesByCountry.pagesByCountry.push(page);
                pagesByCountry.country = page.country;
                return pagesByCountry;
            });
            arrayAllPagesByCountry[arrayAllPage[0].country] = {};
            arrayAllPagesByCountry[arrayAllPage[0].country].pages = arrayAllPage;
            arrayAllPagesByCountry[arrayAllPage[0].country].totalViews = totalViews;
            totalViews = 0;
        });
        return arrayAllPagesByCountry;
    }

    private ungzipAndCompute = async (fileName: string, dateTimeFormat: DateTimeFormat) => {
        /**
         * Since Request is deprecated and no longer supported, I found a very good alternative which is Got.
         * */
        const wUrl = pageViewsUrl + dateTimeFormat.year + '/' + dateTimeFormat.year + '-' + dateTimeFormat.month + '/' + fileName + '.gz';

        const pipeline = promisify(stream.pipeline);
        // downloads the file requested, sends downlaod progress, ungzip and computes
        await pipeline(got.stream(wUrl).on('downloadProgress', progress => {
            // Emitting download progress
            statusEventEmitter.emit(EventTypes.downloadProgress, progress);
        }), fs.createWriteStream(FILES_DIFF + fileName + '.gz').on('finish', () => {
            // creates the results directory
            if (!fs.existsSync(FILES_DIFF + RESULTS + fileName))
                fs.mkdirSync(FILES_DIFF + RESULTS + fileName);
            // ungzip file downloaded
            const spawns = spawn('gzip', ['-d', FILES_DIFF + fileName + ".gz"]);
            spawns.on("error", (err) => {
                console.error(err);
            })
            spawns.on('close', () => {
                // Emitting the start of computing
                statusEventEmitter.emit(EventTypes.writingDone, 'All writes are now complete.');
                // Starts computing when the pageview file is ready
                if (fs.existsSync(FILES_DIFF + fileName))
                    compute(fileName, dateTimeFormat.user);
            })
        }));
    }

    /** Fetch saved pageviews for a given user */
    public getSavedPageViewsForUser = async (req, res) => {
        try {
            const userId = req.query.userId;

            let responseStatus: ResponseStatus<PageViews[] | MongoError> = null;
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                const collection = db.collection('pageviews');
                collection.find({_userId: userId},).toArray((err, docs) => {
                    if (docs && docs.length > 0) {
                        docs.forEach(d => {
                            if (fs.existsSync(FILES_DIFF + RESULTS + d._name)) {
                                const dirLen = fs.readdirSync(FILES_DIFF + RESULTS + d._name).length;
                                d._isAvailable = dirLen > 0;
                            } else {
                                d._isAvailable = false;
                            }
                        })
                        let fetchSuccessMessage = 'Successfully fetched pageviews for user id: ' + userId;
                        responseStatus = new ResponseStatus<PageViews[]>(ResponseCodes.SUCCESS, fetchSuccessMessage, docs);
                        db.close();
                        res.send(responseStatus);
                    } else {
                        let fetchSuccessMessage = 'No pageviews for user: ' + userId;
                        db.close();
                        responseStatus = new ResponseStatus<PageViews[] | MongoError>(ResponseCodes.SUCCESS_WITH_WARNING, fetchSuccessMessage, null);
                        res.send(responseStatus);
                        return null;
                    }
                });
            })
        } catch (e) {
            throw e;
        }
    }
    /** Fetches a given pageview */
    public getPageView = async (req, res) => {
        try {
            let responseStatus: ResponseStatus<PageViews | MongoError> = null;
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                const collection = db.collection('pageviews');
                collection.findOne({_id: ObjectId(req.query.pageviewId)}, (err, docs) => {
                    if (docs) {
                        if (fs.existsSync(FILES_DIFF + RESULTS + docs._name)) {
                            const arrayAllPagesByCountry = this.getArrayAllPagesByCountry(docs._name);
                            res.send({pageviews: arrayAllPagesByCountry});
                        } else {
                            let fetchSuccessMessage = 'No file exists : ' + req.query.pageviewId;
                            responseStatus = new ResponseStatus<PageViews>(ResponseCodes.SUCCESS, fetchSuccessMessage, null);
                            res.send(responseStatus);
                        }
                        db.close();
                    } else {
                        db.close();
                        let fetchSuccessMessage = 'No pageview for id: ' + req.query.pageviewId;
                        responseStatus = new ResponseStatus<PageViews | MongoError>(ResponseCodes.SUCCESS_WITH_WARNING, fetchSuccessMessage, null);
                        res.send(responseStatus);
                    }
                });
            })
        } catch (e) {
            throw e;
        }
    }

    /** function that formats the user query, download, ungzip and computes the said query.*/
    public getPageviews = async (req, res) => {
        // Parsing
        const date = req.body.dateTimeFormat;
        const dateTo = req.body.dateTimeFormatTo;
        const secondRequest = req.body.secondRequest;
        const user = new User().createUser(date.user);
        let dateTimeFormat: DateTimeFormat = new DateTimeFormat(date.year, date.month, date.day, date.hour, user);
        let dateTimeToFormat: DateTimeFormat = new DateTimeFormat(dateTo.year, dateTo.month, dateTo.day, dateTo.hour, user);
        const dateRange: DateRange = new DateRange(
            new Date(dateTimeFormat.year + '-' + dateTimeFormat.month + '-' + dateTimeFormat.day),
            new Date(dateTimeToFormat.year + '-' + dateTimeToFormat.month + '-' + dateTimeToFormat.day),
            dateTimeFormat.hour,
            dateTimeToFormat.hour, user);
        // Save DateTimeFormat request
        this.savePageViews(user, dateRange.dateArray).then(() => {}).catch(err => {
            console.error(err);
        })

        let i = 0;
        dateRange.dateArray.forEach(d => {
            const fileName = pageViewsPrefix + d.year + d.month + d.day + '-' + d.hour + '0000';
            if (fs.existsSync(FILES_DIFF + RESULTS + fileName)) {
                const dirLen = fs.readdirSync(FILES_DIFF + RESULTS + fileName).length;
                if (dirLen > 0)
                    i++;
            }
        })
        // Checks if the files requested exist in server and immediately sends the results to the user.
        if (i === dateRange.dateArray.length) {
            const fileName = pageViewsPrefix + dateRange.dateArray[0].year + dateRange.dateArray[0].month + dateRange.dateArray[0].day + '-' + dateRange.dateArray[0].hour + '0000';
            let arrayAllPagesByCountry = this.getArrayAllPagesByCountry(fileName);
            res.send({
                pageviews: arrayAllPagesByCountry,
                remarks: 'All page views requested were already queried. Please find them in your profile section.'
            })
        } else {
            // Condition that checks if any file among those requested already exists in server.
            for (const da of dateRange.dateArray) {
                const fileName = pageViewsPrefix + da.year + da.month + da.day + '-' + da.hour + '0000';
                // If the operation for the same date and time has already been done, sends it immediately.
                if (fs.existsSync(FILES_DIFF + RESULTS + fileName) && fs.readdirSync(FILES_DIFF + RESULTS + fileName).length > 0) {
                    let arrayAllPagesByCountry = this.getArrayAllPagesByCountry(fileName);
                    if (secondRequest === true) {
                        res.send({
                            pageviews: arrayAllPagesByCountry,
                            remarks: 'Data is being processed, please find your queries in your profile section.'
                        })
                    }
                } else {
                    // download the blacklist file if it does not exist yet
                    if (!fs.existsSync(FILES_DIFF + BLACKLIST_FILE)) {
                        const gotStreamForBlacklist = got.stream(blacklistUrl);
                        // Once blacklist file is dl, ungzip and compute
                        gotStreamForBlacklist.pipe(fs.createWriteStream(FILES_DIFF + BLACKLIST_FILE)).on('finish', async () => {
                            await this.ungzipAndCompute(fileName, dateTimeFormat);
                        });
                    } else {
                        // directly ungzip and compute
                        await this.ungzipAndCompute(fileName, dateTimeFormat);
                    }
                }
            }
        }
    }

    /**
     * Function that finds an object in an array
     * */
    private static findElem(obj, array) {
        let i = 0;

        while (i < array.length) {
            if (obj._name === array[i]._name) {
                return true;
            }
            i++;
        }
        return false;
    }

    /**
     * Save the dates requested by the user in DB by userId
     *
     * Check in DB that file hasn't been requested before.
     * Deletes files already requested and inserts new ones.
     *
     * @param user user the requested the pageview file(s).
     * @param dateTimeFormats array of @class DateTimeFormat containing the date requested by the user.
     * */
    public savePageViews = async (user: User, dateTimeFormats: DateTimeFormat[]) => {
        try {
            const pageViews = mongoose.model('Pageviews', pageViewsSchema);
            const arrayPageViews: PageViews[] = new Array<PageViews>();
            dateTimeFormats.forEach(da => {
                const newPageViews = new PageViews();
                newPageViews.name = pageViewsPrefix + da.year + da.month + da.day + '-' + da.hour + '0000';
                newPageViews.userId = user.id;
                newPageViews.dateRegistered = new Date().toISOString();
                newPageViews.dateModified = new Date().toISOString();
                arrayPageViews.push(newPageViews);
            })
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                const collection = db.collection('pageviews');
                collection.find({_userId: user.id},).toArray((err, docs) => {
                    if (docs && docs.length > 0) {
                        let i = 0;
                        let newArr = [];
                        while (i < arrayPageViews.length) {
                            if (!PageviewsController.findElem(arrayPageViews[i], docs)) {
                                newArr.push(arrayPageViews[i]);
                            }
                            i++;
                        }
                        if (newArr.length > 0) {
                            return pageViews.insertMany(newArr).then(docs => {
                                db.close();
                                return docs;
                            })
                                .then(() => {
                                    mongoose.connection.close();
                                })
                                .catch(err => {
                                    throw err;
                                })
                        } else {
                            db.close();
                            return null;
                        }
                    } else {
                        return pageViews.insertMany(arrayPageViews).then(docs => {
                            db.close();
                            return docs;
                        })
                            .then(() => {
                                mongoose.connection.close();
                            })
                            .catch(err => {
                                throw err;
                            })
                    }
                });
            })
        } catch (e) {
            throw e;
        }
    }
}
