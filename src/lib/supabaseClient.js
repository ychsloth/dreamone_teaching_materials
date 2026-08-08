import { createClient } from '@supabase/supabase-js';


export const SUPABASE_URL = "https://gpwkuwjonvkfnvupmtkn.supabase.co";

export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd2t1d2pvbnZrZm52dXBtdGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDM2ODksImV4cCI6MjA5OTA3OTY4OX0.BGqE3AfToygJZlANMvXHDnA3t0WfpALbxdGIS5niujM";


// persistSession/autoRefreshToken/detectSessionInUrl 這三個其實是 supabase-js 的預設值，
// 這裡明確寫出來只是為了確保「登入一次、瀏覽器記住帳號」這件事不會被意外關掉：
// - persistSession: 把 session 存進瀏覽器的 localStorage，重新整理或關掉分頁再打開都還在
// - autoRefreshToken: session 快過期時自動在背景換新的 token，使用者不會突然被登出
// - detectSessionInUrl: Google 登入導回網站時，從網址上的參數解析出 session
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});


export const STORAGE_BUCKET = 'cube-images';

export const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}`;

export const LOGO_URL = `${STORAGE_BASE_URL}/logo.png`;

export const LEARNING_MAP_URL = `${SUPABASE_URL}/storage/v1/object/public/manu/learning_map.png`;
