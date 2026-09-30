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
      _wf13_backup_viaggio_suitcases_dedupe: {
        Row: {
          created_at: string
          id: string
          suitcase_id: string
          user_id: string | null
          viaggio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suitcase_id: string
          user_id?: string | null
          viaggio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suitcase_id?: string
          user_id?: string | null
          viaggio_id?: string
        }
        Relationships: []
      }
      admin_credit_grants: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string | null
          credit_type: string | null
          expires_at: string | null
          id: string
          notes: string | null
          pricing_reference_value_eur: number | null
          reason: string
          source: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string | null
          credit_type?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          pricing_reference_value_eur?: number | null
          reason: string
          source: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string | null
          credit_type?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          pricing_reference_value_eur?: number | null
          reason?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_credit_grants_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_credit_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          category: string
          city_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          partner_id: string
          platform: string
          poi_id: string | null
          product_id: string | null
          search_query: string | null
          source_type: string
        }
        Insert: {
          category: string
          city_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          partner_id: string
          platform?: string
          poi_id?: string | null
          product_id?: string | null
          search_query?: string | null
          source_type: string
        }
        Update: {
          category?: string
          city_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          partner_id?: string
          platform?: string
          poi_id?: string | null
          product_id?: string | null
          search_query?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "affiliate_clicks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "affiliate_clicks_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "obs_poi_anomalies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "poi_quality_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_product_links: {
        Row: {
          created_at: string | null
          id: string
          image_override: string | null
          partner_id: string
          priority: number | null
          product_id: string | null
          query: string | null
          tracking_override: string | null
          updated_at: string | null
          url_override: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_override?: string | null
          partner_id: string
          priority?: number | null
          product_id?: string | null
          query?: string | null
          tracking_override?: string | null
          updated_at?: string | null
          url_override?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_override?: string | null
          partner_id?: string
          priority?: number | null
          product_id?: string | null
          query?: string | null
          tracking_override?: string | null
          updated_at?: string | null
          url_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_product_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_products: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_price: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          preferred_partners: string[] | null
          priority: number | null
          product_id: string | null
          provider: string
          target_categories: string[] | null
          target_poi_types: string[] | null
          target_tags: string[] | null
          trigger_items: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_price?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          preferred_partners?: string[] | null
          priority?: number | null
          product_id?: string | null
          provider: string
          target_categories?: string[] | null
          target_poi_types?: string[] | null
          target_tags?: string[] | null
          trigger_items?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_price?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          preferred_partners?: string[] | null
          priority?: number | null
          product_id?: string | null
          provider?: string
          target_categories?: string[] | null
          target_poi_types?: string[] | null
          target_tags?: string[] | null
          trigger_items?: string[] | null
        }
        Relationships: []
      }
      affiliate_triggers: {
        Row: {
          created_at: string | null
          id: string
          priority: number | null
          product_id: string | null
          trigger_key: string
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          priority?: number | null
          product_id?: string | null
          trigger_key: string
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          priority?: number | null
          product_id?: string | null
          trigger_key?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_triggers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_burst_packs: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string | null
          flash_requests: number | null
          id: string
          name: string
          price: number
          pro_requests: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          flash_requests?: number | null
          id?: string
          name: string
          price: number
          pro_requests?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          flash_requests?: number | null
          id?: string
          name?: string
          price?: number
          pro_requests?: number | null
        }
        Relationships: []
      }
      ai_burst_transactions: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          pack_id: string | null
          price_paid: number | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          pack_id?: string | null
          price_paid?: number | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          pack_id?: string | null
          price_paid?: number | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_burst_transactions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "ai_burst_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_burst_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_configs: {
        Row: {
          description: string | null
          key: string
          presets: Json | null
          prompts: string[] | null
          selected: string[] | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          key: string
          presets?: Json | null
          prompts?: string[] | null
          selected?: string[] | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          presets?: Json | null
          prompts?: string[] | null
          selected?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_global_usage: {
        Row: {
          date: string
          guest_id: string | null
          id: string
          model_type: string | null
          request_count: number | null
          user_id: string | null
        }
        Insert: {
          date: string
          guest_id?: string | null
          id?: string
          model_type?: string | null
          request_count?: number | null
          user_id?: string | null
        }
        Update: {
          date?: string
          guest_id?: string | null
          id?: string
          model_type?: string | null
          request_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_model_prices: {
        Row: {
          cost_per_request: number
          model: string
          updated_at: string | null
        }
        Insert: {
          cost_per_request: number
          model: string
          updated_at?: string | null
        }
        Update: {
          cost_per_request?: number
          model?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          completion_tokens: number | null
          created_at: string | null
          estimated_cost_eur: number | null
          feature_name: string
          id: string
          model_name: string
          pricing_version_id: string | null
          prompt_tokens: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string | null
          estimated_cost_eur?: number | null
          feature_name: string
          id?: string
          model_name: string
          pricing_version_id?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string | null
          estimated_cost_eur?: number | null
          feature_name?: string
          id?: string
          model_name?: string
          pricing_version_id?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_pricing_version_id_fkey"
            columns: ["pricing_version_id"]
            isOneToOne: false
            referencedRelation: "pricing_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          meta_data: Json | null
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          meta_data?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          meta_data?: Json | null
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          icon_key: string | null
          id: string
          label: string
          style_class: string | null
        }
        Insert: {
          created_at?: string | null
          icon_key?: string | null
          id: string
          label: string
          style_class?: string | null
        }
        Update: {
          created_at?: string | null
          icon_key?: string | null
          id?: string
          label?: string
          style_class?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          admin_region: string | null
          city_types: string[] | null
          classification_explainability: Json | null
          continent: string | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          description: string | null
          events: Json | null
          famous_people: Json | null
          gallery: Json | null
          generation_logs: Json | null
          guides: Json | null
          hero_image: string | null
          hero_status: Database["public"]["Enums"]["media_status"]
          history_full: string | null
          history_snippet: string | null
          home_order: number | null
          id: string
          image_credit: string | null
          image_license: string | null
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          is_featured: boolean | null
          name: string
          nation: string | null
          official_website: string | null
          patron_details: Json | null
          patron_editorial_status: string | null
          rating: number | null
          ratings: Json | null
          region_id: string | null
          services: Json | null
          slug: string | null
          special_badge: string | null
          status: string | null
          subtitle: string | null
          tourist_zone_id: string | null
          updated_at: string | null
          visitors: number | null
          wikimedia_hero_public_enabled: boolean
          zone: string | null
        }
        Insert: {
          admin_region?: string | null
          city_types?: string[] | null
          classification_explainability?: Json | null
          continent?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          description?: string | null
          events?: Json | null
          famous_people?: Json | null
          gallery?: Json | null
          generation_logs?: Json | null
          guides?: Json | null
          hero_image?: string | null
          hero_status?: Database["public"]["Enums"]["media_status"]
          history_full?: string | null
          history_snippet?: string | null
          home_order?: number | null
          id: string
          image_credit?: string | null
          image_license?: string | null
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          nation?: string | null
          official_website?: string | null
          patron_details?: Json | null
          patron_editorial_status?: string | null
          rating?: number | null
          ratings?: Json | null
          region_id?: string | null
          services?: Json | null
          slug?: string | null
          special_badge?: string | null
          status?: string | null
          subtitle?: string | null
          tourist_zone_id?: string | null
          updated_at?: string | null
          visitors?: number | null
          wikimedia_hero_public_enabled?: boolean
          zone?: string | null
        }
        Update: {
          admin_region?: string | null
          city_types?: string[] | null
          classification_explainability?: Json | null
          continent?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          description?: string | null
          events?: Json | null
          famous_people?: Json | null
          gallery?: Json | null
          generation_logs?: Json | null
          guides?: Json | null
          hero_image?: string | null
          hero_status?: Database["public"]["Enums"]["media_status"]
          history_full?: string | null
          history_snippet?: string | null
          home_order?: number | null
          id?: string
          image_credit?: string | null
          image_license?: string | null
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          nation?: string | null
          official_website?: string | null
          patron_details?: Json | null
          patron_editorial_status?: string | null
          rating?: number | null
          ratings?: Json | null
          region_id?: string | null
          services?: Json | null
          slug?: string | null
          special_badge?: string | null
          status?: string | null
          subtitle?: string | null
          tourist_zone_id?: string | null
          updated_at?: string | null
          visitors?: number | null
          wikimedia_hero_public_enabled?: boolean
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "active_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_tourist_zone_id_fkey"
            columns: ["tourist_zone_id"]
            isOneToOne: false
            referencedRelation: "active_tourist_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_tourist_zone_id_fkey"
            columns: ["tourist_zone_id"]
            isOneToOne: false
            referencedRelation: "tourist_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cities_registry"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "cities_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      cities_legacy_jsonb_backup: {
        Row: {
          backup_created_at: string | null
          events: Json | null
          famous_people: Json | null
          guides: Json | null
          id: string | null
          services: Json | null
          slug: string | null
        }
        Insert: {
          backup_created_at?: string | null
          events?: Json | null
          famous_people?: Json | null
          guides?: Json | null
          id?: string | null
          services?: Json | null
          slug?: string | null
        }
        Update: {
          backup_created_at?: string | null
          events?: Json | null
          famous_people?: Json | null
          guides?: Json | null
          id?: string | null
          services?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      cities_registry: {
        Row: {
          id: string
          name: string
          population: number | null
          province: string
          region: string
          slug: string
        }
        Insert: {
          id: string
          name: string
          population?: number | null
          province: string
          region: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          population?: number | null
          province?: string
          region?: string
          slug?: string
        }
        Relationships: []
      }
      city_events: {
        Row: {
          category: string | null
          city_id: string
          coords_lat: number | null
          coords_lng: number | null
          created_at: string
          date: string | null
          description: string | null
          id: string
          image_is_placeholder: boolean | null
          image_url: string | null
          location: string | null
          metadata: Json | null
          name: string
          order_index: number | null
        }
        Insert: {
          category?: string | null
          city_id: string
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          image_is_placeholder?: boolean | null
          image_url?: string | null
          location?: string | null
          metadata?: Json | null
          name: string
          order_index?: number | null
        }
        Update: {
          category?: string | null
          city_id?: string
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          image_is_placeholder?: boolean | null
          image_url?: string | null
          location?: string | null
          metadata?: Json | null
          name?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "city_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "city_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      city_guides: {
        Row: {
          city_id: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          image_is_placeholder: boolean | null
          image_url: string | null
          is_official: boolean | null
          languages: string[] | null
          name: string
          order_index: number | null
          owner_id: string | null
          phone: string | null
          rating: number | null
          reviews: Json | null
          slug: string | null
          specialties: string[] | null
          website: string | null
        }
        Insert: {
          city_id: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_is_placeholder?: boolean | null
          image_url?: string | null
          is_official?: boolean | null
          languages?: string[] | null
          name: string
          order_index?: number | null
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          reviews?: Json | null
          slug?: string | null
          specialties?: string[] | null
          website?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_is_placeholder?: boolean | null
          image_url?: string | null
          is_official?: boolean | null
          languages?: string[] | null
          name?: string
          order_index?: number | null
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          reviews?: Json | null
          slug?: string | null
          specialties?: string[] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_guides_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_guides_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "city_guides_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "city_guides_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      city_id_mapping: {
        Row: {
          new_id: string | null
          old_id: string | null
        }
        Insert: {
          new_id?: string | null
          old_id?: string | null
        }
        Update: {
          new_id?: string | null
          old_id?: string | null
        }
        Relationships: []
      }
      city_patron_gallery: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          caption: string | null
          city_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
          source_suggestion_item_id: string | null
          storage_path: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          city_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          source_suggestion_item_id?: string | null
          storage_path?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          city_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          source_suggestion_item_id?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_patron_gallery_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_patron_gallery_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "city_patron_gallery_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "city_patron_gallery_source_suggestion_item_id_fkey"
            columns: ["source_suggestion_item_id"]
            isOneToOne: false
            referencedRelation: "patron_photo_suggestion_items"
            referencedColumns: ["id"]
          },
        ]
      }
      city_people: {
        Row: {
          awards: string[] | null
          bio: string | null
          birth_date: string | null
          birth_year: number | null
          career_stats: Json | null
          city_id: string
          created_at: string
          death_date: string | null
          death_year: number | null
          famous_works: string[] | null
          full_bio: string | null
          id: string
          image_is_placeholder: boolean | null
          image_storage_path: string | null
          image_url: string | null
          is_living: boolean
          lifespan: string | null
          lifespan_display: string | null
          name: string
          order_index: number | null
          private_life: string | null
          quote: string | null
          related_places: Json | null
          status: string | null
        }
        Insert: {
          awards?: string[] | null
          bio?: string | null
          birth_date?: string | null
          birth_year?: number | null
          career_stats?: Json | null
          city_id: string
          created_at?: string
          death_date?: string | null
          death_year?: number | null
          famous_works?: string[] | null
          full_bio?: string | null
          id?: string
          image_is_placeholder?: boolean | null
          image_storage_path?: string | null
          image_url?: string | null
          is_living?: boolean
          lifespan?: string | null
          lifespan_display?: string | null
          name: string
          order_index?: number | null
          private_life?: string | null
          quote?: string | null
          related_places?: Json | null
          status?: string | null
        }
        Update: {
          awards?: string[] | null
          bio?: string | null
          birth_date?: string | null
          birth_year?: number | null
          career_stats?: Json | null
          city_id?: string
          created_at?: string
          death_date?: string | null
          death_year?: number | null
          famous_works?: string[] | null
          full_bio?: string | null
          id?: string
          image_is_placeholder?: boolean | null
          image_storage_path?: string | null
          image_url?: string | null
          is_living?: boolean
          lifespan?: string | null
          lifespan_display?: string | null
          name?: string
          order_index?: number | null
          private_life?: string | null
          quote?: string | null
          related_places?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_people_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_people_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "city_people_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      city_person_category_links: {
        Row: {
          person_id: string
          specific_category_id: string
        }
        Insert: {
          person_id: string
          specific_category_id: string
        }
        Update: {
          person_id?: string
          specific_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_person_category_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "city_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_person_category_links_specific_category_id_fkey"
            columns: ["specific_category_id"]
            isOneToOne: false
            referencedRelation: "famous_person_specific_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      city_services: {
        Row: {
          address: string | null
          category: string | null
          city_id: string
          contact: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number | null
          type: string
          url: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city_id: string
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          type: string
          url?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city_id?: string
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_services_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_services_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "city_services_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      city_template_map: {
        Row: {
          city_type: string
          created_at: string
          id: string
          priority: number
          template_id: string
        }
        Insert: {
          city_type: string
          created_at?: string
          id?: string
          priority?: number
          template_id: string
        }
        Update: {
          city_type?: string
          created_at?: string
          id?: string
          priority?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_template_map_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      city_tour_operators: {
        Row: {
          address: string | null
          city_id: string
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          description: string | null
          destinations: string[] | null
          email: string | null
          id: string
          image_url: string | null
          is_sponsored: boolean | null
          license_number: string | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          rating: number | null
          reviews: Json | null
          services_offered: string[] | null
          slug: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city_id: string
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          description?: string | null
          destinations?: string[] | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_sponsored?: boolean | null
          license_number?: string | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          reviews?: Json | null
          services_offered?: string[] | null
          slug?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          description?: string | null
          destinations?: string[] | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_sponsored?: boolean | null
          license_number?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          reviews?: Json | null
          services_offered?: string[] | null
          slug?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_tour_operators_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_domain_events: {
        Row: {
          actor_id: string | null
          created_at: string
          domain: string
          event_type: string
          id: string
          kind: Database["public"]["Enums"]["shared_resource_kind"] | null
          payload: Json
          resource_id: string | null
          shared_resource_id: string | null
          summary: string
          workspace_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          domain?: string
          event_type: string
          id?: string
          kind?: Database["public"]["Enums"]["shared_resource_kind"] | null
          payload?: Json
          resource_id?: string | null
          shared_resource_id?: string | null
          summary: string
          workspace_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          domain?: string
          event_type?: string
          id?: string
          kind?: Database["public"]["Enums"]["shared_resource_kind"] | null
          payload?: Json
          resource_id?: string | null
          shared_resource_id?: string | null
          summary?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_domain_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_domain_events_shared_resource_id_fkey"
            columns: ["shared_resource_id"]
            isOneToOne: false
            referencedRelation: "shared_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_domain_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          body: string
          created_at: string | null
          id: string
          sender: string
          status: string
          subject: string
          target_group: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          sender: string
          status: string
          subject: string
          target_group: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          sender?: string
          status?: string
          subject?: string
          target_group?: string
          type?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          author_role: string | null
          city_id: string | null
          city_name: string | null
          created_at: string | null
          id: string
          likes: number | null
          replies: Json | null
          replies_count: number | null
          text: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          author_role?: string | null
          city_id?: string | null
          city_name?: string | null
          created_at?: string | null
          id?: string
          likes?: number | null
          replies?: Json | null
          replies_count?: number | null
          text?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          author_role?: string | null
          city_id?: string | null
          city_name?: string | null
          created_at?: string | null
          id?: string
          likes?: number | null
          replies?: Json | null
          replies_count?: number | null
          text?: string | null
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          author_id: string
          author_name: string
          author_role: string | null
          created_at: string
          id: string
          parent_reply_id: string | null
          post_id: string
          text: string
        }
        Insert: {
          author_id: string
          author_name: string
          author_role?: string | null
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          post_id: string
          text: string
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string | null
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          post_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "community_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          admin_notes: string | null
          assignment_id: string | null
          city_id: string
          created_at: string
          entity_id: string
          entity_type: string
          evidence_captured_at: string | null
          evidence_content_hash: string | null
          evidence_storage_bucket: string | null
          evidence_storage_path: string | null
          id: string
          legacy_report_id: string | null
          legacy_table: string | null
          parent_report_id: string | null
          reason: string
          report_group_id: string
          report_kind: string
          reporter_email: string | null
          reporter_email_verified: boolean
          reporter_user_id: string | null
          reporter_user_name: string | null
          snapshot_assignment_status: string | null
          snapshot_entity_name: string | null
          snapshot_entity_status: string | null
          snapshot_image_url: string | null
          snapshot_storage_bucket: string | null
          snapshot_storage_path: string | null
          source_context: string | null
          status: string
          updated_at: string
          user_notes: string
        }
        Insert: {
          admin_notes?: string | null
          assignment_id?: string | null
          city_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          evidence_captured_at?: string | null
          evidence_content_hash?: string | null
          evidence_storage_bucket?: string | null
          evidence_storage_path?: string | null
          id?: string
          legacy_report_id?: string | null
          legacy_table?: string | null
          parent_report_id?: string | null
          reason: string
          report_group_id: string
          report_kind: string
          reporter_email?: string | null
          reporter_email_verified?: boolean
          reporter_user_id?: string | null
          reporter_user_name?: string | null
          snapshot_assignment_status?: string | null
          snapshot_entity_name?: string | null
          snapshot_entity_status?: string | null
          snapshot_image_url?: string | null
          snapshot_storage_bucket?: string | null
          snapshot_storage_path?: string | null
          source_context?: string | null
          status?: string
          updated_at?: string
          user_notes: string
        }
        Update: {
          admin_notes?: string | null
          assignment_id?: string | null
          city_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          evidence_captured_at?: string | null
          evidence_content_hash?: string | null
          evidence_storage_bucket?: string | null
          evidence_storage_path?: string | null
          id?: string
          legacy_report_id?: string | null
          legacy_table?: string | null
          parent_report_id?: string | null
          reason?: string
          report_group_id?: string
          report_kind?: string
          reporter_email?: string | null
          reporter_email_verified?: boolean
          reporter_user_id?: string | null
          reporter_user_name?: string | null
          snapshot_assignment_status?: string | null
          snapshot_entity_name?: string | null
          snapshot_entity_status?: string | null
          snapshot_image_url?: string | null
          snapshot_storage_bucket?: string | null
          snapshot_storage_path?: string | null
          source_context?: string | null
          status?: string
          updated_at?: string
          user_notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "entity_image_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "content_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "content_reports_parent_report_id_fkey"
            columns: ["parent_report_id"]
            isOneToOne: false
            referencedRelation: "content_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      continents: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount_eur: number
          completed_at: string | null
          created_at: string | null
          flash_credits_assigned: number | null
          id: string
          metadata: Json | null
          package_id: string | null
          pro_credits_assigned: number | null
          provider_session_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount_eur: number
          completed_at?: string | null
          created_at?: string | null
          flash_credits_assigned?: number | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          pro_credits_assigned?: number | null
          provider_session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount_eur?: number
          completed_at?: string | null
          created_at?: string | null
          flash_credits_assigned?: number | null
          id?: string
          metadata?: Json | null
          package_id?: string | null
          pro_credits_assigned?: number | null
          provider_session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "extra_credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      design_system_rules: {
        Row: {
          color_class: string | null
          component_key: string | null
          created_at: string | null
          css_class: string | null
          effect_class: string | null
          element_name: string
          font_family: string
          font_weight: string | null
          id: string
          line_height: string | null
          notes: string | null
          preview_text: string | null
          section: string
          text_size: string | null
          text_transform: string | null
          tracking: string | null
          updated_at: string | null
        }
        Insert: {
          color_class?: string | null
          component_key?: string | null
          created_at?: string | null
          css_class?: string | null
          effect_class?: string | null
          element_name: string
          font_family: string
          font_weight?: string | null
          id?: string
          line_height?: string | null
          notes?: string | null
          preview_text?: string | null
          section: string
          text_size?: string | null
          text_transform?: string | null
          tracking?: string | null
          updated_at?: string | null
        }
        Update: {
          color_class?: string | null
          component_key?: string | null
          created_at?: string | null
          css_class?: string | null
          effect_class?: string | null
          element_name?: string
          font_family?: string
          font_weight?: string | null
          id?: string
          line_height?: string | null
          notes?: string | null
          preview_text?: string | null
          section?: string
          text_size?: string | null
          text_transform?: string | null
          tracking?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dev_sync_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          source: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          source: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          source?: string
        }
        Relationships: []
      }
      entity_image_assignments: {
        Row: {
          assignment_role: string
          assignment_status: string
          city_id: string
          created_at: string
          entity_id: string
          entity_type: string
          first_published_at: string | null
          id: string
          is_current: boolean
          media_asset_id: string
          published_at: string | null
          removed_at: string | null
          replaced_by_assignment_id: string | null
          source_image_url: string | null
          source_storage_bucket: string | null
          source_storage_path: string | null
          updated_at: string
        }
        Insert: {
          assignment_role?: string
          assignment_status?: string
          city_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          first_published_at?: string | null
          id?: string
          is_current?: boolean
          media_asset_id: string
          published_at?: string | null
          removed_at?: string | null
          replaced_by_assignment_id?: string | null
          source_image_url?: string | null
          source_storage_bucket?: string | null
          source_storage_path?: string | null
          updated_at?: string
        }
        Update: {
          assignment_role?: string
          assignment_status?: string
          city_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          first_published_at?: string | null
          id?: string
          is_current?: boolean
          media_asset_id?: string
          published_at?: string | null
          removed_at?: string | null
          replaced_by_assignment_id?: string | null
          source_image_url?: string | null
          source_storage_bucket?: string | null
          source_storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_image_assignments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_image_assignments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "entity_image_assignments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "entity_image_assignments_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_image_assignments_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets_with_usage_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_image_assignments_replaced_by_assignment_id_fkey"
            columns: ["replaced_by_assignment_id"]
            isOneToOne: false
            referencedRelation: "entity_image_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_image_history: {
        Row: {
          actor_user_id: string | null
          admin_override: boolean
          admin_rationale: string | null
          ai_rationale: string | null
          assignment_id: string | null
          city_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          geo_admin_region: string | null
          geo_city_name: string | null
          geo_continent: string | null
          geo_nation: string | null
          geo_zone: string | null
          id: string
          media_asset_id: string | null
          metadata: Json
          new_asset_status:
            | Database["public"]["Enums"]["image_asset_status"]
            | null
          new_assignment_status: string | null
          previous_asset_status:
            | Database["public"]["Enums"]["image_asset_status"]
            | null
          previous_assignment_status: string | null
          replaced_by_assignment_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          admin_override?: boolean
          admin_rationale?: string | null
          ai_rationale?: string | null
          assignment_id?: string | null
          city_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          geo_admin_region?: string | null
          geo_city_name?: string | null
          geo_continent?: string | null
          geo_nation?: string | null
          geo_zone?: string | null
          id?: string
          media_asset_id?: string | null
          metadata?: Json
          new_asset_status?:
            | Database["public"]["Enums"]["image_asset_status"]
            | null
          new_assignment_status?: string | null
          previous_asset_status?:
            | Database["public"]["Enums"]["image_asset_status"]
            | null
          previous_assignment_status?: string | null
          replaced_by_assignment_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          admin_override?: boolean
          admin_rationale?: string | null
          ai_rationale?: string | null
          assignment_id?: string | null
          city_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          geo_admin_region?: string | null
          geo_city_name?: string | null
          geo_continent?: string | null
          geo_nation?: string | null
          geo_zone?: string | null
          id?: string
          media_asset_id?: string | null
          metadata?: Json
          new_asset_status?:
            | Database["public"]["Enums"]["image_asset_status"]
            | null
          new_assignment_status?: string | null
          previous_asset_status?:
            | Database["public"]["Enums"]["image_asset_status"]
            | null
          previous_assignment_status?: string | null
          replaced_by_assignment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_image_history_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "entity_image_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_image_history_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_image_history_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "entity_image_history_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "entity_image_history_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_image_history_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets_with_usage_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_image_history_replaced_by_assignment_id_fkey"
            columns: ["replaced_by_assignment_id"]
            isOneToOne: false
            referencedRelation: "entity_image_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_credit_packages: {
        Row: {
          created_at: string | null
          description: string | null
          flash_credits: number
          id: string
          is_active: boolean | null
          is_recommended: boolean | null
          name: string
          price_eur: number
          pro_credits: number
          sort_order: number | null
          stripe_price_id_prod: string | null
          stripe_price_id_test: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flash_credits?: number
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          name: string
          price_eur: number
          pro_credits?: number
          sort_order?: number | null
          stripe_price_id_prod?: string | null
          stripe_price_id_test?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flash_credits?: number
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          name?: string
          price_eur?: number
          pro_credits?: number
          sort_order?: number | null
          stripe_price_id_prod?: string | null
          stripe_price_id_test?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      famous_person_master_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          label: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          label: string
          order_index?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      famous_person_photo_reports: {
        Row: {
          admin_notes: string | null
          city_id: string
          city_name: string
          created_at: string
          id: string
          notes: string | null
          person_id: string
          person_image_storage_path: string | null
          person_image_url: string
          person_name: string
          reason: string
          reporter_user_id: string | null
          reporter_user_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          city_id: string
          city_name: string
          created_at?: string
          id?: string
          notes?: string | null
          person_id: string
          person_image_storage_path?: string | null
          person_image_url: string
          person_name: string
          reason: string
          reporter_user_id?: string | null
          reporter_user_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          city_id?: string
          city_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          person_id?: string
          person_image_storage_path?: string | null
          person_image_url?: string
          person_name?: string
          reason?: string
          reporter_user_id?: string | null
          reporter_user_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "famous_person_photo_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famous_person_photo_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "famous_person_photo_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "famous_person_photo_reports_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "city_people"
            referencedColumns: ["id"]
          },
        ]
      }
      famous_person_photo_suggestions: {
        Row: {
          admin_notes: string | null
          city_id: string
          city_name: string
          created_at: string
          id: string
          image_url: string
          notes: string | null
          person_id: string
          person_name: string
          rights_confirmed: boolean
          status: string
          storage_path: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          admin_notes?: string | null
          city_id: string
          city_name: string
          created_at?: string
          id?: string
          image_url: string
          notes?: string | null
          person_id: string
          person_name: string
          rights_confirmed?: boolean
          status?: string
          storage_path: string
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          admin_notes?: string | null
          city_id?: string
          city_name?: string
          created_at?: string
          id?: string
          image_url?: string
          notes?: string | null
          person_id?: string
          person_name?: string
          rights_confirmed?: boolean
          status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "famous_person_photo_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famous_person_photo_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "famous_person_photo_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "famous_person_photo_suggestions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "city_people"
            referencedColumns: ["id"]
          },
        ]
      }
      famous_person_specific_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          label: string
          master_id: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          label: string
          master_id: string
          order_index?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          master_id?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "famous_person_specific_categories_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "famous_person_master_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      famous_person_suggestions: {
        Row: {
          accepted_person_id: string | null
          admin_notes: string | null
          city_id: string
          city_name: string
          created_at: string
          id: string
          notes: string
          status: string
          suggested_name: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          accepted_person_id?: string | null
          admin_notes?: string | null
          city_id: string
          city_name: string
          created_at?: string
          id?: string
          notes: string
          status?: string
          suggested_name: string
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          accepted_person_id?: string | null
          admin_notes?: string | null
          city_id?: string
          city_name?: string
          created_at?: string
          id?: string
          notes?: string
          status?: string
          suggested_name?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "famous_person_suggestions_accepted_person_id_fkey"
            columns: ["accepted_person_id"]
            isOneToOne: false
            referencedRelation: "city_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famous_person_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famous_person_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "famous_person_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      gamification_levels: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          icon: string
          level: number
          min_xp: number
          name: string
        }
        Insert: {
          color: string
          created_at?: string | null
          description?: string | null
          icon: string
          level: number
          min_xp: number
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          level?: number
          min_xp?: number
          name?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      image_verification_runs: {
        Row: {
          ai_summary: string | null
          blocking_step_code: string | null
          created_at: string
          id: string
          media_asset_id: string
          overall_outcome:
            | Database["public"]["Enums"]["image_verification_step_outcome"]
            | null
        }
        Insert: {
          ai_summary?: string | null
          blocking_step_code?: string | null
          created_at?: string
          id?: string
          media_asset_id: string
          overall_outcome?:
            | Database["public"]["Enums"]["image_verification_step_outcome"]
            | null
        }
        Update: {
          ai_summary?: string | null
          blocking_step_code?: string | null
          created_at?: string
          id?: string
          media_asset_id?: string
          overall_outcome?:
            | Database["public"]["Enums"]["image_verification_step_outcome"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "image_verification_runs_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_verification_runs_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets_with_usage_count"
            referencedColumns: ["id"]
          },
        ]
      }
      image_verification_steps: {
        Row: {
          admin_override: boolean
          admin_rationale: string | null
          ai_rationale: string | null
          created_at: string
          evidence_json: Json
          id: string
          outcome: Database["public"]["Enums"]["image_verification_step_outcome"]
          run_id: string
          step_code: string
          step_order: number
          updated_at: string
        }
        Insert: {
          admin_override?: boolean
          admin_rationale?: string | null
          ai_rationale?: string | null
          created_at?: string
          evidence_json?: Json
          id?: string
          outcome: Database["public"]["Enums"]["image_verification_step_outcome"]
          run_id: string
          step_code: string
          step_order: number
          updated_at?: string
        }
        Update: {
          admin_override?: boolean
          admin_rationale?: string | null
          ai_rationale?: string | null
          created_at?: string
          evidence_json?: Json
          id?: string
          outcome?: Database["public"]["Enums"]["image_verification_step_outcome"]
          run_id?: string
          step_code?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_verification_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "image_verification_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          author_name: string | null
          continent: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_days: number | null
          id: string
          items_json: Json | null
          last_modified_by: string | null
          main_city: string | null
          nation: string | null
          rating: number | null
          region: string | null
          source_diary_id: string | null
          status: string | null
          suitcase_id: string | null
          tags: string[] | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          viaggio_id: string | null
          votes: number | null
          zone: string | null
        }
        Insert: {
          author_name?: string | null
          continent?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          id?: string
          items_json?: Json | null
          last_modified_by?: string | null
          main_city?: string | null
          nation?: string | null
          rating?: number | null
          region?: string | null
          source_diary_id?: string | null
          status?: string | null
          suitcase_id?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          viaggio_id?: string | null
          votes?: number | null
          zone?: string | null
        }
        Update: {
          author_name?: string | null
          continent?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          id?: string
          items_json?: Json | null
          last_modified_by?: string | null
          main_city?: string | null
          nation?: string | null
          rating?: number | null
          region?: string | null
          source_diary_id?: string | null
          status?: string | null
          suitcase_id?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          viaggio_id?: string | null
          votes?: number | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_source_diary_id_fkey"
            columns: ["source_diary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_suitcase_fk"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_viaggio_id_fkey"
            columns: ["viaggio_id"]
            isOneToOne: false
            referencedRelation: "viaggi"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_suitcases: {
        Row: {
          created_at: string | null
          itinerary_id: string
          suitcase_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          itinerary_id: string
          suitcase_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          itinerary_id?: string
          suitcase_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_suitcases_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_suitcases_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      loading_tips: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          image_url: string | null
          order_index: number | null
          text: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          text: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          text?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          archived_at: string | null
          asset_status: Database["public"]["Enums"]["image_asset_status"]
          attribution_text: string | null
          author_name: string | null
          content_hash: string | null
          copyright_notice: string | null
          created_at: string
          generated_by_ai: boolean
          id: string
          is_placeholder: boolean
          license_code: string | null
          license_url: string | null
          license_verified_at: string | null
          metadata: Json
          origin_type: string
          retrieved_at: string | null
          rights_holder: string | null
          source_ref: string | null
          source_url: string | null
          storage_bucket: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          asset_status?: Database["public"]["Enums"]["image_asset_status"]
          attribution_text?: string | null
          author_name?: string | null
          content_hash?: string | null
          copyright_notice?: string | null
          created_at?: string
          generated_by_ai?: boolean
          id?: string
          is_placeholder?: boolean
          license_code?: string | null
          license_url?: string | null
          license_verified_at?: string | null
          metadata?: Json
          origin_type?: string
          retrieved_at?: string | null
          rights_holder?: string | null
          source_ref?: string | null
          source_url?: string | null
          storage_bucket: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          asset_status?: Database["public"]["Enums"]["image_asset_status"]
          attribution_text?: string | null
          author_name?: string | null
          content_hash?: string | null
          copyright_notice?: string | null
          created_at?: string
          generated_by_ai?: boolean
          id?: string
          is_placeholder?: boolean
          license_code?: string | null
          license_url?: string | null
          license_verified_at?: string | null
          metadata?: Json
          origin_type?: string
          retrieved_at?: string | null
          rights_holder?: string | null
          source_ref?: string | null
          source_url?: string | null
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      nations: {
        Row: {
          continent_id: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          continent_id?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          continent_id?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "nations_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "active_continents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nations_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "continents"
            referencedColumns: ["id"]
          },
        ]
      }
      news_ticker: {
        Row: {
          active: boolean | null
          created_at: string | null
          icon: string | null
          id: string
          order_index: number | null
          text: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          icon?: string | null
          id: string
          order_index?: number | null
          text: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          text?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          date: string
          id: string
          is_read: boolean
          link_data: Json | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          is_read?: boolean
          link_data?: Json | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          is_read?: boolean
          link_data?: Json | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      packing_ai_catalog: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      packing_standard_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      packing_template_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      patron_photo_reports: {
        Row: {
          admin_notes: string | null
          city_id: string
          city_name: string
          created_at: string
          gallery_image_url: string
          gallery_photo_id: string | null
          gallery_storage_path: string | null
          id: string
          notes: string | null
          patron_name: string
          reason: string
          reporter_user_id: string | null
          reporter_user_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          city_id: string
          city_name: string
          created_at?: string
          gallery_image_url: string
          gallery_photo_id?: string | null
          gallery_storage_path?: string | null
          id?: string
          notes?: string | null
          patron_name: string
          reason: string
          reporter_user_id?: string | null
          reporter_user_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          city_id?: string
          city_name?: string
          created_at?: string
          gallery_image_url?: string
          gallery_photo_id?: string | null
          gallery_storage_path?: string | null
          id?: string
          notes?: string | null
          patron_name?: string
          reason?: string
          reporter_user_id?: string | null
          reporter_user_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patron_photo_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patron_photo_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "patron_photo_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "patron_photo_reports_gallery_photo_id_fkey"
            columns: ["gallery_photo_id"]
            isOneToOne: false
            referencedRelation: "city_patron_gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      patron_photo_suggestion_items: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sort_order: number
          status: string
          storage_path: string
          suggestion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          status?: string
          storage_path: string
          suggestion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          status?: string
          storage_path?: string
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patron_photo_suggestion_items_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "patron_photo_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      patron_photo_suggestions: {
        Row: {
          admin_notes: string | null
          city_id: string
          city_name: string
          created_at: string
          id: string
          notes: string | null
          patron_name: string
          rights_confirmed: boolean
          status: string
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          admin_notes?: string | null
          city_id: string
          city_name: string
          created_at?: string
          id?: string
          notes?: string | null
          patron_name: string
          rights_confirmed?: boolean
          status?: string
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          admin_notes?: string | null
          city_id?: string
          city_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          patron_name?: string
          rights_confirmed?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "patron_photo_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patron_photo_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "patron_photo_suggestions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      photo_likes: {
        Row: {
          created_at: string | null
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photo_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_submissions: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_official: boolean
          likes: number | null
          location_name: string
          media_status: Database["public"]["Enums"]["media_status"]
          published_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_official?: boolean
          likes?: number | null
          location_name: string
          media_status?: Database["public"]["Enums"]["media_status"]
          published_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_official?: boolean
          likes?: number | null
          location_name?: string
          media_status?: Database["public"]["Enums"]["media_status"]
          published_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_submissions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_submissions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "photo_submissions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          segment: Database["public"]["Enums"]["plan_segment"]
          type: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          segment: Database["public"]["Enums"]["plan_segment"]
          type: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          segment?: Database["public"]["Enums"]["plan_segment"]
          type?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      platform_control_audit: {
        Row: {
          action: string
          actor_id: string | null
          config_key: string
          created_at: string
          id: string
          reason: string | null
          value_after: Json | null
          value_before: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          config_key: string
          created_at?: string
          id?: string
          reason?: string | null
          value_after?: Json | null
          value_before?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          config_key?: string
          created_at?: string
          id?: string
          reason?: string | null
          value_after?: Json | null
          value_before?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_control_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_feature_flags: {
        Row: {
          audience: string[]
          audit_required: boolean
          blocked_audiences: string[]
          category: string
          default_value: Json
          key: string
          label: string
          manual_override: Json | null
          message_key: string | null
          schedules: Json
          supports_audience: boolean
          supports_schedule: boolean
          updated_at: string
          updated_by: string | null
          value_type: string
        }
        Insert: {
          audience?: string[]
          audit_required?: boolean
          blocked_audiences?: string[]
          category: string
          default_value: Json
          key: string
          label: string
          manual_override?: Json | null
          message_key?: string | null
          schedules?: Json
          supports_audience?: boolean
          supports_schedule?: boolean
          updated_at?: string
          updated_by?: string | null
          value_type: string
        }
        Update: {
          audience?: string[]
          audit_required?: boolean
          blocked_audiences?: string[]
          category?: string
          default_value?: Json
          key?: string
          label?: string
          manual_override?: Json | null
          message_key?: string | null
          schedules?: Json
          supports_audience?: boolean
          supports_schedule?: boolean
          updated_at?: string
          updated_by?: string | null
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pois: {
        Row: {
          address: string | null
          affiliate: Json | null
          ai_reliability: string | null
          category: string | null
          city_id: string | null
          contact_info: Json | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          created_by: string | null
          date_added: string | null
          description: string | null
          fts: unknown
          id: string
          image_credit: string | null
          image_is_placeholder: boolean | null
          image_license: string | null
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          is_sponsored: boolean | null
          last_verified: string | null
          link_metadata: Json | null
          location: unknown
          name: string
          opening_hours: Json | null
          phone: string | null
          price_level: number | null
          rating: number | null
          showcase_expiry: string | null
          status: string | null
          sub_category: string | null
          suggested_by: string | null
          tier: string | null
          tourism_interest: string | null
          updated_at: string | null
          updated_by: string | null
          visit_duration: string | null
          votes: number | null
          website: string | null
          wikimedia_public_enabled: boolean
        }
        Insert: {
          address?: string | null
          affiliate?: Json | null
          ai_reliability?: string | null
          category?: string | null
          city_id?: string | null
          contact_info?: Json | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          created_by?: string | null
          date_added?: string | null
          description?: string | null
          fts?: unknown
          id: string
          image_credit?: string | null
          image_is_placeholder?: boolean | null
          image_license?: string | null
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          is_sponsored?: boolean | null
          last_verified?: string | null
          link_metadata?: Json | null
          location?: unknown
          name: string
          opening_hours?: Json | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          showcase_expiry?: string | null
          status?: string | null
          sub_category?: string | null
          suggested_by?: string | null
          tier?: string | null
          tourism_interest?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visit_duration?: string | null
          votes?: number | null
          website?: string | null
          wikimedia_public_enabled?: boolean
        }
        Update: {
          address?: string | null
          affiliate?: Json | null
          ai_reliability?: string | null
          category?: string | null
          city_id?: string | null
          contact_info?: Json | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          created_by?: string | null
          date_added?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          image_credit?: string | null
          image_is_placeholder?: boolean | null
          image_license?: string | null
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          is_sponsored?: boolean | null
          last_verified?: string | null
          link_metadata?: Json | null
          location?: unknown
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          showcase_expiry?: string | null
          status?: string | null
          sub_category?: string | null
          suggested_by?: string | null
          tier?: string | null
          tourism_interest?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visit_duration?: string | null
          votes?: number | null
          website?: string | null
          wikimedia_public_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      pois_staging: {
        Row: {
          address: string | null
          ai_rating: string | null
          city_id: string
          coords_lat: number
          coords_lng: number
          created_at: string | null
          id: string
          name: string
          orphan_city_tag: string | null
          osm_id: string
          processing_status: string
          raw_category: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          ai_rating?: string | null
          city_id: string
          coords_lat: number
          coords_lng: number
          created_at?: string | null
          id?: string
          name: string
          orphan_city_tag?: string | null
          osm_id: string
          processing_status?: string
          raw_category?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          ai_rating?: string | null
          city_id?: string
          coords_lat?: number
          coords_lng?: number
          created_at?: string | null
          id?: string
          name?: string
          orphan_city_tag?: string | null
          osm_id?: string
          processing_status?: string
          raw_category?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pois_staging_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_staging_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "pois_staging_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      pricing_versions: {
        Row: {
          activated_at: string | null
          ai_limits: Json | null
          campaign_id: string | null
          created_at: string
          currency: string
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          plan_id: string
          price: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          activated_at?: string | null
          ai_limits?: Json | null
          campaign_id?: string | null
          created_at?: string
          currency?: string
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_id: string
          price: number
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          activated_at?: string | null
          ai_limits?: Json | null
          campaign_id?: string | null
          created_at?: string
          currency?: string
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_id?: string
          price?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_versions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          collaboration_notification_preferences: Json
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_test_account: boolean | null
          last_access: string | null
          name: string | null
          nation: string | null
          referral_code: string | null
          referred_by: string | null
          role: string | null
          slug: string | null
          status: string | null
          unlocked_rewards: string[] | null
          vat_number: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          collaboration_notification_preferences?: Json
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_test_account?: boolean | null
          last_access?: string | null
          name?: string | null
          nation?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          slug?: string | null
          status?: string | null
          unlocked_rewards?: string[] | null
          vat_number?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          collaboration_notification_preferences?: Json
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_test_account?: boolean | null
          last_access?: string | null
          name?: string | null
          nation?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          slug?: string | null
          status?: string | null
          unlocked_rewards?: string[] | null
          vat_number?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          id: string
          name: string
          nation_id: string | null
          slug: string
        }
        Insert: {
          id?: string
          name: string
          nation_id?: string | null
          slug: string
        }
        Update: {
          id?: string
          name?: string
          nation_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_nation_id_fkey"
            columns: ["nation_id"]
            isOneToOne: false
            referencedRelation: "active_nations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regions_nation_id_fkey"
            columns: ["nation_id"]
            isOneToOne: false
            referencedRelation: "nations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_invites: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          responded_at: string | null
          role: Database["public"]["Enums"]["collaborative_member_role"]
          shared_resource_id: string
          status: Database["public"]["Enums"]["resource_invite_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          responded_at?: string | null
          role: Database["public"]["Enums"]["collaborative_member_role"]
          shared_resource_id: string
          status?: Database["public"]["Enums"]["resource_invite_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          responded_at?: string | null
          role?: Database["public"]["Enums"]["collaborative_member_role"]
          shared_resource_id?: string
          status?: Database["public"]["Enums"]["resource_invite_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_invites_shared_resource_id_fkey"
            columns: ["shared_resource_id"]
            isOneToOne: false
            referencedRelation: "shared_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      review_rating_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          average_rating: number
          created_at: string
          id: string
          poi_id: string
          reviews_count: number
          status: string
          threshold: number
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          average_rating: number
          created_at?: string
          id?: string
          poi_id: string
          reviews_count?: number
          status?: string
          threshold: number
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          average_rating?: number
          created_at?: string
          id?: string
          poi_id?: string
          reviews_count?: number
          status?: string
          threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_rating_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved_at: string | null
          author_id: string | null
          author_name: string
          comment: string
          created_at: string | null
          criteria: Json | null
          id: string
          itinerary_id: string | null
          poi_id: string | null
          rating: number
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          author_id?: string | null
          author_name: string
          comment: string
          created_at?: string | null
          criteria?: Json | null
          id?: string
          itinerary_id?: string | null
          poi_id?: string | null
          rating: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          author_id?: string | null
          author_name?: string
          comment?: string
          created_at?: string | null
          criteria?: Json | null
          id?: string
          itinerary_id?: string | null
          poi_id?: string | null
          rating?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_catalog: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          required_level: number | null
          title: string
          type: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          required_level?: number | null
          title: string
          type?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          required_level?: number | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      shared_resource_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["collaborative_member_role"]
          shared_resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["collaborative_member_role"]
          shared_resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["collaborative_member_role"]
          shared_resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_resource_members_shared_resource_id_fkey"
            columns: ["shared_resource_id"]
            isOneToOne: false
            referencedRelation: "shared_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_resource_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_resources: {
        Row: {
          created_at: string
          edit_locked_at: string | null
          edit_locked_by: string | null
          id: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          owner_id: string
          resource_id: string
          sharing_mode: Database["public"]["Enums"]["sharing_mode"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          edit_locked_at?: string | null
          edit_locked_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          owner_id: string
          resource_id: string
          sharing_mode?: Database["public"]["Enums"]["sharing_mode"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          edit_locked_at?: string | null
          edit_locked_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["shared_resource_kind"]
          owner_id?: string
          resource_id?: string
          sharing_mode?: Database["public"]["Enums"]["sharing_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_resources_edit_locked_by_fkey"
            columns: ["edit_locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_resources_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
          shipping_mode: string | null
          shop_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          image_url: string
          name: string
          price?: number
          shipping_mode?: string | null
          shop_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          price?: number
          shipping_mode?: string | null
          shop_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          ai_credits: number | null
          badge: string | null
          category: string
          city_id: string
          coords_lat: number | null
          coords_lng: number | null
          created_at: string
          description: string | null
          email: string | null
          founded_year: number | null
          gallery: string[] | null
          id: string
          image_is_placeholder: boolean | null
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          is_tipico: boolean | null
          level: string | null
          likes: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          payment_info: string | null
          phone: string | null
          rating: number | null
          reviews: Json | null
          reviews_count: number | null
          shipping_info: string | null
          short_bio: string | null
          slug: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_credits?: number | null
          badge?: string | null
          category: string
          city_id: string
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          gallery?: string[] | null
          id: string
          image_is_placeholder?: boolean | null
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          is_tipico?: boolean | null
          level?: string | null
          likes?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          payment_info?: string | null
          phone?: string | null
          rating?: number | null
          reviews?: Json | null
          reviews_count?: number | null
          shipping_info?: string | null
          short_bio?: string | null
          slug?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_credits?: number | null
          badge?: string | null
          category?: string
          city_id?: string
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          gallery?: string[] | null
          id?: string
          image_is_placeholder?: boolean | null
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          is_tipico?: boolean | null
          level?: string | null
          likes?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          payment_info?: string | null
          phone?: string | null
          rating?: number | null
          reviews?: Json | null
          reviews_count?: number | null
          shipping_info?: string | null
          short_bio?: string | null
          slug?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_templates: {
        Row: {
          bg_url: string
          created_at: string | null
          id: string
          is_active: boolean | null
          layout_config: Json
          name: string
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          bg_url: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json
          name: string
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          bg_url?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json
          name?: string
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sponsor_admin_audit_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          request_id: string | null
          sponsor_id: string | null
          summary: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          request_id?: string | null
          sponsor_id?: string | null
          summary: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          request_id?: string | null
          sponsor_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_admin_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_admin_audit_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sponsor_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_admin_audit_events_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_messages: {
        Row: {
          created_at: string | null
          direction: Database["public"]["Enums"]["sponsor_message_direction"]
          id: string
          is_read: boolean | null
          message: string
          partner_id: string | null
          request_id: string | null
          sender_id: string | null
          sponsor_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: Database["public"]["Enums"]["sponsor_message_direction"]
          id?: string
          is_read?: boolean | null
          message: string
          partner_id?: string | null
          request_id?: string | null
          sender_id?: string | null
          sponsor_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: Database["public"]["Enums"]["sponsor_message_direction"]
          id?: string
          is_read?: boolean | null
          message?: string
          partner_id?: string | null
          request_id?: string | null
          sender_id?: string | null
          sponsor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_messages_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sponsor_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_messages_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_requests: {
        Row: {
          address: string | null
          admin_notes: string | null
          admin_notes_last_updated: string | null
          city_id: string | null
          company_name: string | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          description: string | null
          id: string
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          languages: string[] | null
          license_number: string | null
          message: string | null
          owner_id: string | null
          partner_logs: Json | null
          poi_category: string | null
          poi_sub_category: string | null
          pricing_version_id: string | null
          profile_id: string | null
          rejection_reason: string | null
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          specialties: string[] | null
          status: string | null
          status_changed_at: string | null
          tier: string | null
          type: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          admin_notes_last_updated?: string | null
          city_id?: string | null
          company_name?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          languages?: string[] | null
          license_number?: string | null
          message?: string | null
          owner_id?: string | null
          partner_logs?: Json | null
          poi_category?: string | null
          poi_sub_category?: string | null
          pricing_version_id?: string | null
          profile_id?: string | null
          rejection_reason?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          specialties?: string[] | null
          status?: string | null
          status_changed_at?: string | null
          tier?: string | null
          type?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          admin_notes_last_updated?: string | null
          city_id?: string | null
          company_name?: string | null
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_status?: Database["public"]["Enums"]["media_status"]
          image_url?: string | null
          languages?: string[] | null
          license_number?: string | null
          message?: string | null
          owner_id?: string | null
          partner_logs?: Json | null
          poi_category?: string | null
          poi_sub_category?: string | null
          pricing_version_id?: string | null
          profile_id?: string | null
          rejection_reason?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          specialties?: string[] | null
          status?: string | null
          status_changed_at?: string | null
          tier?: string | null
          type?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "sponsor_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "sponsor_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_requests_pricing_version_id_fkey"
            columns: ["pricing_version_id"]
            isOneToOne: false
            referencedRelation: "pricing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          address: string | null
          admin_notes: string | null
          admin_notes_last_updated: string | null
          amount: number | null
          city_id: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          end_date: string
          guide_id: string | null
          id: string
          invoice_number: string | null
          last_city_id: string | null
          operator_id: string | null
          owner_id: string | null
          partner_logs: Json | null
          phone: string | null
          plan: string | null
          poi_category: string | null
          poi_id: string | null
          poi_sub_category: string | null
          pricing_version_id: string | null
          profile_id: string | null
          rejection_reason: string | null
          request_id: string | null
          shop_id: string | null
          start_date: string
          status: string | null
          tier: string | null
          type: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          admin_notes_last_updated?: string | null
          amount?: number | null
          city_id?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          end_date: string
          guide_id?: string | null
          id?: string
          invoice_number?: string | null
          last_city_id?: string | null
          operator_id?: string | null
          owner_id?: string | null
          partner_logs?: Json | null
          phone?: string | null
          plan?: string | null
          poi_category?: string | null
          poi_id?: string | null
          poi_sub_category?: string | null
          pricing_version_id?: string | null
          profile_id?: string | null
          rejection_reason?: string | null
          request_id?: string | null
          shop_id?: string | null
          start_date: string
          status?: string | null
          tier?: string | null
          type?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          admin_notes_last_updated?: string | null
          amount?: number | null
          city_id?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          end_date?: string
          guide_id?: string | null
          id?: string
          invoice_number?: string | null
          last_city_id?: string | null
          operator_id?: string | null
          owner_id?: string | null
          partner_logs?: Json | null
          phone?: string | null
          plan?: string | null
          poi_category?: string | null
          poi_id?: string | null
          poi_sub_category?: string | null
          pricing_version_id?: string | null
          profile_id?: string | null
          rejection_reason?: string | null
          request_id?: string | null
          shop_id?: string | null
          start_date?: string
          status?: string | null
          tier?: string | null
          type?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "sponsors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "sponsors_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "city_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_last_city_id_fkey"
            columns: ["last_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_last_city_id_fkey"
            columns: ["last_city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "sponsors_last_city_id_fkey"
            columns: ["last_city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "sponsors_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "city_tour_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "obs_poi_anomalies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "poi_quality_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_pricing_version_id_fkey"
            columns: ["pricing_version_id"]
            isOneToOne: false
            referencedRelation: "pricing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sponsor_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      static_pages: {
        Row: {
          content_html: string | null
          slug: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content_html?: string | null
          slug: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content_html?: string | null
          slug?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          campaign_id: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          currency_paid: string
          current_period_end: string | null
          current_period_start: string | null
          end_date: string
          id: string
          price_paid: number
          pricing_version_id: string
          sponsor_id: string | null
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean
          campaign_id?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          currency_paid?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date: string
          id?: string
          price_paid: number
          pricing_version_id: string
          sponsor_id?: string | null
          start_date: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean
          campaign_id?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          currency_paid?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string
          id?: string
          price_paid?: number
          pricing_version_id?: string
          sponsor_id?: string | null
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_pricing_version_id_fkey"
            columns: ["pricing_version_id"]
            isOneToOne: false
            referencedRelation: "pricing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          admin_notes: string | null
          city_id: string | null
          city_name: string | null
          created_at: string | null
          details_json: Json | null
          id: string
          poi_id: string | null
          status: string | null
          type: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          city_id?: string | null
          city_name?: string | null
          created_at?: string | null
          details_json?: Json | null
          id?: string
          poi_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          city_id?: string | null
          city_name?: string | null
          created_at?: string | null
          details_json?: Json | null
          id?: string
          poi_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      suitcase_items: {
        Row: {
          accepted_from_ai: boolean
          affiliate_tags: string[] | null
          ai_suggestion_context: string | null
          category: string
          created_at: string | null
          id: string
          is_ai_suggestion: boolean | null
          is_checked: boolean | null
          name: string
          poi_triggers: string[] | null
          quantity: number | null
          suggested_at: string | null
          suitcase_id: string
        }
        Insert: {
          accepted_from_ai?: boolean
          affiliate_tags?: string[] | null
          ai_suggestion_context?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_ai_suggestion?: boolean | null
          is_checked?: boolean | null
          name: string
          poi_triggers?: string[] | null
          quantity?: number | null
          suggested_at?: string | null
          suitcase_id: string
        }
        Update: {
          accepted_from_ai?: boolean
          affiliate_tags?: string[] | null
          ai_suggestion_context?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_ai_suggestion?: boolean | null
          is_checked?: boolean | null
          name?: string
          poi_triggers?: string[] | null
          quantity?: number | null
          suggested_at?: string | null
          suitcase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_items_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcase_rejections: {
        Row: {
          ai_suggestion_context: string | null
          category: string
          created_at: string
          id: string
          name: string
          suitcase_id: string
        }
        Insert: {
          ai_suggestion_context?: string | null
          category: string
          created_at?: string
          id?: string
          name: string
          suitcase_id: string
        }
        Update: {
          ai_suggestion_context?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
          suitcase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_rejections_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcase_template_affiliates: {
        Row: {
          affiliate_product_id: string | null
          id: string
          priority: number | null
          template_id: string | null
        }
        Insert: {
          affiliate_product_id?: string | null
          id?: string
          priority?: number | null
          template_id?: string | null
        }
        Update: {
          affiliate_product_id?: string | null
          id?: string
          priority?: number | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_template_affiliates_affiliate_product_id_fkey"
            columns: ["affiliate_product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suitcase_template_affiliates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcases: {
        Row: {
          created_at: string | null
          custom_categories: Json
          icon: string | null
          id: string
          is_user_template: boolean
          last_modified_by: string | null
          source_template_id: string | null
          title: string
          ui_state: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_categories?: Json
          icon?: string | null
          id?: string
          is_user_template?: boolean
          last_modified_by?: string | null
          source_template_id?: string | null
          title: string
          ui_state?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_categories?: Json
          icon?: string | null
          id?: string
          is_user_template?: boolean
          last_modified_by?: string | null
          source_template_id?: string | null
          title?: string
          ui_state?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suitcases_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suitcases_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suitcases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_messages: {
        Row: {
          body_template: string | null
          device_target: string | null
          key: string
          label: string
          title_template: string | null
          type: string | null
          ui_config: Json | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body_template?: string | null
          device_target?: string | null
          key: string
          label: string
          title_template?: string | null
          type?: string | null
          ui_config?: Json | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body_template?: string | null
          device_target?: string | null
          key?: string
          label?: string
          title_template?: string | null
          type?: string | null
          ui_config?: Json | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      taxonomy_mappings: {
        Row: {
          context: string
          created_at: string | null
          id: string
          input_term: string
          target_category: string
          target_subcategory: string
          target_tab: string | null
          updated_at: string | null
        }
        Insert: {
          context?: string
          created_at?: string | null
          id?: string
          input_term: string
          target_category: string
          target_subcategory: string
          target_tab?: string | null
          updated_at?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          id?: string
          input_term?: string
          target_category?: string
          target_subcategory?: string
          target_tab?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tourist_zones: {
        Row: {
          admin_region: string
          ai_suggestions: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          region_id: string | null
          slug: string | null
        }
        Insert: {
          admin_region?: string
          ai_suggestions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          region_id?: string | null
          slug?: string | null
        }
        Update: {
          admin_region?: string
          ai_suggestions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          region_id?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tourist_zones_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "active_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourist_zones_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_credits: {
        Row: {
          created_at: string | null
          expires_at: string | null
          flash_remaining: number | null
          id: string
          metadata: Json | null
          pro_remaining: number | null
          source: Database["public"]["Enums"]["ai_credit_source"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          flash_remaining?: number | null
          id?: string
          metadata?: Json | null
          pro_remaining?: number | null
          source?: Database["public"]["Enums"]["ai_credit_source"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          flash_remaining?: number | null
          id?: string
          metadata?: Json | null
          pro_remaining?: number | null
          source?: Database["public"]["Enums"]["ai_credit_source"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_kind?: string
          user_id?: string
        }
        Relationships: []
      }
      user_friend_requests: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["friend_request_status"]
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "user_friend_requests_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friend_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          target_id?: string
          target_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link_data: Json | null
          message: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_data?: Json | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_data?: Json | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          code: string
          date_claimed: string | null
          date_used: string | null
          instance_id: string
          reward_category: string | null
          reward_id: string | null
          reward_title: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          date_claimed?: string | null
          date_used?: string | null
          instance_id?: string
          reward_category?: string | null
          reward_id?: string | null
          reward_title?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          date_claimed?: string | null
          date_used?: string | null
          instance_id?: string
          reward_category?: string | null
          reward_id?: string | null
          reward_title?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_template_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          priority: number
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: number
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: number
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_template_preferences_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_visited_cities: {
        Row: {
          city_id: string
          first_seen_at: string
          source: string
          user_id: string
        }
        Insert: {
          city_id: string
          first_seen_at?: string
          source?: string
          user_id: string
        }
        Update: {
          city_id?: string
          first_seen_at?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_visited_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_visited_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "user_visited_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      viaggi: {
        Row: {
          active_diary_id: string | null
          cover_image: string | null
          created_at: string
          destination: string | null
          id: string
          metadata: Json
          period_end: string | null
          period_start: string | null
          ricordami_enabled: boolean
          ricordami_interval_months: number
          ricordami_next_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_diary_id?: string | null
          cover_image?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          metadata?: Json
          period_end?: string | null
          period_start?: string | null
          ricordami_enabled?: boolean
          ricordami_interval_months?: number
          ricordami_next_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_diary_id?: string | null
          cover_image?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          metadata?: Json
          period_end?: string | null
          period_start?: string | null
          ricordami_enabled?: boolean
          ricordami_interval_months?: number
          ricordami_next_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggi_active_diary_id_fkey"
            columns: ["active_diary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggi_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viaggio_attachments: {
        Row: {
          category: string
          created_at: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          user_id: string
          viaggio_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes?: number
          storage_path: string
          user_id: string
          viaggio_id: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          user_id?: string
          viaggio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggio_attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_attachments_viaggio_id_fkey"
            columns: ["viaggio_id"]
            isOneToOne: false
            referencedRelation: "viaggi"
            referencedColumns: ["id"]
          },
        ]
      }
      viaggio_ricordi_day_notes: {
        Row: {
          body: string
          day_key: string
          id: string
          updated_at: string
          user_id: string
          viaggio_id: string
        }
        Insert: {
          body?: string
          day_key: string
          id?: string
          updated_at?: string
          user_id: string
          viaggio_id: string
        }
        Update: {
          body?: string
          day_key?: string
          id?: string
          updated_at?: string
          user_id?: string
          viaggio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggio_ricordi_day_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_ricordi_day_notes_viaggio_id_fkey"
            columns: ["viaggio_id"]
            isOneToOne: false
            referencedRelation: "viaggi"
            referencedColumns: ["id"]
          },
        ]
      }
      viaggio_ricordi_media: {
        Row: {
          coords_lat: number | null
          coords_lng: number | null
          created_at: string
          day_key: string
          id: string
          kind: string
          mime_type: string
          size_bytes: number
          storage_path: string
          title: string | null
          user_id: string
          viaggio_id: string
        }
        Insert: {
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string
          day_key: string
          id?: string
          kind: string
          mime_type: string
          size_bytes?: number
          storage_path: string
          title?: string | null
          user_id: string
          viaggio_id: string
        }
        Update: {
          coords_lat?: number | null
          coords_lng?: number | null
          created_at?: string
          day_key?: string
          id?: string
          kind?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          title?: string | null
          user_id?: string
          viaggio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggio_ricordi_media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_ricordi_media_viaggio_id_fkey"
            columns: ["viaggio_id"]
            isOneToOne: false
            referencedRelation: "viaggi"
            referencedColumns: ["id"]
          },
        ]
      }
      viaggio_ricordi_media_day_links: {
        Row: {
          created_at: string
          day_key: string
          media_id: string
        }
        Insert: {
          created_at?: string
          day_key: string
          media_id: string
        }
        Update: {
          created_at?: string
          day_key?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggio_ricordi_media_day_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "viaggio_ricordi_media"
            referencedColumns: ["id"]
          },
        ]
      }
      viaggio_riepilogo_annotations: {
        Row: {
          by_day: Json
          general: Json
          updated_at: string
          user_id: string
          viaggio_id: string
        }
        Insert: {
          by_day?: Json
          general?: Json
          updated_at?: string
          user_id: string
          viaggio_id: string
        }
        Update: {
          by_day?: Json
          general?: Json
          updated_at?: string
          user_id?: string
          viaggio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggio_riepilogo_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_riepilogo_annotations_viaggio_id_fkey"
            columns: ["viaggio_id"]
            isOneToOne: true
            referencedRelation: "viaggi"
            referencedColumns: ["id"]
          },
        ]
      }
      viaggio_roadbook_artifacts: {
        Row: {
          created_at: string
          id: string
          name: string
          snapshot: Json
          source_diary_id: string
          user_id: string
          viaggio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          snapshot?: Json
          source_diary_id: string
          user_id: string
          viaggio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          snapshot?: Json
          source_diary_id?: string
          user_id?: string
          viaggio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggio_roadbook_artifacts_source_diary_id_fkey"
            columns: ["source_diary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_roadbook_artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_roadbook_artifacts_viaggio_id_fkey"
            columns: ["viaggio_id"]
            isOneToOne: false
            referencedRelation: "viaggi"
            referencedColumns: ["id"]
          },
        ]
      }
      viaggio_suitcases: {
        Row: {
          created_at: string
          id: string
          suitcase_id: string
          user_id: string | null
          viaggio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suitcase_id: string
          user_id?: string | null
          viaggio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suitcase_id?: string
          user_id?: string | null
          viaggio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viaggio_suitcases_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_suitcases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viaggio_suitcases_viaggio_id_fkey"
            columns: ["viaggio_id"]
            isOneToOne: false
            referencedRelation: "viaggi"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_attachments: {
        Row: {
          category: Database["public"]["Enums"]["workspace_attachment_category"]
          created_at: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["workspace_attachment_category"]
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["workspace_attachment_category"]
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invite_permissions: {
        Row: {
          access_level: Database["public"]["Enums"]["workspace_resource_access"]
          id: string
          invite_id: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          resource_id: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["workspace_resource_access"]
          id?: string
          invite_id: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          resource_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["workspace_resource_access"]
          id?: string
          invite_id?: string
          kind?: Database["public"]["Enums"]["shared_resource_kind"]
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invite_permissions_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "workspace_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["resource_invite_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["resource_invite_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["resource_invite_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_resource_permissions: {
        Row: {
          access_level: Database["public"]["Enums"]["workspace_resource_access"]
          created_at: string
          id: string
          updated_at: string
          user_id: string
          workspace_id: string
          workspace_resource_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["workspace_resource_access"]
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          workspace_id: string
          workspace_resource_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["workspace_resource_access"]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
          workspace_resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_resource_permissions_resource_in_workspace_fkey"
            columns: ["workspace_id", "workspace_resource_id"]
            isOneToOne: false
            referencedRelation: "workspace_resources"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "workspace_resource_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_resource_permissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_resource_permissions_workspace_resource_id_fkey"
            columns: ["workspace_resource_id"]
            isOneToOne: false
            referencedRelation: "workspace_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_resources: {
        Row: {
          added_by: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          resource_id: string
          workspace_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          resource_id: string
          workspace_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["shared_resource_kind"]
          resource_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_resources_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_resources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_actions: {
        Row: {
          action_key: string
          description: string | null
          icon: string | null
          label: string
          updated_at: string | null
          xp_amount: number
        }
        Insert: {
          action_key: string
          description?: string | null
          icon?: string | null
          label: string
          updated_at?: string | null
          xp_amount?: number
        }
        Update: {
          action_key?: string
          description?: string | null
          icon?: string | null
          label?: string
          updated_at?: string | null
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      active_continents: {
        Row: {
          id: string | null
          name: string | null
          slug: string | null
        }
        Relationships: []
      }
      active_nations: {
        Row: {
          continent_id: string | null
          id: string | null
          name: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nations_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "active_continents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nations_continent_id_fkey"
            columns: ["continent_id"]
            isOneToOne: false
            referencedRelation: "continents"
            referencedColumns: ["id"]
          },
        ]
      }
      active_regions: {
        Row: {
          id: string | null
          name: string | null
          nation_id: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_nation_id_fkey"
            columns: ["nation_id"]
            isOneToOne: false
            referencedRelation: "active_nations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regions_nation_id_fkey"
            columns: ["nation_id"]
            isOneToOne: false
            referencedRelation: "nations"
            referencedColumns: ["id"]
          },
        ]
      }
      active_tourist_zones: {
        Row: {
          admin_region: string | null
          ai_suggestions: Json | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          region_id: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tourist_zones_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "active_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourist_zones_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets_with_usage_count: {
        Row: {
          active_usage_count: number | null
          archived_at: string | null
          asset_status: Database["public"]["Enums"]["image_asset_status"] | null
          attribution_text: string | null
          author_name: string | null
          content_hash: string | null
          copyright_notice: string | null
          created_at: string | null
          generated_by_ai: boolean | null
          id: string | null
          is_placeholder: boolean | null
          license_code: string | null
          license_url: string | null
          license_verified_at: string | null
          metadata: Json | null
          origin_type: string | null
          retrieved_at: string | null
          rights_holder: string | null
          source_ref: string | null
          source_url: string | null
          storage_bucket: string | null
          storage_path: string | null
          total_assignment_count: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      obs_city_quality_metrics: {
        Row: {
          avg_poi_rating: number | null
          city_id: string | null
          city_name: string | null
          city_status: string | null
          city_zone: string | null
          estimated_visitors: number | null
          photo_coverage_pct: number | null
          text_coverage_pct: number | null
          total_pois: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cities_registry"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_poi_anomalies: {
        Row: {
          anomaly_type: string | null
          category: string | null
          city_id: string | null
          city_name: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      poi_quality_analysis: {
        Row: {
          category: string | null
          city_id: string | null
          completeness_score: number | null
          id: string | null
          is_missing_coords: boolean | null
          is_missing_image: boolean | null
          is_suspicious_hours: boolean | null
          name: string | null
          sub_category: string | null
        }
        Insert: {
          category?: string | null
          city_id?: string | null
          completeness_score?: never
          id?: string | null
          is_missing_coords?: never
          is_missing_image?: never
          is_suspicious_hours?: never
          name?: string | null
          sub_category?: string | null
        }
        Update: {
          category?: string | null
          city_id?: string | null
          completeness_score?: never
          id?: string | null
          is_missing_coords?: never
          is_missing_image?: never
          is_suspicious_hours?: never
          name?: string | null
          sub_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "obs_city_quality_metrics"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "pois_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "seo_city_routes"
            referencedColumns: ["city_id"]
          },
        ]
      }
      seo_city_routes: {
        Row: {
          admin_region: string | null
          city_id: string | null
          city_name: string | null
          city_slug: string | null
          city_types: string[] | null
          classification_explainability: Json | null
          continent: string | null
          continent_slug: string | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          description: string | null
          generation_logs: Json | null
          hero_image: string | null
          home_order: number | null
          image_url: string | null
          is_featured: boolean | null
          nation: string | null
          nation_slug: string | null
          rating: number | null
          region_id: string | null
          region_slug: string | null
          special_badge: string | null
          status: string | null
          subtitle: string | null
          tourist_zone_id: string | null
          updated_at: string | null
          visitors: number | null
          zone_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "active_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_tourist_zone_id_fkey"
            columns: ["tourist_zone_id"]
            isOneToOne: false
            referencedRelation: "active_tourist_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_tourist_zone_id_fkey"
            columns: ["tourist_zone_id"]
            isOneToOne: false
            referencedRelation: "tourist_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cities_registry"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities_registry"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_famous_person_photo_suggestion: {
        Args: { p_admin_notes?: string; p_suggestion_id: string }
        Returns: Json
      }
      accept_famous_person_suggestion: {
        Args: { p_admin_notes?: string; p_suggestion_id: string }
        Returns: string
      }
      activate_premium_user: {
        Args: {
          p_campaign_id?: string
          p_pricing_version_id: string
          p_stripe_customer_id?: string
          p_stripe_subscription_id?: string
          p_user_id: string
        }
        Returns: string
      }
      activate_sponsor_from_request: {
        Args: {
          p_amount: number
          p_invoice_number: string
          p_pricing_version_id: string
          p_request_id: string
        }
        Returns: string
      }
      activate_sponsor_with_resource: {
        Args: {
          p_pricing_version_id: string
          p_request_id: string
          p_sponsor_id: string
        }
        Returns: string
      }
      add_community_reply: {
        Args: { p_parent_reply_id?: string; p_post_id: string; p_text: string }
        Returns: {
          author_id: string
          author_name: string
          author_role: string | null
          created_at: string
          id: string
          parent_reply_id: string | null
          post_id: string
          text: string
        }
        SetofOptions: {
          from: "*"
          to: "community_replies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_user_xp: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      append_entity_image_history: {
        Args: {
          p_admin_override?: boolean
          p_admin_rationale?: string
          p_ai_rationale?: string
          p_assignment_id?: string
          p_city_id?: string
          p_entity_id?: string
          p_entity_type?: string
          p_event_type: string
          p_media_asset_id?: string
          p_metadata?: Json
          p_new_asset_status?: Database["public"]["Enums"]["image_asset_status"]
          p_new_assignment_status?: string
          p_previous_asset_status?: Database["public"]["Enums"]["image_asset_status"]
          p_previous_assignment_status?: string
          p_replaced_by_assignment_id?: string
        }
        Returns: string
      }
      append_entity_image_history_trusted: {
        Args: {
          p_admin_override?: boolean
          p_admin_rationale?: string
          p_ai_rationale?: string
          p_assignment_id?: string
          p_city_id?: string
          p_entity_id?: string
          p_entity_type?: string
          p_event_type: string
          p_media_asset_id?: string
          p_metadata?: Json
          p_new_asset_status?: Database["public"]["Enums"]["image_asset_status"]
          p_new_assignment_status?: string
          p_previous_asset_status?: Database["public"]["Enums"]["image_asset_status"]
          p_previous_assignment_status?: string
          p_replaced_by_assignment_id?: string
        }
        Returns: string
      }
      append_sponsor_partner_log: {
        Args: { p_log_type?: string; p_message: string; p_sponsor_id: string }
        Returns: undefined
      }
      approve_sponsor_request: {
        Args: { p_request_id: string }
        Returns: {
          address: string | null
          admin_notes: string | null
          admin_notes_last_updated: string | null
          city_id: string | null
          company_name: string | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          description: string | null
          id: string
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          languages: string[] | null
          license_number: string | null
          message: string | null
          owner_id: string | null
          partner_logs: Json | null
          poi_category: string | null
          poi_sub_category: string | null
          pricing_version_id: string | null
          profile_id: string | null
          rejection_reason: string | null
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          specialties: string[] | null
          status: string | null
          status_changed_at: string | null
          tier: string | null
          type: string | null
          vat_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sponsor_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      block_famous_person_photo_report_and_clear: {
        Args: {
          p_admin_notes?: string
          p_person_id: string
          p_report_id: string
        }
        Returns: Json
      }
      can_access_collaborative_diary: {
        Args: { p_itinerary_id: string; p_require_collaborator?: boolean }
        Returns: boolean
      }
      can_access_collaborative_suitcase: {
        Args: { p_require_collaborator?: boolean; p_suitcase_id: string }
        Returns: boolean
      }
      can_current_owner_manage_shared_member: {
        Args: { p_member_user_id: string; p_shared_resource_id: string }
        Returns: boolean
      }
      can_manage_shop: { Args: { p_shop_id: string }; Returns: boolean }
      can_manage_sponsor: { Args: { p_sponsor_id: string }; Returns: boolean }
      cancel_sponsor_contract: {
        Args: { p_reason: string; p_sponsor_id: string }
        Returns: {
          address: string | null
          admin_notes: string | null
          admin_notes_last_updated: string | null
          amount: number | null
          city_id: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          end_date: string
          guide_id: string | null
          id: string
          invoice_number: string | null
          last_city_id: string | null
          operator_id: string | null
          owner_id: string | null
          partner_logs: Json | null
          phone: string | null
          plan: string | null
          poi_category: string | null
          poi_id: string | null
          poi_sub_category: string | null
          pricing_version_id: string | null
          profile_id: string | null
          rejection_reason: string | null
          request_id: string | null
          shop_id: string | null
          start_date: string
          status: string | null
          tier: string | null
          type: string | null
          updated_at: string | null
          vat_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sponsors"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      capture_report_evidence: {
        Args: {
          p_content_hash: string
          p_report_id: string
          p_storage_bucket: string
          p_storage_path: string
        }
        Returns: Json
      }
      check_and_expire_subscriptions: { Args: never; Returns: undefined }
      check_and_increment_ai_usage: {
        Args: {
          p_cost: number
          p_model_type: string
          p_role: string
          p_session_id: string
          p_user_id: string
        }
        Returns: Json
      }
      clear_platform_control_audit: { Args: never; Returns: number }
      clone_suitcase: {
        Args: { p_template_id: string; p_title?: string; p_user_id: string }
        Returns: string
      }
      clone_suitcase_master: {
        Args: { p_new_title?: string; p_source_id: string }
        Returns: string
      }
      collaboration_edit_lock_timeout_interval: { Args: never; Returns: string }
      complete_ai_verify_admin_decision: {
        Args: {
          p_admin_rationale: string
          p_decision: string
          p_media_asset_id: string
          p_override_step_code?: string
        }
        Returns: Database["public"]["Enums"]["image_asset_status"]
      }
      consume_ai_credits:
        | {
            Args: { p_feature: string; p_model_type: string; p_user_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_feature: string
              p_guest_id?: string
              p_model_type: string
              p_user_id: string
            }
            Returns: Json
          }
      create_content_report_group: { Args: { p_payload: Json }; Returns: Json }
      current_user_can_access_collaborative_resource_entity: {
        Args: {
          p_kind: Database["public"]["Enums"]["shared_resource_kind"]
          p_require_collaborator: boolean
          p_resource_id: string
        }
        Returns: boolean
      }
      current_user_can_edit_shared_diary_resource: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      current_user_can_edit_shared_resource: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      current_user_can_view_shared_diary_resource: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      current_user_can_view_shared_resource: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      current_user_is_shared_resource_member: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      current_user_is_shared_resource_owner: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      delete_city_patron_gallery_photo_with_assignment: {
        Args: { p_gallery_photo_id: string }
        Returns: string
      }
      delete_city_person_with_image_cleanup: {
        Args: { p_person_id: string }
        Returns: string
      }
      delete_platform_control_audit_event: {
        Args: { p_id: string }
        Returns: boolean
      }
      delete_poi_with_image_cleanup: {
        Args: { p_poi_id: string }
        Returns: string
      }
      delete_sponsor_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      ensure_current_image_assignment: {
        Args: {
          p_assignment_role?: string
          p_city_id: string
          p_entity_id: string
          p_entity_type: string
          p_image_url?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      ensure_media_asset_from_source: {
        Args: {
          p_image_url: string
          p_origin_type?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      extend_sponsor_contract: {
        Args: { p_new_end_date: string; p_reason: string; p_sponsor_id: string }
        Returns: {
          address: string | null
          admin_notes: string | null
          admin_notes_last_updated: string | null
          amount: number | null
          city_id: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          end_date: string
          guide_id: string | null
          id: string
          invoice_number: string | null
          last_city_id: string | null
          operator_id: string | null
          owner_id: string | null
          partner_logs: Json | null
          phone: string | null
          plan: string | null
          poi_category: string | null
          poi_id: string | null
          poi_sub_category: string | null
          pricing_version_id: string | null
          profile_id: string | null
          rejection_reason: string | null
          request_id: string | null
          shop_id: string | null
          start_date: string
          status: string | null
          tier: string | null
          type: string | null
          updated_at: string | null
          vat_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sponsors"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      extend_sponsors_bulk: {
        Args: {
          p_days: number
          p_exclude_critical?: boolean
          p_reason: string
          p_sponsor_ids: string[]
        }
        Returns: Json
      }
      get_active_pricing_version: { Args: never; Returns: Json }
      get_active_pricing_version_legacy_backup: {
        Args: never
        Returns: {
          activated_at: string | null
          ai_limits: Json | null
          campaign_id: string | null
          created_at: string
          currency: string
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          plan_id: string
          price: number
          valid_from: string
          valid_until: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "pricing_versions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_pricing_version_v2: {
        Args: { p_duration_days?: number; p_plan_id: string }
        Returns: {
          activated_at: string | null
          ai_limits: Json | null
          campaign_id: string | null
          created_at: string
          currency: string
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          plan_id: string
          price: number
          valid_from: string
          valid_until: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "pricing_versions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_ai_control_tower_stats: { Args: never; Returns: Json }
      get_ai_economics_stats: { Args: never; Returns: Json }
      get_ai_economics_stats_v4: { Args: never; Returns: Json }
      get_ai_verify_queue_counts: { Args: never; Returns: Json }
      get_current_ai_quota: { Args: { p_user_id: string }; Returns: Json }
      get_detailed_city_stats: {
        Args: never
        Returns: {
          admin_region: string
          avg_rating: number
          city_id: string
          city_name: string
          city_status: string
          continent: string
          events_count: number
          guides_count: number
          nation: string
          people_count: number
          photo_coverage: number
          poi_low: number
          poi_medium: number
          poi_top: number
          quality_score: number
          shop_artigianato: number
          shop_cantina: number
          shop_gusto: number
          shop_moda: number
          sponsor_gold: number
          sponsor_silver: number
          svc_airport: number
          svc_bus: number
          svc_emergency: number
          svc_maritime: number
          svc_other: number
          svc_pharmacy: number
          svc_taxi: number
          svc_train: number
          text_coverage: number
          total_pois: number
          tour_ops_count: number
          visitors: number
          zone_name: string
        }[]
      }
      get_dynamic_seasonal_ranking: {
        Args: { p_city_ids: string[]; target_season: string }
        Returns: {
          city_id: string
          seasonal_score: number
        }[]
      }
      get_nearby_pois: {
        Args: { lat: number; long: number; radius_meters: number }
        Returns: {
          address: string
          affiliate: Json
          category: string
          city_id: string
          coords_lat: number
          coords_lng: number
          description: string
          dist_meters: number
          id: string
          image_url: string
          is_sponsored: boolean
          name: string
          opening_hours: Json
          price_level: number
          rating: number
          status: string
          sub_category: string
          tier: string
          visit_duration: string
          votes: number
        }[]
      }
      get_observatory_report: {
        Args: never
        Returns: {
          avg_quality: number
          city_id: string
          city_name: string
          last_audit: string
          pois_suspicious_hours: number
          pois_without_img: number
          total_pois: number
        }[]
      }
      get_observatory_stats: { Args: never; Returns: Json }
      get_report_admin_context: { Args: { p_report_id: string }; Returns: Json }
      get_shared_resource_edit_lock_holder: {
        Args: { p_shared_resource_id: string }
        Returns: string
      }
      get_shared_resource_edit_lock_state: {
        Args: { p_shared_resource_id: string }
        Returns: Json
      }
      get_sponsor_rating_alert_threshold: { Args: never; Returns: number }
      get_used_images_report: {
        Args: never
        Returns: {
          context: string
          image_url: string
        }[]
      }
      grant_admin_ai_credits: {
        Args: {
          p_expires_at?: string
          p_flash_credits: number
          p_pro_credits?: number
          p_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      grant_ai_burst_pack:
        | {
            Args: {
              p_expires_days?: number
              p_pack_id: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_expires_days?: number
              p_pack_id: string
              p_price: number
              p_stripe_session_id?: string
              p_user_id: string
            }
            Returns: undefined
          }
      handle_city_deleted_for_sponsors: {
        Args: { p_city_id: string }
        Returns: number
      }
      increment_community_post_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_global_usage: {
        Args: { p_guest_id: string; p_model_type: string; p_user_id: string }
        Returns: undefined
      }
      insert_city_patron_gallery_photo_with_assignment: {
        Args: {
          p_approved_at?: string
          p_approved_by?: string
          p_caption?: string
          p_city_id: string
          p_gallery_photo_id: string
          p_image_url: string
          p_origin_type?: string
          p_sort_order?: number
          p_source_suggestion_item_id?: string
          p_storage_path: string
        }
        Returns: string
      }
      insert_sponsor_message: {
        Args: {
          p_direction: Database["public"]["Enums"]["sponsor_message_direction"]
          p_message: string
          p_partner_id: string
          p_request_id?: string
          p_sponsor_id?: string
        }
        Returns: string
      }
      is_canonical_image_verification_step_code: {
        Args: { p_code: string }
        Returns: boolean
      }
      is_canonical_image_verification_step_outcome: {
        Args: { p_outcome: string }
        Returns: boolean
      }
      is_media_asset_publicly_usable: {
        Args: { p_asset_id: string }
        Returns: boolean
      }
      is_service_role: { Args: never; Returns: boolean }
      is_td_admin: { Args: { p_uid: string }; Returns: boolean }
      list_ai_verify_queue: {
        Args: {
          p_city_id?: string
          p_continent?: string
          p_entity_type?: string
          p_limit?: number
          p_nation?: string
          p_offset?: number
        }
        Returns: {
          admin_region: string
          asset_status: Database["public"]["Enums"]["image_asset_status"]
          blocking_step_code: string
          city_id: string
          city_name: string
          continent: string
          current_assignments: Json
          entity_id: string
          entity_label: string
          entity_type: string
          generated_by_ai: boolean
          is_placeholder: boolean
          latest_ai_summary: string
          latest_run_id: string
          license_code: string
          media_asset_id: string
          nation: string
          origin_type: string
          source_url: string
          storage_bucket: string
          storage_path: string
          zone: string
        }[]
      }
      log_ai_usage_tokens: {
        Args: {
          p_completion_tokens: number
          p_estimated_cost_eur: number
          p_feature_name: string
          p_model_name: string
          p_pricing_version_id?: string
          p_prompt_tokens: number
          p_total_tokens: number
          p_user_id: string
        }
        Returns: undefined
      }
      log_universal_usage: {
        Args: { p_guest_id: string; p_model_type: string; p_user_id: string }
        Returns: undefined
      }
      mark_expired_sponsors: { Args: never; Returns: undefined }
      mark_sponsor_messages_read: {
        Args: {
          p_partner_id?: string
          p_reader?: string
          p_request_id?: string
        }
        Returns: number
      }
      media_origin_is_merge_governed: {
        Args: { p_origin: string }
        Returns: boolean
      }
      media_origin_primary_merge_priority: {
        Args: { p_origin: string }
        Returns: number
      }
      merge_pois_observatory_atomic: {
        Args: {
          p_enrichment?: Json
          p_survivor_id: string
          p_victim_id: string
        }
        Returns: undefined
      }
      mutate_platform_feature_flag: {
        Args: { p_key: string; p_patch: Json; p_reason?: string }
        Returns: {
          audience: string[]
          audit_required: boolean
          blocked_audiences: string[]
          category: string
          default_value: Json
          key: string
          label: string
          manual_override: Json | null
          message_key: string | null
          schedules: Json
          supports_audience: boolean
          supports_schedule: boolean
          updated_at: string
          updated_by: string | null
          value_type: string
        }
        SetofOptions: {
          from: "*"
          to: "platform_feature_flags"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      normalize_canonical_media_origin_type: {
        Args: { p_origin_type: string }
        Returns: string
      }
      parse_image_verification_step_order: {
        Args: { p_fallback: number; p_step: Json }
        Returns: number
      }
      promote_staging_poi_to_live: {
        Args: { p_poi: Json; p_staging_id: string }
        Returns: boolean
      }
      publish_diary_to_community: {
        Args: { p_source_diary_id: string }
        Returns: Json
      }
      recalculate_ai_limits: { Args: never; Returns: undefined }
      reconcile_poi_image_assignments_for_merge: {
        Args: {
          p_survivor_city_id: string
          p_survivor_id: string
          p_victim_city_id: string
          p_victim_id: string
        }
        Returns: undefined
      }
      record_image_verification_run: {
        Args: {
          p_ai_summary?: string
          p_mark_verify_queue?: boolean
          p_media_asset_id: string
          p_steps: Json
        }
        Returns: string
      }
      record_platform_control_audit: {
        Args: {
          p_action: string
          p_config_key: string
          p_reason?: string
          p_value_after?: Json
          p_value_before?: Json
        }
        Returns: string
      }
      record_sponsor_admin_audit: {
        Args: {
          p_event_type: string
          p_payload?: Json
          p_request_id?: string
          p_sponsor_id?: string
          p_summary: string
        }
        Returns: string
      }
      redeem_referral_code: { Args: { code_input: string }; Returns: Json }
      refresh_city_classification:
        | {
            Args: { target_city_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.refresh_city_classification(target_city_id => text), public.refresh_city_classification(target_city_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { target_city_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.refresh_city_classification(target_city_id => text), public.refresh_city_classification(target_city_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      refresh_shared_resource_edit_lock: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      reject_sponsor_request: {
        Args: { p_admin_notes?: string; p_reason: string; p_request_id: string }
        Returns: {
          address: string | null
          admin_notes: string | null
          admin_notes_last_updated: string | null
          city_id: string | null
          company_name: string | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          description: string | null
          id: string
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          languages: string[] | null
          license_number: string | null
          message: string | null
          owner_id: string | null
          partner_logs: Json | null
          poi_category: string | null
          poi_sub_category: string | null
          pricing_version_id: string | null
          profile_id: string | null
          rejection_reason: string | null
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          specialties: string[] | null
          status: string | null
          status_changed_at: string | null
          tier: string | null
          type: string | null
          vat_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sponsor_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_shared_resource_edit_lock: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      relink_orphaned_sponsors_to_city: {
        Args: { p_city_id: string; p_city_name: string }
        Returns: number
      }
      replace_city_patron_gallery_photo_with_assignment: {
        Args: {
          p_gallery_photo_id: string
          p_image_url: string
          p_origin_type?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      resolve_poi_category_for_sponsor_activation: {
        Args: { p_plan_type: string; p_poi_category: string }
        Returns: string
      }
      revoke_patron_gallery_image_assignment: {
        Args: { p_assignment_id: string }
        Returns: undefined
      }
      revoke_patron_primary_image_assignment: {
        Args: { p_city_id: string }
        Returns: undefined
      }
      safe_archive_media_asset: {
        Args: { p_admin_rationale?: string; p_media_asset_id: string }
        Returns: Json
      }
      save_city_person_with_image_assignment: {
        Args: {
          p_image_url?: string
          p_origin_type?: string
          p_person: Json
          p_specific_category_ids?: string[]
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      save_poi_with_image_assignment: {
        Args: {
          p_image_url?: string
          p_origin_type?: string
          p_poi: Json
          p_skip_primary_image_update?: boolean
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      search_pois: {
        Args: {
          filter_category?: string
          filter_city_id?: string
          search_query: string
        }
        Returns: {
          address: string | null
          affiliate: Json | null
          ai_reliability: string | null
          category: string | null
          city_id: string | null
          contact_info: Json | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          created_by: string | null
          date_added: string | null
          description: string | null
          fts: unknown
          id: string
          image_credit: string | null
          image_is_placeholder: boolean | null
          image_license: string | null
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          is_sponsored: boolean | null
          last_verified: string | null
          link_metadata: Json | null
          location: unknown
          name: string
          opening_hours: Json | null
          phone: string | null
          price_level: number | null
          rating: number | null
          showcase_expiry: string | null
          status: string | null
          sub_category: string | null
          suggested_by: string | null
          tier: string | null
          tourism_interest: string | null
          updated_at: string | null
          updated_by: string | null
          visit_duration: string | null
          votes: number | null
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "pois"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_famous_person_editorial_status: {
        Args: { p_person_id: string; p_status: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { input: string }; Returns: string }
      submit_community_poi: {
        Args: {
          p_category: string
          p_city_id: string
          p_city_name: string
          p_details?: Json
          p_poi_name: string
        }
        Returns: string
      }
      submit_famous_person_photo_suggestion: {
        Args: {
          p_image_url: string
          p_notes?: string
          p_person_id: string
          p_rights_confirmed: boolean
          p_storage_path: string
        }
        Returns: string
      }
      submit_famous_person_suggestion: {
        Args: { p_city_id: string; p_notes: string; p_suggested_name: string }
        Returns: string
      }
      submit_patron_photo_suggestion: {
        Args: {
          p_city_id: string
          p_items?: Json
          p_notes?: string
          p_rights_confirmed: boolean
        }
        Returns: string
      }
      sync_poi_rating_from_reviews: {
        Args: { p_poi_id: string }
        Returns: undefined
      }
      sync_sponsor_profile_from_shop: {
        Args: {
          p_refresh_subscription?: boolean
          p_shop_id: string
          p_subscription_tier?: string
        }
        Returns: undefined
      }
      toggle_photo_like: { Args: { p_photo_id: string }; Returns: Json }
      transition_media_asset_status: {
        Args: {
          p_admin_rationale?: string
          p_media_asset_id: string
          p_target_status: Database["public"]["Enums"]["image_asset_status"]
        }
        Returns: Database["public"]["Enums"]["image_asset_status"]
      }
      transition_report_status: {
        Args: {
          p_admin_notes?: string
          p_report_id: string
          p_target_status: string
        }
        Returns: Json
      }
      try_acquire_shared_resource_edit_lock: {
        Args: { p_shared_resource_id: string }
        Returns: boolean
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_ai_costs_and_recalculate: {
        Args: { new_flash_cost: number; new_pro_cost: number }
        Returns: undefined
      }
      update_expired_sponsors: { Args: never; Returns: undefined }
      update_sponsor_request_admin_notes: {
        Args: { p_notes: string; p_request_id: string }
        Returns: {
          address: string | null
          admin_notes: string | null
          admin_notes_last_updated: string | null
          city_id: string | null
          company_name: string | null
          coords_lat: number | null
          coords_lng: number | null
          created_at: string | null
          description: string | null
          id: string
          image_status: Database["public"]["Enums"]["media_status"]
          image_url: string | null
          languages: string[] | null
          license_number: string | null
          message: string | null
          owner_id: string | null
          partner_logs: Json | null
          poi_category: string | null
          poi_sub_category: string | null
          pricing_version_id: string | null
          profile_id: string | null
          rejection_reason: string | null
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          specialties: string[] | null
          status: string | null
          status_changed_at: string | null
          tier: string | null
          type: string | null
          vat_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sponsor_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_city_person_with_category_links: {
        Args: { p_person: Json; p_specific_category_ids?: string[] }
        Returns: string
      }
      upsert_entity_image_assignment_dual_write: {
        Args: {
          p_assignment_role?: string
          p_city_id: string
          p_entity_id: string
          p_entity_type: string
          p_image_url?: string
          p_origin_type?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      upsert_entity_primary_image_assignment: {
        Args: {
          p_city_id: string
          p_entity_id: string
          p_image_url?: string
          p_origin_type?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      upsert_patron_gallery_image_assignment: {
        Args: {
          p_city_id: string
          p_image_url: string
          p_origin_type?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      upsert_patron_gallery_image_assignment_core: {
        Args: {
          p_allow_same_source_rematerialize: boolean
          p_city_id: string
          p_image_url: string
          p_origin_type: string
          p_storage_bucket: string
          p_storage_path: string
        }
        Returns: string
      }
      upsert_patron_primary_image_assignment: {
        Args: {
          p_city_id: string
          p_image_url?: string
          p_origin_type?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      upsert_poi_primary_image_assignment: {
        Args: {
          p_city_id: string
          p_entity_id: string
          p_image_url?: string
          p_origin_type?: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      user_can_access_workspace: {
        Args: { p_user_id?: string; p_workspace_id: string }
        Returns: boolean
      }
      user_can_view_collaboration_event: {
        Args: { p_event_id: string; p_user_id?: string }
        Returns: boolean
      }
      user_owns_workspace: {
        Args: { p_user_id?: string; p_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ai_credit_source:
        | "purchase"
        | "subscription"
        | "rollover"
        | "bonus"
        | "sponsor"
        | "promo"
        | "referral"
      collaborative_member_role: "collaborator" | "viewer"
      friend_request_status: "pending" | "accepted" | "rejected"
      image_asset_status:
        | "active"
        | "suspended"
        | "restored"
        | "replaced"
        | "removed"
        | "verify_ai_image"
      image_verification_step_outcome:
        | "verified"
        | "unverified"
        | "doubt"
        | "blocked"
        | "not_applicable"
      media_status: "real" | "placeholder" | "missing"
      plan_segment: "BUSINESS" | "TRAVELER"
      plan_type:
        | "LOCAL_ACTIVITY"
        | "REGIONAL_ACTIVITY"
        | "DIGITAL_SHOWCASE"
        | "TOUR_OPERATOR"
        | "TOUR_GUIDE"
        | "PRO_USER"
        | "PRO_USER_PLUS"
      resource_invite_status: "pending" | "accepted" | "rejected" | "revoked"
      shared_resource_kind: "diary" | "suitcase" | "user_template"
      sharing_mode: "collaborative" | "personal"
      sponsor_message_direction: "admin" | "partner" | "system"
      subscription_status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING"
      workspace_attachment_category:
        | "documents"
        | "tickets"
        | "bookings"
        | "expenses"
        | "misc"
      workspace_resource_access: "none" | "viewer" | "collaborator"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      ai_credit_source: [
        "purchase",
        "subscription",
        "rollover",
        "bonus",
        "sponsor",
        "promo",
        "referral",
      ],
      collaborative_member_role: ["collaborator", "viewer"],
      friend_request_status: ["pending", "accepted", "rejected"],
      image_asset_status: [
        "active",
        "suspended",
        "restored",
        "replaced",
        "removed",
        "verify_ai_image",
      ],
      image_verification_step_outcome: [
        "verified",
        "unverified",
        "doubt",
        "blocked",
        "not_applicable",
      ],
      media_status: ["real", "placeholder", "missing"],
      plan_segment: ["BUSINESS", "TRAVELER"],
      plan_type: [
        "LOCAL_ACTIVITY",
        "REGIONAL_ACTIVITY",
        "DIGITAL_SHOWCASE",
        "TOUR_OPERATOR",
        "TOUR_GUIDE",
        "PRO_USER",
        "PRO_USER_PLUS",
      ],
      resource_invite_status: ["pending", "accepted", "rejected", "revoked"],
      shared_resource_kind: ["diary", "suitcase", "user_template"],
      sharing_mode: ["collaborative", "personal"],
      sponsor_message_direction: ["admin", "partner", "system"],
      subscription_status: ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"],
      workspace_attachment_category: [
        "documents",
        "tickets",
        "bookings",
        "expenses",
        "misc",
      ],
      workspace_resource_access: ["none", "viewer", "collaborator"],
    },
  },
} as const