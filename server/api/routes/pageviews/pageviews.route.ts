import express = require("express");
import * as pageviewsHandlers from "../../handlers/pageviews/pageviews.handler";

const apiPageviews = express.Router();

apiPageviews.post('/test', pageviewsHandlers.getPageviews);

export default apiPageviews;
