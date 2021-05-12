import {DateTimeFormat} from "../../Classes/DateTimeFormat";
import got from "got"
import {gzip, ungzip} from "node-gzip"
import fs = require("fs");
import {compute} from "../../server";
import {dbConnect} from "../../db/db.tools";
import mongoose = require("mongoose");
import {GridFSBucket} from "mongodb";
import * as decompressResponse from "decompress-response";
import {spawn} from "child_process";



// unzip the buffered gzipped sitemap
export class PageviewsController {
    public getPageviews = async (req, res) => {
        // compute('');

        const date = req.body;
        let dateTimeFormat: DateTimeFormat = new DateTimeFormat(date.year, date.month, date.day, date.hour);
        const wUrl = 'https://dumps.wikimedia.org/other/pageviews/' + dateTimeFormat.year + '/' + dateTimeFormat.year + '-' + dateTimeFormat.month + '/' + 'pageviews-' + dateTimeFormat.year + dateTimeFormat.month + dateTimeFormat.day + '-' + dateTimeFormat.hour + '0000.gz';
        const fileName = 'pageviews-' + dateTimeFormat.year + dateTimeFormat.month + dateTimeFormat.day + '-' + dateTimeFormat.hour + '0000';
        // console.log(wUrl);
        if (fs.existsSync('./files_diff/countries/results/' + fileName)) {
            res.send({
                obj: {bb: 'lol'}
            })
        } else {
            fs.mkdirSync('./files_diff/countries/results/' + fileName);

            got.stream(wUrl).pipe(fs.createWriteStream('./files_diff/' + fileName + '.gz')).on('finish', () => {
                console.log('All writes are now complete.');

                const spawns = spawn('gzip', ['-d', "./files_diff/" + fileName + ".gz"]);

                spawns.stdout.on('end', () => {
                    compute(fileName);
                    console.log('fin');
                })
                spawns.stdout.on('data', (d) => {
                    console.log(`stdout: ${d}`);
                })
                spawns.on("error", (err) => {
                    console.log(err);
                })
                spawns.on('close', () => {
                    console.log('end');
                    res.send({
                        obj: {bb: 'lol'}
                    })
                })
                // res.send({
                //     obj: {bb: 'lol'}
                // })
            });
        }
        // const { body } = await got(wUrl, {
        //     responseType: 'buffer',
        // });
        // let pageviews = (await ungzip(body)).toString().split('\n');
        // fs.writeFileSync('./files_diff/' + fileName, pageviews);
        // const db = dbConnect('pageviews');
        // let gfs;
        // db.once('open', () => {
        //     console.log('opened');
        //     gfs = new mongoose.mongo.GridFSBucket(db.db, {
        //         bucketName: 'pageviews'
        //     });
        //     fs.createReadStream('./files_diff/' + fileName).pipe(gfs.openUploadStream(fileName)).on('error', (err) => {
        //         console.log(err);
        //     })
        // })
        // console.log(dateTimeFormat)
        // console.log('reached pageview controller');
    }
}
