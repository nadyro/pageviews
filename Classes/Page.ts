export class Page {
    country: string;
    blacklisted: boolean;
    name: string;
    views: string;
    responseSize: string;
    index: string;


    constructor(country: string, blacklisted: boolean, name: string, views: string, responseSize: string) {
        this.country = country;
        this.blacklisted = blacklisted;
        this.name = name;
        this.views = views;
        this.responseSize = responseSize;
    }
}
