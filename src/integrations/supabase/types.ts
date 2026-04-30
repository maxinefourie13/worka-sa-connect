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
            referencedRelation: "business_verified_status"
            referencedColumns: ["business_id"]
          },
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
      business_google_reviews: {
        Row: {
          author_name: string
          author_photo_url: string | null
          business_id: string
          created_at: string
          id: string
          language: string | null
          rating: number
          relative_time: string | null
          text: string | null
          time: string | null
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          business_id: string
          created_at?: string
          id?: string
          language?: string | null
          rating: number
          relative_time?: string | null
          text?: string | null
          time?: string | null
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          business_id?: string
          created_at?: string
          id?: string
          language?: string | null
          rating?: number
          relative_time?: string | null
          text?: string | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_verified_status"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_google_reviews_business_id_fkey"
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
          flagged_for_review: boolean
          followers_count: number
          google_maps_url: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          google_reviews_last_fetched_at: string | null
          hours: string | null
          id: string
          image_url: string | null
          is_suspended: boolean
          is_verified: boolean
          last_active_at: string
          listing_status: string
          name: string
          owner_id: string
          phone: string | null
          plan: Database["public"]["Enums"]["business_plan"]
          pre_launch: boolean
          province: string
          rating: number
          report_count: number
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
          flagged_for_review?: boolean
          followers_count?: number
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          google_reviews_last_fetched_at?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_suspended?: boolean
          is_verified?: boolean
          last_active_at?: string
          listing_status?: string
          name: string
          owner_id: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["business_plan"]
          pre_launch?: boolean
          province: string
          rating?: number
          report_count?: number
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
          flagged_for_review?: boolean
          followers_count?: number
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          google_reviews_last_fetched_at?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_suspended?: boolean
          is_verified?: boolean
          last_active_at?: string
          listing_status?: string
          name?: string
          owner_id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["business_plan"]
          pre_launch?: boolean
          province?: string
          rating?: number
          report_count?: number
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
      contact_reveals: {
        Row: {
          business_id: string
          created_at: string
          id: string
          viewer_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          viewer_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          claimed_founding_spot: boolean
          created_at: string
          email: string
          id: string
          role: string
          source: string | null
        }
        Insert: {
          claimed_founding_spot?: boolean
          created_at?: string
          email: string
          id?: string
          role: string
          source?: string | null
        }
        Update: {
          claimed_founding_spot?: boolean
          created_at?: string
          email?: string
          id?: string
          role?: string
          source?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
          posted_by_name: string | null
          province: string
          requirements: string[]
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
          urgent_boost_amount_cents: number | null
          urgent_boost_paid_at: string | null
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
          posted_by_name?: string | null
          province: string
          requirements?: string[]
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
          urgent_boost_amount_cents?: number | null
          urgent_boost_paid_at?: string | null
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
          posted_by_name?: string | null
          province?: string
          requirements?: string[]
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
          urgent_boost_amount_cents?: number | null
          urgent_boost_paid_at?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          error_message: string | null
          id: string
          kind: Database["public"]["Enums"]["payment_event_kind"]
          paystack_event: string
          paystack_reference: string
          processed: boolean
          processed_at: string | null
          raw: Json
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_event_kind"]
          paystack_event: string
          paystack_reference: string
          processed?: boolean
          processed_at?: string | null
          raw: Json
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_event_kind"]
          paystack_event?: string
          paystack_reference?: string
          processed?: boolean
          processed_at?: string | null
          raw?: Json
          user_id?: string | null
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
            referencedRelation: "business_verified_status"
            referencedColumns: ["business_id"]
          },
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
            referencedRelation: "business_verified_status"
            referencedColumns: ["business_id"]
          },
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
          email_alerts_optin: boolean
          founding_proposals_period_start: string
          founding_proposals_used_this_month: number
          id: string
          is_id_verified: boolean
          onesignal_player_id: string | null
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          push_alerts_optin: boolean
          smile_id_job_id: string | null
          tier: Database["public"]["Enums"]["sjoh_tier"]
          tier_expires_at: string | null
          trial_ends_at: string | null
          updated_at: string
          urgent_alerts_optin: boolean
          user_id: string
          verification_expires_at: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          email_alerts_optin?: boolean
          founding_proposals_period_start?: string
          founding_proposals_used_this_month?: number
          id?: string
          is_id_verified?: boolean
          onesignal_player_id?: string | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          push_alerts_optin?: boolean
          smile_id_job_id?: string | null
          tier?: Database["public"]["Enums"]["sjoh_tier"]
          tier_expires_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          urgent_alerts_optin?: boolean
          user_id: string
          verification_expires_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          email_alerts_optin?: boolean
          founding_proposals_period_start?: string
          founding_proposals_used_this_month?: number
          id?: string
          is_id_verified?: boolean
          onesignal_player_id?: string | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          push_alerts_optin?: boolean
          smile_id_job_id?: string | null
          tier?: Database["public"]["Enums"]["sjoh_tier"]
          tier_expires_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          urgent_alerts_optin?: boolean
          user_id?: string
          verification_expires_at?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
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
            referencedRelation: "business_verified_status"
            referencedColumns: ["business_id"]
          },
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
            referencedRelation: "business_verified_status"
            referencedColumns: ["business_id"]
          },
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          business_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_verified_status"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "user_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_business_id_fkey"
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
      business_verified_status: {
        Row: {
          business_id: string | null
          is_verified_pro: boolean | null
        }
        Relationships: []
      }
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
          pre_launch: boolean | null
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
          pre_launch?: boolean | null
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
          pre_launch?: boolean | null
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
      founding_spot_counts: {
        Row: {
          cap: number | null
          claimed: number | null
          remaining: number | null
          role: string | null
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
      admin_create_founding_signup: {
        Args: { _email: string; _role: string }
        Returns: string
      }
      admin_set_founding_spot: {
        Args: { _claimed: boolean; _signup_id: string }
        Returns: boolean
      }
      apply_subscription_payment: {
        Args: {
          _customer_code: string
          _next_renewal: string
          _subscription_code: string
          _tier: Database["public"]["Enums"]["sjoh_tier"]
          _user_id: string
        }
        Returns: undefined
      }
      apply_urgent_boost: {
        Args: {
          _amount_cents: number
          _opportunity_id: string
          _reference: string
          _user_id: string
        }
        Returns: boolean
      }
      apply_verification_result: {
        Args: { _job_id: string; _user_id: string; _verified: boolean }
        Returns: undefined
      }
      bump_last_active: { Args: never; Returns: undefined }
      business_lead_count: {
        Args: { _business_id: string; _since?: string }
        Returns: number
      }
      can_use_founding_proposal: {
        Args: { _user_id: string }
        Returns: boolean
      }
      claim_founding_spot: { Args: { _signup_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      expire_stale_verifications: { Args: never; Returns: undefined }
      get_founding_spot_counts: {
        Args: never
        Returns: {
          cap: number
          claimed: number
          remaining: number
          role: string
        }[]
      }
      has_active_listing_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_verified_pro_access: { Args: { _user_id: string }; Returns: boolean }
      is_founding_member: { Args: { _user_id: string }; Returns: boolean }
      lapse_subscription: {
        Args: { _subscription_code: string }
        Returns: undefined
      }
      mark_verification_pending: {
        Args: { _job_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      reactivate_listing: { Args: { _business_id: string }; Returns: boolean }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      report_business: {
        Args: { _business_id: string; _details?: string; _reason: string }
        Returns: string
      }
      reveal_contact: {
        Args: { _business_id: string }
        Returns: {
          email: string
          phone: string
        }[]
      }
      run_lifecycle_sweep: { Args: never; Returns: Json }
      set_business_pre_launch: {
        Args: { _business_id: string; _pre_launch: boolean }
        Returns: boolean
      }
      set_email_alerts_optin: {
        Args: { _enabled: boolean }
        Returns: undefined
      }
      set_push_subscription: {
        Args: { _enabled: boolean; _player_id: string }
        Returns: undefined
      }
      submit_proposal: {
        Args: {
          _business_id: string
          _message: string
          _opportunity_id: string
          _quote_amount: number
        }
        Returns: string
      }
      transition_listing_states: {
        Args: never
        Returns: {
          to_archived: number
          to_dormant: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "business_owner" | "client"
      budget_type: "fixed" | "estimate" | "negotiable"
      business_plan: "free" | "standard" | "featured"
      opportunity_status: "open" | "closed" | "awarded"
      payment_event_kind:
        | "subscription_charge"
        | "subscription_disable"
        | "subscription_payment_failed"
        | "klap_topup_charge"
        | "urgent_fee_charge"
        | "other"
        | "urgent_boost"
      price_type: "fixed" | "from" | "quote"
      proposal_status: "pending" | "shortlisted" | "won" | "lost" | "withdrawn"
      sjoh_tier:
        | "none"
        | "basic_trial"
        | "basic"
        | "verified_pro_trial"
        | "verified_pro"
      verification_status:
        | "not_required"
        | "required"
        | "pending"
        | "verified"
        | "failed"
        | "expired"
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
      opportunity_status: ["open", "closed", "awarded"],
      payment_event_kind: [
        "subscription_charge",
        "subscription_disable",
        "subscription_payment_failed",
        "klap_topup_charge",
        "urgent_fee_charge",
        "other",
        "urgent_boost",
      ],
      price_type: ["fixed", "from", "quote"],
      proposal_status: ["pending", "shortlisted", "won", "lost", "withdrawn"],
      sjoh_tier: [
        "none",
        "basic_trial",
        "basic",
        "verified_pro_trial",
        "verified_pro",
      ],
      verification_status: [
        "not_required",
        "required",
        "pending",
        "verified",
        "failed",
        "expired",
      ],
    },
  },
} as const
