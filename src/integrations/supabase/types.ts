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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_follows: {
        Row: {
          business_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          category_name: string
          category_slug: string
          certifications: string[]
          certified_pro: boolean
          city: string
          created_at: string
          description: string | null
          email: string | null
          followers_count: number
          hours: string | null
          id: string
          image_url: string | null
          is_verified: boolean
          name: string
          owner_id: string
          phone: string | null
          plan: Database["public"]["Enums"]["business_plan"]
          province: string
          rating: number
          response_rate: number
          review_count: number
          slug: string
          strikes: number
          tags: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category_name: string
          category_slug: string
          certifications?: string[]
          certified_pro?: boolean
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          followers_count?: number
          hours?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          name: string
          owner_id: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["business_plan"]
          province: string
          rating?: number
          response_rate?: number
          review_count?: number
          slug: string
          strikes?: number
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category_name?: string
          category_slug?: string
          certifications?: string[]
          certified_pro?: boolean
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          followers_count?: number
          hours?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          name?: string
          owner_id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["business_plan"]
          province?: string
          rating?: number
          response_rate?: number
          review_count?: number
          slug?: string
          strikes?: number
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      klap_events: {
        Row: {
          cost: number
          created_at: string
          id: string
          job_title: string
          opportunity_id: string | null
          outcome: Database["public"]["Enums"]["klap_outcome"]
          proposal_id: string | null
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          job_title: string
          opportunity_id?: string | null
          outcome?: Database["public"]["Enums"]["klap_outcome"]
          proposal_id?: string | null
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          job_title?: string
          opportunity_id?: string | null
          outcome?: Database["public"]["Enums"]["klap_outcome"]
          proposal_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "klap_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klap_events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          applicants_count: number
          budget: number
          budget_type: Database["public"]["Enums"]["budget_type"]
          category_name: string
          category_slug: string
          city: string
          client_id: string
          created_at: string
          deadline: string | null
          description: string
          id: string
          is_urgent: boolean
          posted_by_name: string | null
          province: string
          requirements: string[]
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
        }
        Insert: {
          applicants_count?: number
          budget?: number
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category_name: string
          category_slug: string
          city: string
          client_id: string
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          is_urgent?: boolean
          posted_by_name?: string | null
          province: string
          requirements?: string[]
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
        }
        Update: {
          applicants_count?: number
          budget?: number
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category_name?: string
          category_slug?: string
          city?: string
          client_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          is_urgent?: boolean
          posted_by_name?: string | null
          province?: string
          requirements?: string[]
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          business_id: string
          created_at: string
          id: string
          klaps_spent: number
          message: string
          opportunity_id: string
          provider_id: string
          quote_amount: number | null
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          klaps_spent?: number
          message: string
          opportunity_id: string
          provider_id: string
          quote_amount?: number | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          klaps_spent?: number
          message?: string
          opportunity_id?: string
          provider_id?: string
          quote_amount?: number | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_balances: {
        Row: {
          id: string
          klaps_remaining: number
          klaps_this_month: number
          tier: Database["public"]["Enums"]["sjoh_tier"]
          trial_ends_at: string | null
          updated_at: string
          urgent_alerts_optin: boolean
          user_id: string
        }
        Insert: {
          id?: string
          klaps_remaining?: number
          klaps_this_month?: number
          tier?: Database["public"]["Enums"]["sjoh_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          urgent_alerts_optin?: boolean
          user_id: string
        }
        Update: {
          id?: string
          klaps_remaining?: number
          klaps_this_month?: number
          tier?: Database["public"]["Enums"]["sjoh_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          urgent_alerts_optin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          business_id: string
          created_at: string
          id: string
          rating: number
          reviewer_company: string | null
          reviewer_id: string | null
          reviewer_name: string
        }
        Insert: {
          body: string
          business_id: string
          created_at?: string
          id?: string
          rating: number
          reviewer_company?: string | null
          reviewer_id?: string | null
          reviewer_name: string
        }
        Update: {
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          rating?: number
          reviewer_company?: string | null
          reviewer_id?: string | null
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          price_from: number
          price_type: Database["public"]["Enums"]["price_type"]
          sort_order: number
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_from?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          sort_order?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_from?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      businesses_public: {
        Row: {
          address: string | null
          category_name: string | null
          category_slug: string | null
          certifications: string[] | null
          certified_pro: boolean | null
          city: string | null
          created_at: string | null
          description: string | null
          followers_count: number | null
          hours: string | null
          id: string | null
          image_url: string | null
          is_verified: boolean | null
          name: string | null
          owner_id: string | null
          plan: Database["public"]["Enums"]["business_plan"] | null
          province: string | null
          rating: number | null
          response_rate: number | null
          review_count: number | null
          slug: string | null
          tags: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category_name?: string | null
          category_slug?: string | null
          certifications?: string[] | null
          certified_pro?: boolean | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          followers_count?: number | null
          hours?: string | null
          id?: string | null
          image_url?: string | null
          is_verified?: boolean | null
          name?: string | null
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["business_plan"] | null
          province?: string | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category_name?: string | null
          category_slug?: string | null
          certifications?: string[] | null
          certified_pro?: boolean | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          followers_count?: number | null
          hours?: string | null
          id?: string | null
          image_url?: string | null
          is_verified?: boolean | null
          name?: string | null
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["business_plan"] | null
          province?: string | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          province: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          province?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          province?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      spend_klap: {
        Args: { _job_title: string; _opportunity_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "business_owner" | "client"
      budget_type: "fixed" | "estimate" | "negotiable"
      business_plan: "free" | "standard" | "featured"
      klap_outcome: "pending" | "won" | "lost"
      opportunity_status: "open" | "closed" | "awarded"
      price_type: "fixed" | "from" | "quote"
      proposal_status: "pending" | "shortlisted" | "won" | "lost" | "withdrawn"
      sjoh_tier: "dala-trial" | "hustler" | "main-oke"
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
      app_role: ["admin", "business_owner", "client"],
      budget_type: ["fixed", "estimate", "negotiable"],
      business_plan: ["free", "standard", "featured"],
      klap_outcome: ["pending", "won", "lost"],
      opportunity_status: ["open", "closed", "awarded"],
      price_type: ["fixed", "from", "quote"],
      proposal_status: ["pending", "shortlisted", "won", "lost", "withdrawn"],
      sjoh_tier: ["dala-trial", "hustler", "main-oke"],
    },
  },
} as const
