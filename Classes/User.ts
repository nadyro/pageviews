export class User {
    _id: string;
    private _firstName: string;
    private _lastName: string;
    private _email: string;
    private _password: string;
    private _userName: string;
    private _isAdmin: number;
    private _online: number;
    private _socketId: string;
    private _dateSubscribed: Date;

    constructor() {
        this._id = undefined;
        this._firstName = "";
        this._lastName = "";
        this._email = "";
        this._password = "";
        this._userName = "";
        this._isAdmin = 0;
        this._online = 0;
        this._socketId = "";
        this._dateSubscribed = new Date();
    }


    createUser(userObject): User {
        const newUser = new User();
        newUser.id = userObject._id;
        newUser.firstName = userObject._firstName;
        newUser.lastName = userObject._lastName;
        newUser.email = userObject._email;
        newUser.password = userObject._password;
        newUser.userName = userObject._userName;
        newUser.isAdmin = userObject._isAdmin;
        newUser.online = userObject._online;
        newUser.socketId = userObject._socketId;
        newUser.dateSubscribed = userObject._dateSubscribed;
        return newUser;
    }
    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get firstName(): string {
        return this._firstName;
    }

    set firstName(value: string) {
        this._firstName = value;
    }

    get lastName(): string {
        return this._lastName;
    }

    set lastName(value: string) {
        this._lastName = value;
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        this._email = value;
    }

    get password(): string {
        return this._password;
    }

    set password(value: string) {
        this._password = value;
    }

    get userName(): string {
        return this._userName;
    }

    set userName(value: string) {
        this._userName = value;
    }

    get isAdmin(): number {
        return this._isAdmin;
    }

    set isAdmin(value: number) {
        this._isAdmin = value;
    }

    get online(): number {
        return this._online;
    }

    set online(value: number) {
        this._online = value;
    }

    get socketId(): string {
        return this._socketId;
    }

    set socketId(value: string) {
        this._socketId = value;
    }

    get dateSubscribed(): Date {
        return this._dateSubscribed;
    }

    set dateSubscribed(value: Date) {
        this._dateSubscribed = value;
    }
}
