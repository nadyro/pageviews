import express = require("express");
import {PageviewsController} from "../../../controllers/Pageviews.controller";

export const getPageviews = async (req: express.Request, res: express.Response) => {
    try {
        const pageviewsController = new PageviewsController();
        pageviewsController.getPageviews(req, res);
    } catch (e) {
        console.error(e);
    }
}

export const getSavedPageViewsForUser = async (req: express.Request, res: express.Response) => {
    try {
        const pageviewsController = new PageviewsController();
        pageviewsController.getSavedPageViewsForUser(req, res);
    } catch (e) {
        console.error(e);
    }
}

export const getPageView = async (req: express.Request, res: express.Response) => {
    try {
        const pageviewsController = new PageviewsController();
        pageviewsController.getPageView(req, res);
    } catch (e) {
        console.error(e);
    }
}
