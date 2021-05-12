import {DateTimeFormat} from "../../Classes/DateTimeFormat";
import got from "got"
import {gzip, ungzip} from "node-gzip"
import fs = require("fs");
import {compute} from "../../server";
import {dbConnect} from "../../db/db.tools";
import mongoose = require("mongoose");
import {GridFSBucket} from "mongodb";
const { spawn } = require("child_process");




// unzip the buffered gzipped sitemap
export class PageviewsController {
    public getPageviews = async (req, res) => {
        const date = req.body;
        let dateTimeFormat: DateTimeFormat = new DateTimeFormat(date.year, date.month, date.day, date.hour);
        const wUrl = 'https://dumps.wikimedia.org/other/pageviews/' + dateTimeFormat.year + '/' + dateTimeFormat.year + '-' + dateTimeFormat.month + '/' + 'pageviews-' + dateTimeFormat.year + dateTimeFormat.month + dateTimeFormat.day + '-' + dateTimeFormat.hour + '0000.gz';
        const fileName = 'pageviews-' + dateTimeFormat.year + dateTimeFormat.month + dateTimeFormat.day + '-' + dateTimeFormat.hour + '0000';
        console.log( process.env.PATH );
        // spawn('ls', ['--help']);
        const curl = spawn('curl ' + wUrl + ' --output ' + fileName + '.gz');
        curl.on('error', (error) => {
            console.log(`error: ${error.message}`);
        });
        // console.log(wUrl);
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
        // compute(fileName, pageviews);
        console.log(dateTimeFormat)
        console.log('reached pageview controller');
        res.send({
            obj: {bb: 'lol'}
        })
    }
}
