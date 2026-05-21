
export interface SubscriptionData {
    id: string;
    user_id?: string;
    sponsor_id?: string;
    pricing_version_id: string;
    campaign_id?: string;
    status: string;
    start_date: string;
    end_date: string;
    auto_renew: boolean;
    cancel_at_period_end: boolean;
    current_period_start: string | null;
    current_period_end: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    price_paid?: number;
    currency_paid?: string;
    pricing_version?: {
        id: string;
        duration_days: number;
        price: number;
        ai_limits: any;
    };
}
