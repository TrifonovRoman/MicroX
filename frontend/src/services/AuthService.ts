import {UserInfo, UserProfile} from "../models/models";
// @ts-ignore
import $api from "../api/index.ts";
import {Axios, AxiosResponse} from "axios";

export default class AuthService {
    static async loginUser(username:string, password:string): Promise<AxiosResponse<UserInfo>> {
        return $api.post('/auth/login', {username:username, password:password})
            .then(response => response)
    }

    static async registerUser(username:string, password:string): Promise<AxiosResponse<UserInfo>> {
        return $api.post('/auth/register', {username:username, password:password})
            .then(response => response)
    }

    static async logoutUser(): Promise<void> {
        return $api.post('/auth/logout')
    }

    static async getProfileInfo(userId:number): Promise<AxiosResponse<UserProfile>> {
        return $api.get(`/users/${userId}`)
            .then(response => response)
    }

    static async getMyInfo(): Promise<AxiosResponse<UserInfo>> {
        return $api.get(`/users/me`)
            .then(response => response)
    }

    static async editUserProfile(formData:FormData): Promise<AxiosResponse<UserInfo>> {
        return $api.post(`/users/me`, formData, {
            headers: {
                'Content-Type':'multipart/form-data'
            }
        })
            .then(response => response)
    }


}