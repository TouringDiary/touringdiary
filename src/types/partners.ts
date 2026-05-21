export type PartnerCapability = string;

export interface PartnerDisplayOptions {
  logo_url?: string;
  theme_color?: string;
}

export interface PartnerAiHints {
  prompt_trigger?: string | string[];
  preferred_for_capability?: string[];
}

export interface PartnerIntegration {
  id: string;
  label: string;
  enabled: boolean;
  capabilities: PartnerCapability[];
  group?: string; 
  priority?: number;
  is_primary?: boolean;
  display_options?: PartnerDisplayOptions;
  ai_hints?: PartnerAiHints;
  tracking?: {
    monetization_tier: 'standard' | 'premium';
    analytics_event_name: string;
  };
  affiliate?: {
    base_url: string;
    param_name: string;
    tracking_id: string;
    search_query_param: string;
  };
  api_config?: {
    enabled: boolean;
    credentials: {
      access_key: string;
      secret_key: string;
      associate_tag: string;
      marketplace: string;
    };
  };
}

export interface AffiliateProductLink {
  id: string;
  product_id: string;
  partner_id: string;
  query: string;
  url_override?: string;
  image_override?: string;
  tracking_override?: string;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerIntegrations {
  partners: Record<string, PartnerIntegration>;
  category_partner_priority?: Record<string, string[]>;
}
