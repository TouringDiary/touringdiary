export enum Type {
  TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
  NULL = "NULL",
}

export interface Schema {
  type: Type;
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
  properties?: {
    [k: string]: Schema;
  };
  required?: string[];
  items?: Schema;
}

export interface AiQuota {
    flash_remaining: number;
    pro_remaining: number;
    flash_limit: number;
    pro_limit: number;
    has_active_subscription: boolean;
    admin_extra_quota: number;
    subscription_flash_remaining?: number;
    subscription_pro_remaining?: number;
    extra_credit_packs_flash_remaining?: number;
    extra_credit_packs_pro_remaining?: number;
    admin_bonus_flash_remaining?: number;
    admin_bonus_pro_remaining?: number;
    total_remaining?: number;
}
