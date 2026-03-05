
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
      pois_staging: {
        Row: {
          id: string
          city_id: string | null
          osm_id: string
          name: string
          raw_category: string | null
          coords_lat: number
          coords_lng: number
          address: string | null
          ai_rating: 'low' | 'medium' | 'high' | 'service' | null
          processing_status: 'new' | 'ready' | 'imported' | 'discarded'
          orphan_city_tag: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          city_id?: string | null
          osm_id: string
          name: string
          raw_category?: string | null
          coords_lat: number
          coords_lng: number
          address?: string | null
          ai_rating?: 'low' | 'medium' | 'high' | 'service' | null
          processing_status?: 'new' | 'ready' | 'imported' | 'discarded'
          orphan_city_tag?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          city_id?: string | null
          osm_id?: string
          name?: string
          raw_category?: string | null
          coords_lat?: number
          coords_lng?: number
          address?: string | null
          ai_rating?: 'low' | 'medium' | 'high' | 'service' | null
          processing_status?: 'new' | 'ready' | 'imported' | 'discarded'
          orphan_city_tag?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          date: string
          is_read: boolean
          link_data: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          date?: string
          is_read?: boolean
          link_data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          date?: string
          is_read?: boolean
          link_data?: Json | null
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          continent: string | null
          nation: string | null
          admin_region: string | null
          zone: string
          description: string | null
          image_url: string
          hero_image: string | null
          rating: number | null
          visitors: number | null
          is_featured: boolean | null
          special_badge: string | null
          coords_lat: number
          coords_lng: number
          status: string | null
          subtitle: string | null
          history_snippet: string | null
          history_full: string | null
          official_website: string | null
          patron_details: Json | null
          ratings: Json | null
          gallery: string[] | null
          generation_logs: string[] | null
          created_at: string
          updated_at: string
          published_at: string | null
          home_order: number | null
        }
        Insert: {
          id: string
          name: string
          continent?: string | null
          nation?: string | null
          admin_region?: string | null
          zone: string
          description?: string | null
          image_url: string
          hero_image?: string | null
          rating?: number | null
          visitors?: number | null
          is_featured?: boolean | null
          special_badge?: string | null
          coords_lat: number
          coords_lng: number
          status?: string | null
          subtitle?: string | null
          history_snippet?: string | null
          history_full?: string | null
          official_website?: string | null
          patron_details?: Json | null
          ratings?: Json | null
          gallery?: string[] | null
          generation_logs?: string[] | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          home_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          continent?: string | null
          nation?: string | null
          admin_region?: string | null
          zone?: string
          description?: string | null
          image_url?: string
          hero_image?: string | null
          rating?: number | null
          visitors?: number | null
          is_featured?: boolean | null
          special_badge?: string | null
          coords_lat?: number
          coords_lng?: number
          status?: string | null
          subtitle?: string | null
          history_snippet?: string | null
          history_full?: string | null
          official_website?: string | null
          patron_details?: Json | null
          ratings?: Json | null
          gallery?: string[] | null
          generation_logs?: string[] | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          home_order?: number | null
        }
      }
      pois: {
        Row: {
          id: string
          city_id: string
          name: string
          category: string
          sub_category: string | null
          description: string
          image_url: string
          coords_lat: number
          coords_lng: number
          address: string
          rating: number
          votes: number
          visit_duration: string | null
          price_level: number | null
          opening_hours: Json | null
          is_sponsored: boolean | null
          tier: string | null
          showcase_expiry: string | null
          date_added: string | null
          affiliate: Json | null
          status: string
          ai_reliability: string | null
          tourism_interest: string | null
          last_verified: string | null
          link_metadata: Json | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id: string
          city_id: string
          name: string
          category: string
          sub_category?: string | null
          description: string
          image_url: string
          coords_lat: number
          coords_lng: number
          address: string
          rating?: number
          votes?: number
          visit_duration?: string | null
          price_level?: number | null
          opening_hours?: Json | null
          is_sponsored?: boolean | null
          tier?: string | null
          showcase_expiry?: string | null
          date_added?: string | null
          affiliate?: Json | null
          status?: string
          ai_reliability?: string | null
          tourism_interest?: string | null
          last_verified?: string | null
          link_metadata?: Json | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          category?: string
          sub_category?: string | null
          description?: string
          image_url?: string
          coords_lat?: number
          coords_lng?: number
          address?: string
          rating?: number
          votes?: number
          visit_duration?: string | null
          price_level?: number | null
          opening_hours?: Json | null
          is_sponsored?: boolean | null
          tier?: string | null
          showcase_expiry?: string | null
          date_added?: string | null
          affiliate?: Json | null
          status?: string
          ai_reliability?: string | null
          tourism_interest?: string | null
          last_verified?: string | null
          link_metadata?: Json | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
      }
      sponsors: {
        Row: {
          id: string
          city_id: string | null
          contact_name: string
          company_name: string
          vat_number: string
          email: string
          phone: string
          address: string | null
          status: string
          tier: string | null
          type: string | null
          amount: number | null
          start_date: string | null
          end_date: string | null
          plan: string | null
          invoice_number: string | null
          admin_notes: string | null
          rejection_reason: string | null
          partner_logs: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          city_id?: string | null
          contact_name: string
          company_name: string
          vat_number: string
          email: string
          phone: string
          address?: string | null
          status: string
          tier?: string | null
          type?: string | null
          amount?: number | null
          start_date?: string | null
          end_date?: string | null
          plan?: string | null
          invoice_number?: string | null
          admin_notes?: string | null
          rejection_reason?: string | null
          partner_logs?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          city_id?: string | null
          contact_name?: string
          company_name?: string
          vat_number?: string
          email?: string
          phone?: string
          address?: string | null
          status?: string
          tier?: string | null
          type?: string | null
          amount?: number | null
          start_date?: string | null
          end_date?: string | null
          plan?: string | null
          invoice_number?: string | null
          admin_notes?: string | null
          rejection_reason?: string | null
          partner_logs?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          status: string
          is_test_account: boolean | null
          nation: string | null
          city: string | null
          vat_number: string | null
          company_name: string | null
          avatar_url: string | null
          xp: number | null
          unlocked_rewards: string[] | null
          created_at: string
          last_access: string | null
          ai_daily_count: number | null
          ai_flash_count: number | null
          ai_pro_count: number | null
          ai_last_date: string | null
          referral_code: string | null
          referred_by: string | null
          extra_quota: number | null
          last_monthly_reset: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: string
          status?: string
          is_test_account?: boolean | null
          nation?: string | null
          city?: string | null
          vat_number?: string | null
          company_name?: string | null
          avatar_url?: string | null
          xp?: number | null
          unlocked_rewards?: string[] | null
          created_at?: string
          last_access?: string | null
          ai_daily_count?: number | null
          ai_flash_count?: number | null
          ai_pro_count?: number | null
          ai_last_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          extra_quota?: number | null
          last_monthly_reset?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          status?: string
          is_test_account?: boolean | null
          nation?: string | null
          city?: string | null
          vat_number?: string | null
          company_name?: string | null
          avatar_url?: string | null
          xp?: number | null
          unlocked_rewards?: string[] | null
          created_at?: string
          last_access?: string | null
          ai_daily_count?: number | null
          ai_flash_count?: number | null
          ai_pro_count?: number | null
          ai_last_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          extra_quota?: number | null
          last_monthly_reset?: string | null
        }
      }
      shops: {
        Row: {
          id: string
          city_id: string | null
          name: string
          category: string
          level: string | null
          badge: string | null
          image_url: string | null
          gallery: string[] | null
          founded_year: number | null
          short_bio: string | null
          description: string | null
          vat_number: string | null
          address: string | null
          coords_lat: number | null
          coords_lng: number | null
          phone: string | null
          email: string | null
          website: string | null
          shipping_info: string | null
          payment_info: string | null
          ai_credits: number | null
          is_tipico: boolean | null
          likes: number | null
          rating: number | null
          reviews_count: number | null
          reviews: Json | null
          updated_at: string | null
        }
        Insert: {
           id: string
           city_id?: string | null
           name: string
           category: string
           // ... others optional
        }
        Update: {
           id?: string
           // ... all optional
        }
      }
      shop_products: {
        Row: {
          id: string
          shop_id: string
          name: string
          description: string
          image_url: string
          price: number
          status: string
          shipping_mode: string
        }
        Insert: {
          id: string
          shop_id: string
          name: string
          description: string
          image_url: string
          price: number
          status?: string
          shipping_mode?: string
        }
        Update: {
           id?: string
           // ... optional
        }
      }
      news_ticker: {
        Row: {
          id: string
          text: string
          icon: string
          active: boolean
          created_at: string
          order_index: number | null
        }
        Insert: {
          id: string
          text: string
          icon: string
          active: boolean
          created_at?: string
          order_index?: number | null
        }
        Update: {
          id?: string
          text?: string
          icon?: string
          active?: boolean
          created_at?: string
          order_index?: number | null
        }
      }
      loading_tips: {
        Row: {
          id: string
          text: string
          active: boolean
          image_url: string | null
          order_index: number | null
          type: string | null
          created_at: string
        }
        Insert: {
          id: string
          text: string
          active?: boolean
          image_url?: string | null
          order_index?: number | null
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          text?: string
          active?: boolean
          image_url?: string | null
          order_index?: number | null
          type?: string | null
          created_at?: string
        }
      }
      static_pages: {
        Row: {
          slug: string
          title: string
          content_html: string
          updated_at: string | null
        }
        Insert: {
          slug: string
          title: string
          content_html: string
          updated_at?: string | null
        }
        Update: {
          slug?: string
          title?: string
          content_html?: string
          updated_at?: string | null
        }
      }
      ai_configs: {
        Row: {
          key: string
          prompts: string[] | null
          selected: string[] | null
          presets: Json | null
          updated_at: string | null
        }
        Insert: {
          key: string
          prompts?: string[] | null
          selected?: string[] | null
          presets?: Json | null
          updated_at?: string | null
        }
        Update: {
          key?: string
          prompts?: string[] | null
          selected?: string[] | null
          presets?: Json | null
          updated_at?: string | null
        }
      }
      photo_submissions: {
        Row: {
          id: string
          user_id: string
          user_name: string
          location_name: string
          description: string | null
          image_url: string
          status: string
          likes: number | null
          city_id: string | null
          created_at: string
          updated_at: string | null
          published_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          user_name: string
          location_name: string
          description?: string | null
          image_url: string
          status?: string
          likes?: number | null
          city_id?: string | null
          created_at?: string
          updated_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string
          location_name?: string
          description?: string | null
          image_url?: string
          status?: string
          likes?: number | null
          city_id?: string | null
          created_at?: string
          updated_at?: string | null
          published_at?: string | null
        }
      }
      live_snaps: {
        Row: {
          id: string
          url: string
          user_id: string
          user_name: string
          city_id: string | null
          caption: string | null
          created_at: string
          likes: number
          status: string | null
        }
        Insert: {
          id: string
          url: string
          user_id: string
          user_name: string
          city_id?: string | null
          caption?: string | null
          created_at?: string
          likes?: number
          status?: string | null
        }
        Update: {
          id?: string
          url?: string
          user_id?: string
          user_name?: string
          city_id?: string | null
          caption?: string | null
          created_at?: string
          likes?: number
          status?: string | null
        }
      }
      community_posts: {
        Row: {
          id: string
          author_id: string
          author_name: string
          author_role: string | null
          author_avatar: string | null
          text: string
          city_id: string
          city_name: string
          created_at: string
          likes: number
          replies_count: number
          replies: Json | null
        }
        Insert: {
          id: string
          author_id: string
          author_name: string
          author_role?: string | null
          author_avatar?: string | null
          text: string
          city_id: string
          city_name: string
          created_at?: string
          likes?: number
          replies_count?: number
          replies?: Json | null
        }
        Update: {
          id?: string
          author_id?: string
          author_name?: string
          author_role?: string | null
          author_avatar?: string | null
          text?: string
          city_id?: string
          city_name?: string
          created_at?: string
          likes?: number
          replies_count?: number
          replies?: Json | null
        }
      }
      global_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string | null
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string | null
        }
      }
      city_events: {
        Row: {
          id: string
          city_id: string
          name: string
          date: string
          category: string
          description: string | null
          location: string | null
          coords_lat: number | null
          coords_lng: number | null
          image_url: string | null
          metadata: Json | null
          order_index: number | null
        }
        Insert: {
          id: string
          city_id: string
          name: string
          date: string
          category: string
          description?: string | null
          location?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          image_url?: string | null
          metadata?: Json | null
          order_index?: number | null
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          date?: string
          category?: string
          description?: string | null
          location?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          image_url?: string | null
          metadata?: Json | null
          order_index?: number | null
        }
      }
      city_services: {
        Row: {
          id: string
          city_id: string
          type: string
          name: string
          contact: string | null
          description: string | null
          url: string | null
          address: string | null
          category: string | null
          order_index: number | null
        }
        Insert: {
          id: string
          city_id: string
          type: string
          name: string
          contact?: string | null
          description?: string | null
          url?: string | null
          address?: string | null
          category?: string | null
          order_index?: number | null
        }
        Update: {
           id?: string
           // ...
        }
      }
      city_guides: {
        Row: {
          id: string
          city_id: string
          name: string
          is_official: boolean
          languages: string[] | null
          specialties: string[] | null
          email: string | null
          phone: string | null
          website: string | null
          image_url: string | null
          rating: number | null
          reviews: Json | null
          order_index: number | null
        }
        Insert: {
          id: string
          city_id: string
          name: string
          is_official: boolean
          languages?: string[] | null
          specialties?: string[] | null
          email?: string | null
          phone?: string | null
          website?: string | null
          image_url?: string | null
          rating?: number | null
          reviews?: Json | null
          order_index?: number | null
        }
        Update: {
          id?: string
          // ...
        }
      }
      city_people: {
        Row: {
          id: string
          city_id: string | null
          name: string
          role: string
          bio: string
          full_bio: string | null
          image_url: string | null
          quote: string | null
          lifespan: string | null
          famous_works: string[] | null
          awards: string[] | null
          private_life: string | null
          related_places: Json | null
          career_stats: Json | null
          status: string | null
          order_index: number | null
        }
        Insert: {
          id: string
          city_id?: string | null
          name: string
          role: string
          bio: string
          full_bio?: string | null
          image_url?: string | null
          quote?: string | null
          lifespan?: string | null
          famous_works?: string[] | null
          awards?: string[] | null
          private_life?: string | null
          related_places?: Json | null
          career_stats?: Json | null
          status?: string | null
          order_index?: number | null
        }
        Update: {
          id?: string
          // ...
        }
      }
      rewards_catalog: {
        Row: {
          id: string
          title: string
          description: string
          required_level: number
          icon: string
          type: string
          category: string
          active: boolean
        }
        Insert: {
           id: string
           title: string
           description: string
           required_level: number
           icon: string
           type: string
           category: string
           active?: boolean
        }
        Update: {
           id?: string
           // ...
        }
      }
      xp_actions: {
        Row: {
          action_key: string
          label: string
          xp_amount: number
          icon: string
          description: string | null
          updated_at: string | null
        }
        Insert: {
          action_key: string
          label: string
          xp_amount: number
          icon: string
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          action_key?: string
          // ...
        }
      }
      user_rewards: {
        Row: {
          instance_id: string
          reward_id: string
          user_id: string
          code: string
          reward_title: string | null
          reward_category: string | null
          date_claimed: string
          status: string
          date_used: string | null
        }
        Insert: {
           instance_id: string
           reward_id: string
           user_id: string
           code: string
           reward_title?: string | null
           reward_category?: string | null
           date_claimed?: string
           status?: string
           date_used?: string | null
        }
        Update: {
           instance_id?: string
           status?: string
           date_used?: string | null
        }
      }
      communication_logs: {
        Row: {
          id: string
          created_at: string
          sender: string
          target_group: string
          subject: string
          body: string
          status: string
          type: string
        }
        Insert: {
          // ...
        }
        Update: {
          // ...
        }
      }
      system_messages: {
        Row: {
          key: string
          type: string
          label: string
          title_template: string | null
          body_template: string
          variables: string[] | null
          ui_config: Json | null
          device_target: string | null
          updated_at: string | null
        }
        Insert: {
           key: string
           type: string
           label: string
           title_template?: string | null
           body_template: string
           variables?: string[] | null
           ui_config?: Json | null
           device_target?: string | null
           updated_at?: string | null
        }
        Update: {
           key?: string
           // ...
        }
      }
      suggestions: {
        Row: {
          id: string
          user_id: string
          user_name: string
          city_id: string
          city_name: string
          poi_id: string | null
          type: string
          status: string
          details_json: Json
          admin_notes: string | null
          created_at: string
        }
        Insert: {
           id: string
           user_id: string
           user_name: string
           city_id: string
           city_name: string
           poi_id?: string | null
           type: string
           status?: string
           details_json: Json
           admin_notes?: string | null
           created_at?: string
        }
        Update: {
           id?: string
           status?: string
           admin_notes?: string | null
        }
      }
      reviews: {
          Row: {
              id: string
              author_name: string
              author_id: string | null
              rating: number
              comment: string
              status: string
              poi_id: string | null
              itinerary_id: string | null
              created_at: string
              approved_at: string | null
              criteria: Json | null
          }
          Insert: {
              id?: string
              author_name: string
              author_id?: string | null
              rating: number
              comment: string
              status?: string
              poi_id?: string | null
              itinerary_id?: string | null
              created_at?: string
              approved_at?: string | null
              criteria?: Json | null
          }
          Update: {
              id?: string
              // ...
          }
      }
      itineraries: {
          Row: {
              id: string
              title: string
              description: string
              duration_days: number
              cover_image: string
              tags: string[] | null
              difficulty: string
              type: string
              status: string
              author_name: string | null
              user_id: string | null
              rating: number
              votes: number
              continent: string | null
              nation: string | null
              region: string | null
              zone: string | null
              main_city: string
              items_json: Json
              created_at: string
              updated_at: string | null
          }
          Insert: {
              // ...
          }
          Update: {
              // ...
          }
      }
      photo_likes: {
          Row: {
              id: string
              user_id: string
              photo_id: string
              created_at: string
          }
          Insert: {
              user_id: string
              photo_id: string
          }
          Update: {
             // ...
          }
      }
      design_system_rules: {
        Row: {
          id: string
          section: string
          element_name: string
          component_key: string | null
          font_family: string
          text_size: string | null
          font_weight: string | null
          text_transform: string | null
          tracking: string | null
          color_class: string | null
          effect_class: string | null
          css_class: string | null
          preview_text: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          // ...
        }
        Update: {
          // ...
        }
      }
      taxonomy_mappings: {
        Row: {
          id: string
          input_term: string
          target_category: string
          target_subcategory: string
          target_tab: string | null
          context: string | null
          created_at: string
        }
        Insert: {
          id?: string
          input_term: string
          target_category: string
          target_subcategory: string
          target_tab?: string | null
          context?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          input_term?: string
          target_category?: string
          target_subcategory?: string
          target_tab?: string | null
          created_at?: string
        }
      },
      social_templates: {
        Row: {
          id: string
          name: string
          bg_url: string
          layout_config: Json
          theme: string
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          bg_url: string
          layout_config: Json
          theme?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          bg_url?: string
          layout_config?: Json
          theme?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      },
      tourist_zones: {
        Row: {
          id: string
          name: string
          admin_region: string
          description: string | null
          ai_suggestions: Json | null
          created_at: string
        }
        Insert: {
          name: string
          admin_region: string
          description?: string | null
          ai_suggestions?: Json | null
        }
        Update: {
           id?: string
           // ...
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}