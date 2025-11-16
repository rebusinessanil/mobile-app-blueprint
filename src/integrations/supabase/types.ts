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
      banner_defaults: {
        Row: {
          created_at: string | null
          id: string
          logo_left: string | null
          logo_right: string | null
          updated_at: string | null
          upline_avatars: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_left?: string | null
          logo_right?: string | null
          updated_at?: string | null
          upline_avatars?: Json | null
        }
        Update: {
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
          id: string
          mobile: string | null
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
          id?: string
          mobile?: string | null
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
          id?: string
          mobile?: string | null
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
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
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
      template_categories: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          category_id: string | null
          cover_thumbnail_url: string
          created_at: string | null
          description: string | null
          display_order: number | null
          gradient_colors: string[] | null
          id: string
          is_active: boolean | null
          layout_config: Json | null
          name: string
          required_fields: Json | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cover_thumbnail_url: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gradient_colors?: string[] | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json | null
          name: string
          required_fields?: Json | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cover_thumbnail_url?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gradient_colors?: string[] | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json | null
          name?: string
          required_fields?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
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
