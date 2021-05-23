import * as mongoose from 'mongoose';
import {mongoUri} from "../constants/urlConstants";

export function dbConnect(database: string): mongoose.Connection {
    mongoose.connect(mongoUri + database, {useNewUrlParser: true, useUnifiedTopology: true});
    return mongoose.connection;
}
