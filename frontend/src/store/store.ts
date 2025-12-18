import axios from "axios"
import {makeAutoObservable} from "mobx";

export default class Store {
    private _username = ""
    private _id = -2
    private _isAdmin = false
    private _isAuth = false
    private _isLoading = false
    private _isWebsocketConnected = false


    constructor() {
        makeAutoObservable(this, {}, {autoBind: true})
    }


    get username(): string {
        return this._username;
    }

    set username(value: string) {
        this._username = value;
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get isAdmin(): boolean {
        return this._isAdmin;
    }

    set isAdmin(value: boolean) {
        this._isAdmin = value;
    }

    get isAuth(): boolean {
        return this._isAuth;
    }

    set isAuth(value: boolean) {
        this._isAuth = value;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        this._isLoading = value;
    }

    get isWebsocketConnected(): boolean {
        return this._isWebsocketConnected;
    }

    set isWebsocketConnected(value: boolean) {
        this._isWebsocketConnected = value;
    }
}