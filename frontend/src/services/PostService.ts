import {Comment, Post, UserInfo} from "../models/models";
// @ts-ignore
import $api from "../api/index.ts";
import {Axios, AxiosResponse} from "axios";

export default class PostService {
    static async getAllPosts(): Promise<AxiosResponse<Post[]>> {
        return $api.get('/posts')
            .then(response => response)
    }

    static async getPostById(id:number): Promise<AxiosResponse<Post>> {
        return $api.get(`/posts/${id}`)
            .then(response => response)
    }

    static async likePost(id:number): Promise<AxiosResponse<UserInfo>> {
        // @ts-ignore
        return $api.post(`/likes/${id}`)
            .then(response => response)
    }

    static async unlikePost(id:number): Promise<AxiosResponse<UserInfo>> {
        // @ts-ignore
        return $api.delete(`/likes/${id}`)
            .then(response => response)
    }

    static async deletePostById(id:number): Promise<AxiosResponse<UserInfo>> {
        return $api.delete(`/posts/${id}`)
            .then(response => response)
    }

    static async getUserPosts(userId:number): Promise<AxiosResponse<Post[]>> {
        return $api.get(`/posts/users/${userId}`)
            .then(response => response)
    }

    // @ts-ignore
    static async getComments(id:number): Promise<AxiosResponse<Comment[]>> {
        return $api.get('/comments', {
            params: {
                post_id: id
            }
        })
            .then(response => response)
    }

    static async createComment(id:number, text:string): Promise<AxiosResponse<Post[]>> {
        // @ts-ignore
        return $api.post('/comments', {post_id:id, text:text})
            .then(response => response)
    }

    static async createPost(formData:FormData): Promise<AxiosResponse<UserInfo>> {
        return $api.post('/posts', formData, {
            headers: {
                'Content-Type':'multipart/form-data'
            }
        })
            .then(response => response)
    }
}