import express = require("express");

export class RouterList {
    id: string;
    apiName: string;
    routerApi: express.Router;

    constructor(apiName: string, routerApi: express.Router) {
        this.apiName = apiName;
        this.routerApi = routerApi;
    }
}
