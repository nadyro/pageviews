import apiPageviews from "./routes/pageviews/pageviews.route";
import {RouterList} from "../../Classes/RouterList";

const serverRouters: RouterList[] = new Array<RouterList>();
const pageviewsRouter: RouterList = new RouterList('/pageviews', apiPageviews);
serverRouters.push(pageviewsRouter);

export default serverRouters;
