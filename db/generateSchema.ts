import {Schema} from 'mongoose';


/** Function that generates a mongoose Schema of the given class
 * @param objectClass: T
 * @return Schema
 * */
export function generateSchema<T>(objectClass: T): Schema {
    const objToSchema = {};
    // @ts-ignore
    const newObject = new objectClass();
    const objKeys = Object.getOwnPropertyNames(newObject);
    objKeys.forEach(keys => {
        if (keys !== '_id') {
            const ob = {
                [keys]: typeof newObject[keys]
            };
            objToSchema[keys] = ob[keys];
        }
    });
    return new Schema(objToSchema);
}
