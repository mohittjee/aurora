export interface User {
    id: string;
    email: string;
    name: string | null;
    googleId?: string | null;
    password?: string | null;
}