import axios from "axios"
import {makeAutoObservable} from "mobx";
import {Comment, Post, UserInfo, UserProfile} from "../models/models";
// @ts-ignore
import AuthService from "../services/AuthService.ts";
import {jwtDecode} from "jwt-decode";
import {JwtResponse} from "../models/response/JwtResponse";
import {AuthResponse} from "../models/response/AuthResponse";
// @ts-ignore
import PostService from "../services/PostService.ts";

export default class Store {
    private _username = ""
    private _id = -2
    private _isAdmin = false
    private _isAuth = false
    private _isAuthLoading = false
    private _isLoading = false
    private _isWebsocketConnected = false
    private _avatar_url = ""


    constructor() {
        makeAutoObservable(this, {}, {autoBind: true})
    }

    get avatar_url(): string {
        return this._avatar_url;
    }

    set avatar_url(value: string) {
        this._avatar_url = value;
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

    set isAuthLoading(value: boolean) {
        this._isAuthLoading = value;
    }

    get isAuthLoading(): boolean {
        return this._isAuthLoading;
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

    async loginUser(username:string, password:string): Promise<UserInfo>{
        this.isLoading = true
        this.isAuthLoading = true
        try {
            const response = await AuthService.loginUser(username, password)
            localStorage.setItem('access_token', response.data.access_token)
            const decoded = jwtDecode<JwtResponse>(response.data.access_token)
            this.username = decoded.username
            this.id = decoded.sub
            this.avatar_url = response.data.avatar_url
            this.isAuth = true
            this.isAuthLoading = false
            return response.data
        } catch (e) {
            console.error("Error via login user: ", e)
            this.isAuthLoading = false
            throw e
        } finally {
            this.isLoading = false
        }
    }

    async registerUser(username: string, password: string): Promise<UserInfo> {
        this.isLoading = true
        try {
            const response = await AuthService.registerUser(username, password)
            return await this.loginUser(username, password)
        } catch (e) {
            console.error("Error via register user: ", e)
            throw e
        } finally {
            this.isLoading = false
        }
    }

    async logoutUser() {
        try {
            const response = await AuthService.logoutUser()
            localStorage.removeItem('access_token')
            this.isAuth = false
            this.username = ""
            this.avatar_url = ""
            this.id = -1
        } catch (e) {
            console.log("Error via logging out: ", e)
            throw e
        }
    }

    async getMyInfo() {
        try {
            const response = await AuthService.getMyInfo()
            this.avatar_url = response.data.avatar_url
        } catch (e) {
            console.log("Error via getting my profile: ", e)

        }
    }

    async checkAuth() {
        this.isLoading = true
        this.isAuthLoading = true
        try {
            axios.defaults.withCredentials = true
            const response = await axios.post<AuthResponse>('http://127.0.0.1:8000/auth/refresh', {withCredentials: true})
            localStorage.setItem('access_token', response.data.access_token)
            this.isAuth = true
            const decoded = jwtDecode<JwtResponse>(response.data.access_token)
            this.id = decoded.sub
            this.username = decoded.username
            this.isAuthLoading = false
            this.getMyInfo()

        } catch (e) {
            console.log("Error via checking auth: ", e)
            this.id = -1
            throw e
        } finally {
            this.isLoading = false
        }
    }

    async getAllPosts(): Promise<Post[]> {
        try {
            const response = await PostService.getAllPosts()
            console.log(response)
            return response.data
        } catch (e) {
            console.log("Error via getting posts: ", e)
            throw e
        }
    }

    async getPostById(postId:number): Promise<Post> {
        try {
            const response = await PostService.getPostById(postId)
            console.log(response)
            return response.data
        } catch (e) {
            console.log("Error via getting post by id: ", e)
            throw e
        }
    }

    async getUserPosts(userId:number): Promise<Post[]> {
        try {
            const response = await PostService.getUserPosts(userId)
            return response.data
        } catch (e) {
            console.log("Error via getting user posts: ", e)
            throw e
        }
    }

    async likePost(postId:number): Promise<void> {
        try {
            await PostService.likePost(postId)
        } catch (e) {
            console.log("Error via liking post: ", e)
            throw e
        }
    }

    async unlikePost(postId:number): Promise<void> {
        try {
            await PostService.unlikePost(postId)
        } catch (e) {
            console.log("Error via unliking post: ", e)
            throw e
        }
    }

    async createPost(formData: FormData): Promise<void> {
        try {
            await PostService.createPost(formData)
        } catch (e) {
            console.log("Error via creation post: ", e)
            throw e
        }
    }

    async createPostComment(id: number, text:string): Promise<Object> {
        try {
            const response = await PostService.createComment(id, text)
            return response.data
        } catch (e) {
            console.log("Error via creation comment: ", e)
            throw e
        }
    }

    async getPostComments(id: number): Promise<Comment[]> {
        try {
            const response = await PostService.getComments(id)
            console.log(response)
            return response.data
        } catch (e) {
            console.log("Error via fetching comments: ", e)
            throw e
        }
    }

    async getProfileInfo(userId:number): Promise<UserProfile> {
        try {
            const response = await AuthService.getProfileInfo(userId)
            return response.data
        } catch (e) {
            console.log("Error via getting my profile: ", e)
            throw e
        }
    }

    async editUserProfile(formData: FormData): Promise<void> {
        try {
            const response = await AuthService.editUserProfile(formData)
            this.username = response.data.username
            this.avatar_url = response.data.avatar_url
        } catch (e) {
            console.log("Error via editing profile: ", e)
            throw e
        }
    }

}