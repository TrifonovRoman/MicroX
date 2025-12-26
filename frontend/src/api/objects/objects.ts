export interface Post {
    id: number;
    user_id: number;
    user_avatar: string; // path to avatar
    image_url: string; // path to image
    text: string;
    parent_post_id: number;
    created_at: string;
    is_deleted: boolean;
    is_liked: boolean;
}

export interface Comment {
    id: number;
    user_id: number;
    post_id: number;
    text: string;
    created_at: string;
    is_deleted: boolean;
}