import bcrypt = require("bcrypt");
import {ROUNDS} from "../properties/encryptions.properties";

/** Encrypts password for user
 * @param password entered by user
 * @return Promise<string>
 * */
export const encryptString = async (password: string): Promise<string> => {
    try {
        return new Promise<string>((resolve, reject) => {
            bcrypt.hash(password, ROUNDS, (err, hashedPassword) => {
                if (err) {
                    reject(err.message);
                }
                resolve(hashedPassword);
            });
        })
    } catch (e) {
        console.error(e);
    }
}

/** Decrypts a password
 * @param hash encrypted password
 * @param password entered by user
 * @return Promise<boolean>
 * */
export const decryptString = async (hash: string, password: string): Promise<boolean> => {
    try {
        return new Promise<boolean>((resolve, reject) => {
            bcrypt.compare(password, hash).then(result => {
                if (result === true) {
                    resolve(result);
                }
                reject(result);
            }).catch(e => {
                console.error(e);
            })
        });
    } catch (e) {
        console.error(e);
    }
}
