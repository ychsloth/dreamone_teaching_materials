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


// 方塊圖片重新上傳後，Storage 物件路徑沒變，光靠 Cache-Control 沒辦法保證瀏覽器／
// Supabase 前面的 CDN 一定會立刻抓到新版本（重新整理過還是有機率吃到舊快取）。
// 這裡改成讀 Storage 裡每個檔案「真正的」updated_at 時間戳，讓每個方塊的圖片網址
// 都帶上這個時間戳當版本號——只要檔案內容真的變了，網址就一定跟著變，不管中間有
// 幾層快取都不影響，同時內容沒變的圖片網址維持不變，還是能正常被快取。
export async function fetchCubeImageVersions() {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list('', { limit: 1000 });
  if (error) {
    console.error('[讀取方塊圖片版本失敗]', error.message, error);
    return {};
  }
  const map = {};
  (data || []).forEach((f) => {
    if (f.name && f.updated_at) map[f.name] = new Date(f.updated_at).getTime();
  });
  return map;
}
