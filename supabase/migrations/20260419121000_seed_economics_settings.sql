-- Description: Inizializzazione parametri economici predittivi per la Control Tower

INSERT INTO public.global_settings (key, value)
VALUES 
    ('economics_target_margin_percent', '{"target_margin": 0.65}'),
    ('economics_churn_rate_estimate', '{"churn_rate": 0.08}'),
    ('economics_recovery_rate_estimate', '{"recovery_rate": 0.20}'),
    ('economics_monthly_budget_cap', '{"budget_cap": 800.00}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
