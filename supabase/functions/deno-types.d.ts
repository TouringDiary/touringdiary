declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare function serve(handler: (req: Request) => Promise<Response> | Response): void;

declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export * from "@supabase/supabase-js";
}

declare module "npm:@google/genai" {
  export * from "@google/genai";
}
