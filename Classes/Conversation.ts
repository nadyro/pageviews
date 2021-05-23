import {User} from "./User";
import {Message} from "./Message";

export class Conversation {
    private _id: string;
    private _tmpId: string;
    private _users: User[];
    private _dateCreated: Date;
    private _dateModified: Date;
    private _messages: Message[];
    private _ongoing: boolean;

    constructor() {
        this._id = undefined;
        this._users = new Array<User>();
        this._dateCreated = new Date();
        this._dateModified = new Date();
        this._ongoing = false;
        this._tmpId = "";
        this._messages = new Array<Message>();
    }

    public addUser(user: User) {
        this._users.push(user);
    }
    public removeUser(userId: string) {
        this._users = this._users.filter((user) => {
            if (user.id !== userId)
                return user;
        })
    }
    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get tmpId(): string {
        return this._tmpId;
    }

    set tmpId(value: string) {
        this._tmpId = value;
    }

    get users(): User[] {
        return this._users;
    }

    set users(value: User[]) {
        this._users = value;
    }

    get dateCreated(): Date {
        return this._dateCreated;
    }

    set dateCreated(value: Date) {
        this._dateCreated = value;
    }

    get messages(): Message[] {
        return this._messages;
    }

    set messages(value: Message[]) {
        this._messages = value;
    }

    get ongoing(): boolean {
        return this._ongoing;
    }

    set ongoing(value: boolean) {
        this._ongoing = value;
    }

    get dateModified(): Date {
        return this._dateModified;
    }

    set dateModified(value: Date) {
        this._dateModified = value;
    }
}