export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    first_name: string | null
                    surname: string | null
                    full_name: string | null
                    phone: string | null
                    avatar_url: string | null
                    role: 'tenant' | 'landlord' | 'admin'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    first_name?: string | null
                    surname?: string | null
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'tenant' | 'landlord' | 'admin'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    first_name?: string | null
                    surname?: string | null
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'tenant' | 'landlord' | 'admin'
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
