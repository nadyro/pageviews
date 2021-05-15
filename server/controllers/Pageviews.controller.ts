import {DateTimeFormat} from "../../Classes/DateTimeFormat";
import got from "got"
import fs = require("fs");
import {compute} from "../../server";
import {spawn} from "child_process";
import {Pages} from "../../Classes/Pages";
import {Page} from "../../Classes/Page";

// unzip the buffered gzipped sitemap
export class PageviewsController {

    public getPageResults = async (req, res) => {
        res.send({
            obj: {bb: 'mdr'}
        })
    }

    public getPageviews = async (req, res) => {
        // compute('');
        const date = req.body;
        let dateTimeFormat: DateTimeFormat = new DateTimeFormat(date.year, date.month, date.day, date.hour);
        const wUrl = 'https://dumps.wikimedia.org/other/pageviews/' + dateTimeFormat.year + '/' + dateTimeFormat.year + '-' + dateTimeFormat.month + '/' + 'pageviews-' + dateTimeFormat.year + dateTimeFormat.month + dateTimeFormat.day + '-' + dateTimeFormat.hour + '0000.gz';
        const fileName = 'pageviews-' + dateTimeFormat.year + dateTimeFormat.month + dateTimeFormat.day + '-' + dateTimeFormat.hour + '0000';
        // console.log(wUrl);
        if (fs.existsSync('./files_diff/countries/results/' + fileName)) {
            const files = fs.readdirSync('./files_diff/countries/results/' + fileName);
            const arrayPages = [];
            files.forEach(file => {
                const pages = fs.readFileSync('./files_diff/countries/results/' + fileName + '/' + file).filter(Boolean);
                let lines = pages.toString();
                if (pages.length <= 0)
                    console.log('FDP')
                if (lines.length > 0 || true) {
                    let parsedLines = JSON.parse(lines);
                    arrayPages.push(parsedLines);
                }
            });
            let arrayAllPage = [];
            let arrayAllPagesByCountry = {};
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
            console.log(arrayAllPagesByCountry);
            res.send({
                pageviews: arrayAllPagesByCountry
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
                    res.send(null);
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
