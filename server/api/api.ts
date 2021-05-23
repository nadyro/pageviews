import apiPageviews from "./routes/pageviews/pageviews.route";
import {RouterList} from "../../Classes/RouterList";
import apiUsers from "./routes/users/users.route";
import {pageViewApiUrl, usersApiUrl} from "../../constants/urlConstants";

const serverRouters: RouterList[] = new Array<RouterList>();
const pageviewsRouter: RouterList = new RouterList(pageViewApiUrl, apiPageviews);
const usersRouterList: RouterList = new RouterList(usersApiUrl, apiUsers);

serverRouters.push(pageviewsRouter);
serverRouters.push(usersRouterList);

export default serverRouters;
