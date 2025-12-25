export interface UserInfo {
    username: string
    id: number
    access_token: string
    avatar_url: string
}

export interface UserProfile {
    id:number
    username:string
    display_name:string
    bio:string
    avatar_url:string
    avatar_width:number
    avatar_height:number

}

export interface Post {
    id:number
    author: {
        user_id:number
        username:string
        user_avatar:string
        avatar_width:number
        avatar_height:number
    }
    images:ImageInfo[]
    text:string
    counts:PostCounts
    parent_post_id:number
    created_at:string
    is_liked:boolean
}

export interface Comment {
    id:number
    text:string
    created_at:string
    author: {
        user_id:number
        username:string
        avatar_url:string
        avatar_width:number
        avatar_height:number
    }
}

export interface ImageInfo {
    url:string
    position:number
    width:number
    height:number
}

export interface PostCounts {
    likes:number
    comments:number
    reposts:number
}

