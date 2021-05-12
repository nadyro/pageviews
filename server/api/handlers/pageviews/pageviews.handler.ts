import express = require("express");
import {PageviewsController} from "../../../controllers/Pageviews.controller";

export const getPageviews = async (req: express.Request, res: express.Response) => {
    try {
        const pageviewsController = new PageviewsController();
        console.log(req.body);
        pageviewsController.getPageviews(req, res);
    } catch (e) {
        console.error(e);
    }
}
