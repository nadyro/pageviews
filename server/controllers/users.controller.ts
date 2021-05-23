import express = require("express");
import {User} from "../../Classes/User";
import {generateSchema} from "../../db/generateSchema";
import {dbConnect} from "../../db/db.tools";
import {ResponseStatus} from "../../Classes/ResponseStatus";
import {ResponseCodes} from "../../Classes/ResponseCodes";
import mongoose = require("mongoose");
import {DB_NAME_PAGEVIEWS} from "../../properties/db/db.properties";
import {MongoError} from "mongodb";
import {encryptString, decryptString} from "../../db/cryptographyUtils";
import {RedisStore} from "connect-redis";

const ObjectId = require('mongodb').ObjectID;
const userSchema = generateSchema(User);
export class UsersController {
    private readonly _user: User;
    private _isInternalCall = 0;
    private _request: express.Request;
    private _response: express.Response;

    constructor(req: express.Request, res: express.Response) {
        try {
            if (req && req.body && Object.keys(req.body).length > 0 && req.body.constructor === Object) {
                const user = new User();
                if (req.body._id) {
                    if (!mongoose.Types.ObjectId.isValid(req.body._id)) {
                        console.error("[UsersController] => User ID is not valid. UsersController construction failed.");
                    } else {
                        user.id = req.body._id;
                    }
                }
                user.firstName = req.body._firstName;
                user.lastName = req.body._lastName;
                user.password = req.body._password;
                user.email = req.body._email;
                user.isAdmin = req.body._isAdmin;
                user.online = req.body._online;
                user.socketId = req.body._socketId;
                user.userName = req.body._userName;
                this._user = user;
                this._request = req;
                this._response = res;
            } else {
                console.error("[UsersController] => Body is null. UsersController construction failed.")
            }
        } catch (e) {
            const responseStatus = new ResponseStatus<null>(ResponseCodes.FAILURE, e.toString(), null);
            res.send(responseStatus);
            console.error(e);
        }
    }

    public updateUser = async (): Promise<ResponseStatus<User | any>> => {
        try {
            let responseStatus: ResponseStatus<User | MongoError> = null;
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                const newUser = {
                    _firstName: this._user.firstName,
                    _lastName: this._user.lastName,
                    _email: this._user.email,
                    _isAdmin: this._user.isAdmin,
                    _online: this._user.online,
                    _socketId: this._user.socketId,
                    _userName: this._user.userName
                }
                const collection = db.collection("users");
                collection.findOneAndUpdate(
                    {_id: ObjectId(this._user.id)},
                    {$set: newUser}, {returnOriginal: false}, (err: any, doc: any) => {
                        if (err) {
                            const mongoError: MongoError = new MongoError(err.message);
                            const errorMessage = '[UsersController] => ' + err.message;
                            responseStatus = new ResponseStatus<MongoError>(err.code, errorMessage, mongoError);
                            db.close();
                            this._response.send(responseStatus);
                            throw err;
                        } else if (doc && doc.lastErrorObject.n === 0) {
                            const updateSuccessWithWarningMessage = "[UsersController] => No user with (id=" + this._user.id + ") exists.";
                            responseStatus =
                                new ResponseStatus<any>(
                                    ResponseCodes.SUCCESS_WITH_WARNING, updateSuccessWithWarningMessage, doc
                                );
                            db.close();
                            return this._response.send(responseStatus);
                        } else {
                            const updateSuccessMessage = "Updated user " + this._user.userName + ").";
                            responseStatus =
                                new ResponseStatus<User>(ResponseCodes.SUCCESS, updateSuccessMessage, doc);
                            db.close();
                            if (!this._isInternalCall)
                                return this._response.send(responseStatus);
                        }
                    });
            });
            responseStatus = new ResponseStatus<User>(ResponseCodes.SUCCESS, 'Internal Success', this._user);
            return responseStatus;
        } catch (e) {
            console.error(e);
        }
    }

    public deleteUser = async (): Promise<ResponseStatus<User>> => {
        try {
            let responseStatus: ResponseStatus<MongoError | any> = null;
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                const collection = db.collection("users");
                collection.deleteOne({_id: ObjectId(this._user.id)}, (err, result) => {
                    if (err) {
                        const mongoError: MongoError = new MongoError(err.message);
                        const errorMessage = '[UsersController] => ' + err.message;
                        // @ts-ignore
                        responseStatus = new ResponseStatus<MongoError>(err.code, errorMessage, mongoError);
                        db.close();
                        this._response.send(responseStatus);
                        throw err;
                    } else if (result && result.deletedCount === 0) {
                        const deletionSuccessWithWarningMessage = "[UsersController] => No user with (id=" + this._user.id + ") exists.";
                        const resultSuccess: any = {
                            result: result.result,
                            connection: result.connection,
                            deleteCount: result.deletedCount
                        }
                        responseStatus =
                            new ResponseStatus<any>(
                                ResponseCodes.SUCCESS_WITH_WARNING, deletionSuccessWithWarningMessage, resultSuccess
                            );
                        db.close();
                        return this._response.send(responseStatus);
                    } else {
                        const deletionSuccessMessage = "[UsersController] => Deleted user with (id=" + this._user.id + ").";
                        const resultSuccess: any = {
                            result: result.result,
                            connection: result.connection,
                            deleteCount: result.deletedCount
                        }
                        responseStatus =
                            new ResponseStatus<any>(ResponseCodes.SUCCESS, deletionSuccessMessage, resultSuccess);
                        db.close();
                        if (!this._isInternalCall)
                            return this._response.send(responseStatus);
                        else
                            return responseStatus;
                    }
                });
            });
            return null;
        } catch (e) {
            throw e;
        }
    }


    public getUser = async (): Promise<ResponseStatus<User>> => {
        try {
            let responseStatus: ResponseStatus<User | MongoError> = null;
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                try {
                    const collection = db.collection('users');
                    collection.findOne({_id: ObjectId(this._user.id)}, (err: MongoError, doc: any) => {
                        if (err) {
                            const mongoError: MongoError = new MongoError(err.message);
                            const errorMessage = '[UsersController] => ' + err.message;
                            // @ts-ignore
                            responseStatus = new ResponseStatus<MongoError>(err.code, errorMessage, mongoError);
                            db.close();
                            this._response.send(responseStatus);
                            throw err;
                        } else if (doc && doc.constructor === Object && Object.keys(doc).length > 0) {
                            const fetchSuccessMessage = "[UsersController] => Fetched user with (id=" + this._user.id + ").";
                            responseStatus =
                                new ResponseStatus<User>(ResponseCodes.SUCCESS, fetchSuccessMessage, doc);
                            db.close();
                            if (!this._isInternalCall)
                                return this._response.send(responseStatus);
                            else
                                return responseStatus;
                        } else {
                            const fetchSuccessMessageWithWarning = "[UsersController] => No user exists with (id=" + this._user.id + ").";
                            responseStatus =
                                new ResponseStatus<User>(ResponseCodes.SUCCESS, fetchSuccessMessageWithWarning, doc);
                            db.close();
                            return this._response.send(responseStatus);
                        }
                    })
                } catch (e) {
                    throw e;
                }
            });
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    public getUsers = async (): Promise<ResponseStatus<User>> => {
        try {
            let responseStatus: ResponseStatus<User[] | MongoError> = null;
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                try {
                    const collection = db.collection('users');
                    collection.find({},).toArray((err: MongoError, doc: any) => {
                        if (err) {
                            const mongoError: MongoError = new MongoError(err.message);
                            const errorMessage = '[UsersController] => ' + err.message;
                            // @ts-ignore
                            responseStatus = new ResponseStatus<MongoError>(err.code, errorMessage, mongoError);
                            db.close();
                            this._response.send(responseStatus);
                            throw err;
                        } else {
                            const fetchSuccessMessage = "[UsersController] => Successfully Fetched users.";
                            responseStatus =
                                new ResponseStatus<User[]>(ResponseCodes.SUCCESS, fetchSuccessMessage, doc);
                            db.close();
                            if (!this._isInternalCall)
                                return this._response.send(responseStatus);
                            else
                                return responseStatus;
                        }
                    })
                } catch (e) {
                    throw e;
                }
            });
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    public saveUser = async (): Promise<ResponseStatus<User>> => {
        try {
            let responseStatus: ResponseStatus<User> = null;
            await encryptString(this._user.password)
                .then(newHashedPassword => {
                    this._user.password = newHashedPassword;
                }).catch(e => {
                    console.error('[UsersController] => Couldn\'t hash password. User registration aborted.')
                    console.error(e);
                });
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                try {
                    const userExist = this.checkUserExists(db.collection('users'));
                    userExist.then(() => {
                        responseStatus = new ResponseStatus<User>(
                            ResponseCodes.SUCCESS_WITH_WARNING,
                            'User already exists in our database.',
                            null);
                        this._response.send(responseStatus);
                        mongoose.connection.close();
                        return null;
                    }).catch(() => {
                        const User = mongoose.model('User', userSchema)
                        const newUser = new User(this._user);
                        return newUser.save()
                            .then((docs: any) => {
                                const savedUser: User = docs;
                                responseStatus = new ResponseStatus<User>(
                                    ResponseCodes.SUCCESS,
                                    'Successfully saved user ' + savedUser.userName + ')',
                                    savedUser);
                                if (!this._isInternalCall)
                                    return this._response.send(responseStatus);
                                else
                                    return responseStatus;
                            })
                            .then(() => {
                                mongoose.connection.close();
                            })
                            .catch(e => {
                                throw Error(e);
                            });
                    })
                } catch (e) {
                    throw e;
                }
            });
            return null;
        } catch (e) {
            throw e;
        }
    }

    public checkUserExists(collection: mongoose.CollectionBase): Promise<any> {
        try {
            return new Promise<any>((resolve, reject) => {
                collection.findOne({_email: this._user.email}, (err: MongoError, doc: any) => {
                    if (doc && Object.keys(doc).length > 0 && doc.constructor === Object) {
                        resolve(doc);
                    } else {
                        reject(null);
                    }
                });
            })
        } catch (e) {
            throw Error(e);
        }
    }

    public logout = async () => {
        try {
            let responseStatus: ResponseStatus<User> = null;
            // @ts-ignore
            const user = this._request.session.user;
            if (user) {
                this._user.id = user._id;
                this._user.firstName = user._firstName;
                this._user.lastName = user._lastName;
                this._user.password = user._password;
                this._user.email = user._email;
                this._user.isAdmin = user._isAdmin;
                this._user.online = 0;
                this._user.socketId = user._socketId;
                this._user.userName = user._userName;
                this._isInternalCall = 1;
                this.updateUser().then(rlt => {

                    // @ts-ignore
                    const sessionStore: RedisStore = this._request.sessionStore;
                    const sessionID = this._request.sessionID;
                    sessionStore.destroy(sessionID);
                    responseStatus = new ResponseStatus<User>(
                        ResponseCodes.SUCCESS,
                        'Logout of (id=' + user._userName + ') authorized.',
                        rlt.object
                    );
                    this._response.send(responseStatus);
                });
            } else {
                responseStatus = new ResponseStatus<User>(
                    ResponseCodes.SUCCESS,
                    'User already logged out',
                    null
                );
                this._response.send(responseStatus);
            }
        } catch (e) {

        }
    }
    public login = async () => {
        try {
            let responseStatus: ResponseStatus<User> = null;
            const db = dbConnect(DB_NAME_PAGEVIEWS)
                .on('error', (err) => {
                    console.error(err);
                });
            db.once('open', () => {
                try {
                    const userExist = this.checkUserExists(db.collection('users'));
                    userExist.then(res => {
                        decryptString(res._password, this._user.password).then(isCorrectPassword => {
                            if (isCorrectPassword === true) {
                                this._user.id = res._id;
                                this._user.firstName = res._firstName;
                                this._user.lastName = res._lastName;
                                this._user.password = res._password;
                                this._user.email = res._email;
                                this._user.isAdmin = res._isAdmin;
                                this._user.online = 1;
                                this._user.socketId = res._socketId;
                                this._user.userName = res._userName;
                                this._isInternalCall = 1;
                                db.close();
                                this.updateUser().then(rlt => {
                                    // @ts-ignore
                                    const sessionStore: RedisStore = this._request.sessionStore;
                                    const sessionID = this._request.sessionID;
                                    // @ts-ignore
                                    this._request.session.user = rlt.object;
                                    sessionStore.set(sessionID, this._request.session);
                                    responseStatus = new ResponseStatus<User>(
                                        ResponseCodes.SUCCESS,
                                        '[UsersController] => Login of (id=' + res._id + ') authorized.',
                                        rlt.object
                                    );
                                    this._response.send(responseStatus);
                                })
                            }
                        })
                            .catch(e => {
                                db.close();
                                if (e === false) {
                                    responseStatus = new ResponseStatus<User>(
                                        ResponseCodes.SUCCESS_WITH_WARNING,
                                        'Incorrect password',
                                        null
                                    );
                                    this._response.send(responseStatus);
                                } else {
                                    console.error(e);
                                    this._response.send('Something went bad');
                                }
                            })
                    })
                        .catch(() => {
                            responseStatus = new ResponseStatus<User>(
                                ResponseCodes.SUCCESS_WITH_WARNING,
                                'No user found with this email',
                                null);
                            db.close();
                            this._response.send(responseStatus);
                        });
                } catch (e) {
                    console.error(e);
                }
            });
            return null;
        } catch (e) {
            console.error(e);
        }
    }

}
