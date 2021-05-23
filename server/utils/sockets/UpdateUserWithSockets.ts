import {ResponseStatus} from "../../../Classes/ResponseStatus";
import {User} from "../../../Classes/User";
import {MongoError} from "mongodb";
import {dbConnect} from "../../../db/db.tools";
import {DB_NAME_PAGEVIEWS} from "../../../properties/db/db.properties";
import {ResponseCodes} from "../../../Classes/ResponseCodes";

const ObjectId = require('mongodb').ObjectID;

export const getUser = async (userId: string): Promise<any> => {
    try {
        let responseStatus: ResponseStatus<User | MongoError> = null;
        const db = await dbConnect(DB_NAME_PAGEVIEWS)
            .on('error', (err) => {
                console.error(err);
            });
        try {
            const collection = db.collection('users');
            return await collection.findOne({_id: ObjectId(userId)}).then(doc => {
                if (doc && doc.constructor === Object && Object.keys(doc).length > 0) {
                    const fetchSuccessMessage = "[UsersController] => Fetched user with (id=" + doc._id + ").";
                    responseStatus =
                        new ResponseStatus<User>(ResponseCodes.SUCCESS, fetchSuccessMessage, doc);
                }
                return responseStatus;
            }).then(fdp => {
                return fdp;
            }).catch(reason => {
                console.error('reason : ', reason);
            }).finally(() => {
                db.close();
            })
        } catch (e) {
            console.error(e);
        }
    } catch (e) {
        console.error(e);
    }
}

export const updateUser = async (user: User): Promise<ResponseStatus<User | any>> => {
    try {
        let responseStatus: ResponseStatus<User | MongoError> = null;
        const db = dbConnect(DB_NAME_PAGEVIEWS)
            .on('error', (err) => {
                console.error(err);
            });
        db.once('open', () => {
            const newUser = {
                _firstName: user.firstName,
                _lastName: user.lastName,
                _email: user.email,
                _isAdmin: user.isAdmin,
                _online: user.online,
                _socketId: user.socketId,
                _userName: user.userName
            }
            const collection = db.collection("users");
            collection.findOneAndUpdate(
                {_id: ObjectId(user.id)},
                {$set: newUser}, {returnOriginal: false}, (err: any, doc: any) => {
                    if (err) {
                        const mongoError: MongoError = new MongoError(err.message);
                        const errorMessage = '[UsersController] => ' + err.message;
                        responseStatus = new ResponseStatus<MongoError>(err.code, errorMessage, mongoError);
                        db.close();
                        return responseStatus;
                    } else if (doc && doc.lastErrorObject.n === 0) {
                        const updateSuccessWithWarningMessage = "[UsersController] => No user with (id=" + user.id + ") exists.";
                        responseStatus =
                            new ResponseStatus<any>(
                                ResponseCodes.SUCCESS_WITH_WARNING, updateSuccessWithWarningMessage, doc
                            );
                        db.close();
                        return responseStatus;
                    } else {
                        const updateSuccessMessage = "Updated user " + user.userName + ").";
                        responseStatus =
                            new ResponseStatus<User>(ResponseCodes.SUCCESS, updateSuccessMessage, doc);
                        db.close();
                        return responseStatus;
                    }
                });
        });
        responseStatus = new ResponseStatus<User>(ResponseCodes.SUCCESS, 'Internal Success', user);
        return responseStatus;
    } catch (e) {
        console.error(e);
    }
}
