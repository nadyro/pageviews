import * as socketIo from 'socket.io';
import {Socket} from "socket.io";
import EventEmitter = require("events");
import {EventTypes} from "./EventTypes/EventTypes";
import {Server} from "http";
import {User} from "./Classes/User";
import * as serverUtils from './server/utils/sockets/UpdateUserWithSockets';
import {statusEventEmitter} from "./server/controllers/Pageviews.controller";
import fs = require("fs");
import * as filePaths from './constants/filesConstants';
import * as urls from './constants/urlConstants';

export const sockets = (server: Server, eventEmitter: EventEmitter) => {
    const io = new socketIo.Server();
    io.listen(server, {
        cors: {
            origin: urls.clientUrl,
            methods: ["GET", "POST"]
        },
        transports: ['websocket']
    });
    io.on('connection', (socket: Socket) => {
        console.log(socket.id);

        /**
         * Once the user is logged in, updates its socketId in DB with the current client session and emits the new
         * user object. It allows the the client and the server to always have a record of the users connected and their
         * sockets existing in the server.
         * */
        socket.on(EventTypes.login, (u) => {
            if (u !== null) {
                u._socketId = socket.id;
                const newUser = new User().createUser(u);
                serverUtils.updateUser(newUser).then(rs => {
                    socket.emit(EventTypes.socketIdUpdated, rs.object);
                })
            }
        });
        /**
         * Same logic as for login but for the case where the client gets disconnected.
         * In this project, the client often gets disconnect because of ping timeout due to server being overloaded
         * by the sorting operations. */
        io.to(socket.id).emit(EventTypes.reconnectionSocket, socket.id);

        /**
         * Event triggered once the ungzipping of the downloaded file is done. It allows to update the user on
         * the progress of its request.
         * */
        statusEventEmitter.on(EventTypes.writingDone, w => {
            socket.emit(EventTypes.writingDone, w);
        });

        /** Event triggered each time the download of the file requested by user is progressing. */
        statusEventEmitter.on(EventTypes.downloadProgress, p => {
            socket.emit(EventTypes.downloadProgress, p);
        })

        /** Event emitted when the user refreshes its client or on first connection. Allows the same logic as login.*/
        socket.on(EventTypes.updateSocketId, u => {
            if (u !== null) {
                u._socketId = socket.id;
                const newUser = new User().createUser(u);
                serverUtils.updateUser(newUser).then(rs => {
                    socket.emit(EventTypes.socketIdUpdated, rs.object);
                });
            }
        })

        /**
         * Event triggered when the computing is done.
         * This is still in progress in the case of the date range.
         *
         * Basically, when a user requests a file, there are some operations before computing, then the computing start,
         * and each time a file is computed, it is sent to the user with a socket.io event emitter.
         *
         * There is often the 'en' sub-domain that requires a lot of computing and it's often while
         * processing it that the server overloads and the client's socket connection times out.
         * Therefore it is not sent to the user.
         *
         * I worked it around by triggering a new HTTP request from the client after the end of computing which, instead
         * of triggering a whole new computing process, fetches the content of the JSON result directory which was
         * previously completed.
         *
         * This work around works perfectly with the case of one pageview file request, but is still fragile with
         * several files.
         * This is due to the HTTP Headers, since the client sends a request with a date range, the server computes each
         * date as one single request, and therefore sends a response to the original request.
         * Which ultimately leads to the 'cannot send headers after they are sent to the client' HTTP error after the
         * first date result is sent and the second one is preparing to be sent.
         *
         * */
        eventEmitter.on(EventTypes.endOfWrite, objEmitted => {

                serverUtils.getUser(objEmitted.user._id).then(() => {
                    if (objEmitted.param === undefined) {
                        io.to(socket.id).emit(EventTypes.endOfWrite, 'endOfWrite');
                    } else {
                        io.to(socket.id).emit(EventTypes.endOfDownload, 'endOfDownload');
                    }
                });

            // Upon end of write, delete all unnecessary files from the server.
            fs.readdir(filePaths.FILES_DIFF + filePaths.LISTED_COUNTRIES, (err, files) => {
                files.forEach(file => {
                    if (fs.existsSync(filePaths.FILES_DIFF + filePaths.LISTED_COUNTRIES + file))
                    fs.unlinkSync(filePaths.FILES_DIFF + filePaths.LISTED_COUNTRIES + file)
                })
            })
            fs.readdir(filePaths.FILES_DIFF + filePaths.BLACKLISTED_COUNTRIES, (err, files) => {
                files.forEach(file => {
                    if (fs.existsSync(filePaths.FILES_DIFF + filePaths.BLACKLISTED_COUNTRIES + file))
                    fs.unlinkSync(filePaths.FILES_DIFF + filePaths.BLACKLISTED_COUNTRIES + file)
                })
            })
            if (fs.existsSync(filePaths.FILES_DIFF + objEmitted.pageviewsFilename)) {
                fs.unlinkSync(filePaths.FILES_DIFF + objEmitted.pageviewsFilename)
            }
        })

        /** Event triggered each time a sub-domain file has been treated.*/
        eventEmitter.on(EventTypes.fileData, (d) => {
            socket.emit(EventTypes.fileData, d);
        })
    })
}
