import express = require("express");
import * as pageviewsHandlers from "../../handlers/pageviews/pageviews.handler";
import {pageview, pageViewComputeUrl, pageviews} from "../../../../constants/urlConstants";

const apiPageviews = express.Router();

apiPageviews.post(pageViewComputeUrl, pageviewsHandlers.getPageviews);
apiPageviews.get(pageviews, pageviewsHandlers.getSavedPageViewsForUser)
apiPageviews.get(pageview, pageviewsHandlers.getPageView)


export default apiPageviews;
