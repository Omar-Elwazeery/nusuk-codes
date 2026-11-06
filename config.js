// ===== Site configuration =====
window.NUSUK_CONFIG = {
  // Your own code - always pinned at the top
  OWNER_CODE: 'NG-Glutro42',

  // Supabase > Project Settings > API (Data API URL + publishable/anon key).
  // The publishable key is meant to be public; the database only allows the
  // functions defined in supabase/schema.sql.
  SUPABASE_URL: 'https://xpzsvkeasmwmtlbtumcg.supabase.co',
  SUPABASE_KEY: 'sb_publishable_TDBl9LYShD_Ud3pp2xKjCw_miKcP3zT',

  // Link that opens the Nusuk app with a referral code ({CODE} is replaced)
  APP_LINK: 'https://services.nusuk.sa/app?p=27&id={CODE}',

  // Featured random code rotates every N minutes (must match supabase/schema.sql)
  ROTATE_MINUTES: 30
};
