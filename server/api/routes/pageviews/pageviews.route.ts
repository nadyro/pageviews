import express = require("express");
import * as pageviewsHandlers from "../../handlers/pageviews/pageviews.handler";

const apiPageviews = express.Router();

apiPageviews.post('/test', pageviewsHandlers.getPageviews);
apiPageviews.post('/results', pageviewsHandlers.getPageResults);

export default apiPageviews;
