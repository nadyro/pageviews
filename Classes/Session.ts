import {User} from "./User";
import {Conversation} from "./Conversation";

export class Session {
    public id: string;
    public user: User;
    public cookie: any;
    public conversations: Conversation[];


    constructor(session: any) {
        if (session.id)
        this.id = session.id;
        if (session.user)
        this.user = session.user;
        if (session.cookie)
        this.cookie = session.cookie;
        if (session.conversations) {
            this.conversations = session.conversations;
        } else {
            this.conversations = new Array<Conversation>();
        }
    }

    public getId(): string {
        return this.id;
    }

    public setId(value: string) {
        this.id = value;
    }

    public getUser(): User {
        return this.user;
    }

    public setUser(value: User) {
        this.user = value;
    }

    public getCookie(): any {
        return this.cookie;
    }

    public setCookie(value: any) {
        this.cookie = value;
    }

    public getConversations(): Conversation[] {
        return this.conversations;
    }

    public setConversations(value: Conversation[]) {
        this.conversations = value;
    }
}