function readEnv(key: "NEXT_PUBLIC_SITE_URL" | "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  get NEXT_PUBLIC_SITE_URL() {
    return readEnv("NEXT_PUBLIC_SITE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_URL() {
    return readEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
};
