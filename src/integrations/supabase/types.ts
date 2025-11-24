export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      Anniversary: {
        Row: {
          Anniversary_image_url: string
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          short_title: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          Anniversary_image_url: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          Anniversary_image_url?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Anniversary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Anniversary_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_defaults: {
        Row: {
          congratulations_image: string | null
          created_at: string | null
          id: string
          logo_left: string | null
          logo_right: string | null
          updated_at: string | null
          upline_avatars: Json | null
        }
        Insert: {
          congratulations_image?: string | null
          created_at?: string | null
          id?: string
          logo_left?: string | null
          logo_right?: string | null
          updated_at?: string | null
          upline_avatars?: Json | null
        }
        Update: {
          congratulations_image?: string | null
          created_at?: string | null
          id?: string
          logo_left?: string | null
          logo_right?: string | null
          updated_at?: string | null
          upline_avatars?: Json | null
        }
        Relationships: []
      }
      banner_stickers: {
        Row: {
          banner_id: string | null
          created_at: string | null
          id: string
          position: number | null
          sticker_id: string | null
        }
        Insert: {
          banner_id?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          sticker_id?: string | null
        }
        Update: {
          banner_id?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          sticker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_stickers_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banner_stickers_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          achievement_photo: string | null
          cheque_amount: string | null
          created_at: string | null
          id: string
          rank_gradient: string | null
          rank_icon: string | null
          rank_name: string
          team_city: string | null
          template_color: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_photo?: string | null
          cheque_amount?: string | null
          created_at?: string | null
          id?: string
          rank_gradient?: string | null
          rank_icon?: string | null
          rank_name: string
          team_city?: string | null
          template_color?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_photo?: string | null
          cheque_amount?: string | null
          created_at?: string | null
          id?: string
          rank_gradient?: string | null
          rank_icon?: string | null
          rank_name?: string
          team_city?: string | null
          template_color?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Birthday: {
        Row: {
          Birthday_image_url: string
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          short_title: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          Birthday_image_url: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          Birthday_image_url?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Birthday_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Birthday_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bonanza_trips: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          short_title: string | null
          title: string
          trip_image_url: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title: string
          trip_image_url: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title?: string
          trip_image_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bonanza_trips_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bonanza_trips_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_banner_settings: {
        Row: {
          category_slug: string
          created_at: string | null
          id: string
          updated_at: string | null
          upline_avatars: Json | null
          user_id: string
        }
        Insert: {
          category_slug: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          upline_avatars?: Json | null
          user_id: string
        }
        Update: {
          category_slug?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          upline_avatars?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      "Motivational Banner": {
        Row: {
          Anniversary_image_url: string
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          short_title: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          Anniversary_image_url: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          Anniversary_image_url?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Motivational Banner_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Motivational Banner_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          photo_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          customer_code: string | null
          id: string
          mobile: string
          name: string
          profile_photo: string | null
          rank: string | null
          role: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          customer_code?: string | null
          id?: string
          mobile: string
          name: string
          profile_photo?: string | null
          rank?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          customer_code?: string | null
          id?: string
          mobile?: string
          name?: string
          profile_photo?: string | null
          rank?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      ranks: {
        Row: {
          category_id: string | null
          color: string
          created_at: string | null
          display_order: number | null
          gradient: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          color: string
          created_at?: string | null
          display_order?: number | null
          gradient: string
          icon: string
          id: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          color?: string
          created_at?: string | null
          display_order?: number | null
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ranks_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sticker_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      stickers: {
        Row: {
          banner_category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          position_x: number | null
          position_y: number | null
          rank_id: string | null
          rotation: number | null
          scale: number | null
          slot_number: number | null
          updated_at: string | null
        }
        Insert: {
          banner_category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          position_x?: number | null
          position_y?: number | null
          rank_id?: string | null
          rotation?: number | null
          scale?: number | null
          slot_number?: number | null
          updated_at?: string | null
        }
        Update: {
          banner_category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          position_x?: number | null
          position_y?: number | null
          rank_id?: string | null
          rotation?: number | null
          scale?: number | null
          slot_number?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stickers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sticker_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stickers_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          category_id: string | null
          content_url: string | null
          cover_image_url: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content_url?: string | null
          cover_image_url: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content_url?: string | null
          cover_image_url?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      template_backgrounds: {
        Row: {
          background_image_url: string
          created_at: string | null
          id: string
          is_active: boolean | null
          slot_number: number | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          background_image_url: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          slot_number?: number | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          background_image_url?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          slot_number?: number | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_backgrounds_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_categories: {
        Row: {
          color_class: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          route_path: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          color_class?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          route_path?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          color_class?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          route_path?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          anniversary_id: string | null
          birthday_id: string | null
          category_id: string | null
          cover_thumbnail_url: string
          created_at: string | null
          description: string | null
          display_order: number | null
          gradient_colors: string[] | null
          id: string
          is_active: boolean | null
          layout_config: Json | null
          motivational_banner_id: string | null
          name: string
          rank_id: string | null
          required_fields: Json | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          anniversary_id?: string | null
          birthday_id?: string | null
          category_id?: string | null
          cover_thumbnail_url: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gradient_colors?: string[] | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json | null
          motivational_banner_id?: string | null
          name: string
          rank_id?: string | null
          required_fields?: Json | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          anniversary_id?: string | null
          birthday_id?: string | null
          category_id?: string | null
          cover_thumbnail_url?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gradient_colors?: string[] | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json | null
          motivational_banner_id?: string | null
          name?: string
          rank_id?: string | null
          required_fields?: Json | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_anniversary_id_fkey"
            columns: ["anniversary_id"]
            isOneToOne: false
            referencedRelation: "Anniversary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_birthday_id_fkey"
            columns: ["birthday_id"]
            isOneToOne: false
            referencedRelation: "Birthday"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_motivational_banner_id_fkey"
            columns: ["motivational_banner_id"]
            isOneToOne: false
            referencedRelation: "Motivational Banner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "bonanza_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_achievements: {
        Row: {
          achievement_photo: string | null
          banner_id: string | null
          created_at: string | null
          id: string
          name: string
          team_city: string | null
          trip_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_photo?: string | null
          banner_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          team_city?: string | null
          trip_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_photo?: string | null
          banner_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          team_city?: string | null
          trip_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_achievements_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_achievements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "bonanza_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      user_banner_settings: {
        Row: {
          auto_share_to_feed: boolean | null
          created_at: string | null
          id: string
          logo_left: string | null
          logo_right: string | null
          show_contact_info: boolean | null
          show_rank_badge: boolean | null
          show_upline_names: boolean | null
          updated_at: string | null
          upline_avatars: Json | null
          user_id: string
        }
        Insert: {
          auto_share_to_feed?: boolean | null
          created_at?: string | null
          id?: string
          logo_left?: string | null
          logo_right?: string | null
          show_contact_info?: boolean | null
          show_rank_badge?: boolean | null
          show_upline_names?: boolean | null
          updated_at?: string | null
          upline_avatars?: Json | null
          user_id: string
        }
        Update: {
          auto_share_to_feed?: boolean | null
          created_at?: string | null
          id?: string
          logo_left?: string | null
          logo_right?: string | null
          show_contact_info?: boolean | null
          show_rank_badge?: boolean | null
          show_upline_names?: boolean | null
          updated_at?: string | null
          upline_avatars?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          total_earned: number
          total_spent: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_customer_code: { Args: never; Returns: string }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
