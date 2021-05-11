import * as mongoose from 'mongoose';

export function dbConnect(database: string): mongoose.Connection {
    mongoose.connect('mongodb://localhost/' + database, {useNewUrlParser: true, useUnifiedTopology: true});
    return mongoose.connection;
}