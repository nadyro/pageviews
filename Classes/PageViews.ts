export class PageViews {
    private _id: string;
    private _userId: string;
    private _name: string;
    private _dateModified: string;
    private _dateRegistered: string;
    private _dateToDisplay: string;
    private _isAvailable: boolean;


    constructor() {
        this._id = undefined;
        this._userId = '';
        this._name = '';
        this._dateModified = '';
        this._dateRegistered = '';
        this._dateToDisplay = '';
        this._isAvailable = false;
    }


    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get userId(): string {
        return this._userId;
    }

    set userId(value: string) {
        this._userId = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get dateModified(): string {
        return this._dateModified;
    }

    set dateModified(value: string) {
        this._dateModified = value;
    }

    get dateRegistered(): string {
        return this._dateRegistered;
    }

    set dateRegistered(value: string) {
        this._dateRegistered = value;
    }

    get dateToDisplay(): string {
        return this._dateToDisplay;
    }

    set dateToDisplay(value: string) {
        this._dateToDisplay = value;
    }

    get isAvailable(): boolean {
        return this._isAvailable;
    }

    set isAvailable(value: boolean) {
        this._isAvailable = value;
    }
}
