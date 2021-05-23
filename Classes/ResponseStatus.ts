export class ResponseStatus<T> {
    private readonly _status: number;
    private readonly _message: string;
    private readonly _object: T;

    constructor(status: number, message: any, object: T) {
        this._status = status;
        this._message = message;
        this._object = object;
    }

    get status(): number {
        return this._status;
    }

    get message(): string {
        return this._message;
    }

    get object(): T {
        return this._object;
    }
}