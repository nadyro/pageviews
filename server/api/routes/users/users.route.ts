import express = require("express");
import * as usersHandler from "../../handlers/users/users.handlers";
import {
    userDeleteUrl, userGetAllUrl, userGetUrl,
    userLoginUrl,
    userLogoutUrl,
    userSaveUrl,
    userUpdateUrl
} from "../../../../constants/urlConstants";

const apiUsers = express.Router();

apiUsers.post(userSaveUrl, usersHandler.saveUser);
apiUsers.post(userLoginUrl, usersHandler.login);
apiUsers.post(userLogoutUrl, usersHandler.logout);
apiUsers.delete(userDeleteUrl, usersHandler.deleteUser);
apiUsers.put(userUpdateUrl, usersHandler.updateUser);
apiUsers.get(userGetUrl, usersHandler.getUser);
apiUsers.get(userGetAllUrl, usersHandler.getUsers);


export default apiUsers;

