import { Shield, Users, GraduationCap, Palette } from 'lucide-react';
import { STORAGE_BASE_URL } from './supabaseClient.js';


// 資料表名稱一律用常數管理，Postgres 對有大寫的識別字是區分大小寫的，打錯字就是 404／PGRST205 的元兇
export const PROFILES_TABLE = 'Profiles';


export const ADMIN_EMAIL = 'yuchihou0624@gmail.com';


export const STAFF_EMAILS = [
  'hank921109@gmail.com', 'hogahogaga@gmail.com', 'yijin@dreamcube.tw',
  'jinner621@gmail.com', 'one@dreamcube.tw', '9951323ntua@gmail.com',
  'yangz8610@gmail.com', 'ericwf36@gmail.com', 'lazy@dreamcube.tw',
  'aax8808x@gmail.com', 'lulu206246@gmail.com', 'allen.yanhua.wang@gmail.com',
  'judy2011380@gmail.com', 'jim.kc.huang@gmail.com', 'janet20060320@gmail.com',
  'bellalin64@gmail.com'
];


// 從「講師資料總表」CSV 匯入：管理層級標示為「老師／工讀生／助教」的信箱，登入後自動給一般講師權限，不用等審核。
// 「冷凍」與「取消合作」這兩種狀態排除在外，沒有放進這份名單——這兩種代表目前非活躍合作關係，
// 如果你覺得他們也該自動放行，把對應的信箱加進這個陣列即可。
export const GENERAL_INSTRUCTOR_EMAILS = [
  'j122888623@gmail.com', 'merliah964@gmail.com', 'xu3685483@gmail.com', 'charles920830@gmail.com',
  'raymoya1618@gmail.com', 'penny617927@gmail.com', 'dragonite0601@gmail.com', 'bbj432866@gmail.com',
  'a0981150771@gmail.com', 'minnietsai1104@gmail.com', 'jasmine.lin.1220@gmail.com', 'tommysub6@gmail.com',
  '16cuber.dream.nrone@gmail.com', 'milktea10426@gmail.com', 'dnatfg289@gmail.com', 'qaz100107415@gmail.com',
  'zxc0912574554@gmail.com', 'nick940322@gmail.com', '2018chej06@gmail.com', 'aapplytwjames@gmail.com',
  'f1332129@gmail.com', 'ericalovesica@gmail.com', 'shaneliu1010@gmail.com', 'o20741697@gmail.com',
  'yoyo884881@gmail.com', 'newshopherro14@gmail.com', '2001yenchu@gmail.com', 'lulu04028@gmail.com',
  'eddy11111666@gmail.com', 'tony41114@gmail.com', 'tp6m3bjo4@gmail.com', 'jawihong326@gmail.com',
  'irisyang2004@gmail.com', 'wayneppi123@gmail.com', 'a0903751284@gmail.com', 'mask0229@gmail.com',
  'gtr0109.jeff@gmail.com', 'willothewisp890331@gmail.com', 'ij880918@gmail.com', 'yuchien001@gmail.com',
  'luwilliam.his@gmail.com', 'laisteven007@gmail.com', 'wqiu63088@gmail.com', 'amyyu940318@gmail.com',
  'sharol30722@gmail.com', 'alanchiang0219@gmail.com', 'shauntsou.en11@nycu.edu.tw', 'weber.lai@livemail.tw',
  'evone0976729727@gmail.com', 'c14111116@gs.ncku.edu.tw', 'vic960909@gmail.com', 'hank1212.chen@gmail.com',
  'joannatsai41@gmail.com', 'hss899878@gmail.com', 'm123155527@gmail.com', 'gez79843520@gmail.com',
  'a0901226521@gmail.com', 'michael1234judy@gmail.com', '0107laura0208@gmail.com', 'zampoe0925@gmail.com',
  'john910514@gmail.com', 'horns2578@gmail.com', 'youxun0706@gmail.com', 'william950721@gmail.com',
  'jichen690@gmail.com', 'd082915@gmail.com', 'cuberjhcubing@gmail.com', 'louie38628050@gmail.com',
  'jason0968367615@gmail.com', 'steven199910151@gmail.com', 'a0926175647@gmail.com', 'bobgoog43994399@gmail.com',
  'z0972869230@gmail.com', 'u11117007@go.utaipei.edu.tw', 'liubaiyi78@gmail.com', '930901ann@gmail.com',
  'gucci.wang33@gmail.com', 'averypjchen@gmail.com', 'tiffany20010109@gmail.com', 'a0909146747@gmail.com',
  'irene940115@gmail.com', 'christopherhankeli20061011@gmail.com', 't880209@gmail.com', 'stalinite01@gmail.com',
  'sydney.twq@gmail.com', 'ericchen5329@gmail.com', 'hosamson929@gmail.com', 'douliu911108@gmail.com',
  'nnnneva626@gmail.com', 'aaaaaa0112349@gmail.com', 'samchenru@gmail.com', 'arial5690@gmail.com',
  'aiiane753951@gmail.com', 'ella07151515@gmail.com', 'leo99092@gmail.com', 'xtth0612@gmail.com',
  'wendykang930709@gmail.com', 'chris20200620@gmail.com', 'aa29043406@gmail.com', 'laishixin181@gmail.com',
  'chenyachi91@gmail.com', 'jack20071216@gmail.com', 'o908577662@gmail.com', 'jack49004256@gmail.com',
  'cynilsj0723@gmail.com', 'ojo20333739@gmail.com', 'machiya520@gmail.com', 'dennis1113.chen@gmail.com',
  'tinkoto460@gmail.com', 'jshuang777@gmail.com', '30912thomas@gmail.com', 'n00bsalol@gmail.com',
  'erin0925erin@gmail.com', 'qwertyuiop900311@gmail.com', 'zoxyun0726@gmail.com', 'd851993451@gmail.com',
  '1b3b355558888@gmail.com', '06211106@yahoo.com.tw', 'feeling3818121812@gmail.com', 'howie8853x34@gmail.com',
  'twsswt123@gmail.com', 'unyyy0928@gmail.com', 'superyee092@gmail.com', 'emma12exo@gmail.com',
  'huazong1028@gmail.com', 'yuyu50253@gmail.com', 'maomn1009@gmail.com', 'gastapal@gmail.com',
  'adamlin1688@gmail.com', 'roger351616@gmail.com', 'roydidi555@gmail.com', 'mary78060@gmail.com',
  'chengcy395@gmail.com', 'pecan1458@yahoo.com.tw', 'dryangel52014@gmail.com', '49739378james@gmail.com',
  'bennywang20060814@gmail.com', 'cryan0937@gmail.com', 'chuboyou@gmail.com', '3509174y@gmail.com',
  'timmy950215@gmail.com', 'wow0803gdh@gmail.com', 'cjf87678049@gmail.com', '0966583315a@gmail.com',
  'elliecinnamoroll@gmail.com', 'a0919546417@gmail.com', 'linnn0598@gmail.com', 'jerry960305@gmail.com',
  'chelsealin2358@gmail.com', '1080331@mail.mhjh.tp.edu.tw', 'zhanghanyuan36@gmail.com', '114106137@gms.tcu.edu.tw',
  'sophiehsu101107@gmail.com', 'f20070523@gmail.com', 'hongyongzhi1@gmail.com', 'yijenhsueh@gmail.com',
  'a9505288@gmail.com', 'goodhappyrc@gmail.com'
];


// 信箱比對一律轉小寫再比較，避免 Google 回傳的大小寫跟名單裡打的不一致而誤判
export const normalizeEmail = (e) => (e || '').trim().toLowerCase();


export const CUBE_IMAGE_MAP = {
  '1x3x3': 'cube_01.png', '楓葉': 'cube_02.png', '金字塔': 'cube_03.png', '魔錶': 'cube_04.png',
  '2x2x2': 'cube_05.png', '恐龍': 'cube_06.png', '八葉花': 'cube_07.png', '3x3x3': 'cube_08.png',
  '2x2x3': 'cube_09.png', '2x3x3': 'cube_10.png', '三階鏡面': 'cube_11.png', '二階鏡面': 'cube_12.png',
  '二階五魔方': 'cube_13.png', '費雪': 'cube_14.png', '風火輪': 'cube_15.png', '斜轉': 'cube_16.png',
  '三階齒輪': 'cube_17.png', '4x4x4': 'cube_18.png', '5x5x5': 'cube_19.png', 'FTO': 'cube_20.png',
  '五魔方': 'cube_21.png', '二階金字塔': 'cube_22.png', '四階金字塔': 'cube_23.png', 'Square-1': 'cube_24.png',
  '超級楓葉': 'cube_25.png', '3x3x4': 'cube_26.png', '6x6x6': 'cube_27.png', '7x7x7': 'cube_28.png',
  '三階粽子': 'cube_29.png', '軸方塊': 'cube_30.png', '三葉草': 'cube_31.png',
};


// Supabase Storage 的物件路徑（key）不接受中文或百分比編碼字元（傳了會直接
// StorageApiError: Invalid key），所以中文方塊名稱不能直接當檔名、也不能用
// encodeURIComponent（結果帶 % 一樣會被拒絕）。這裡把名稱裡每個非英數字元換成
// 它的 Unicode codepoint（16進位），結果保證只有小寫英數字跟連字號，Supabase
// 一定收。同一個名稱每次算出來的結果固定不變，不需要另外存一份對照表。
function slugifyForStorageKey(name) {
  let out = '';
  for (const ch of name) {
    out += /[a-zA-Z0-9]/.test(ch) ? ch.toLowerCase() : `-${ch.codePointAt(0).toString(16)}-`;
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// CUBE_IMAGE_MAP 裡記的副檔名不一定可信（例如某顆方塊還沒照片時，暫時填了瀏覽器
// 不能顯示的 .psd）。上傳跟顯示都一律經過這個函式算出「.png」路徑，兩邊永遠對得上，
// 之後不管管理員實際傳的是 png/jpg/webp 哪種格式，都會被存到同一個位置、正常顯示，
// 不會再發生「上傳成功但顯示邏輯因為副檔名不對而拒看」的狀況。
// 不在 CUBE_IMAGE_MAP 裡的方塊（例如啟蒙系列這幾顆還沒建檔名對照的）不再直接擋掉
// 上傳——直接用方塊名稱本身算出一個固定路徑，前台傳照片就能生效，不用等工程師先
// 手動補一筆對照表。
export function getCubeImageStorageFileName(name) {
  if (!name) return null;
  const rawFileName = CUBE_IMAGE_MAP[name];
  const baseName = rawFileName
    ? rawFileName.replace(/\.[^.]+$/, '')
    : `cube-${slugifyForStorageKey(name)}`;
  return `${baseName}.png`;
}

// versions 是 { 檔名: updated_at 時間戳 } 的對照表（見 fetchCubeImageVersions），
// 有給的話會加在網址後面當版本號，確保檔案內容一變，網址就跟著變、不會被任何一層
// 快取卡住；沒給就退回不帶版本號的網址（例如還沒抓到版本資料前的第一次渲染）。
export function getCubeImageUrl(name, versions) {
  const fileName = getCubeImageStorageFileName(name);
  if (!fileName) return null;
  const v = versions && versions[fileName];
  return `${STORAGE_BASE_URL}/${fileName}${v ? `?v=${v}` : ''}`;
}


// 四種內容各自對應到 Supabase 裡實際的表名，以及 comments 表裡對應的關聯欄位
export const CATEGORY_TABLE = { draft: 'cube_drafts', edited: 'cube_final', video: 'cube_videos', box: 'cube_box', other_docs: 'internal_docs' };

export const CATEGORY_COMMENT_COLUMN = { draft: 'draft_id', edited: 'final_id', video: 'video_id', box: 'box_id', other_docs: 'internal_doc_id' };


export const ROLE_META = {
  admin: { label: 'Admin・總管理者', icon: Shield },
  internal_partner: { label: 'Internal・內部夥伴', icon: Users },
  general_instructor: { label: 'Instructor・外部講師', icon: GraduationCap },
  designer: { label: 'Designer・設計師', icon: Palette },
};


// 排程任務的類型標籤，跟 design_tasks 資料表的 task_type 欄位對應
export const DESIGN_TASK_TYPE_LABEL = { revise: '修改內容', new: '新講義製作', other: '其他' };


export const TIERS = [
  { score: '啟蒙系列', badge: '🌱', label: '啟蒙系列', bg: 'bg-teal-400', text: 'text-slate-900', cubes: ['布丁', '三明治', '凹凸', '火山', '二重奏', '1x2x3', '小寶塔'] },
  { score: 10, badge: '10', label: '10分方塊區', bg: 'bg-pink-500', text: 'text-white', cubes: ['1x3x3', '楓葉', '金字塔', '魔錶'] },
  { score: 20, badge: '20', label: '20分方塊區', bg: 'bg-orange-500', text: 'text-white', cubes: ['2x2x2', '恐龍', '八葉花'] },
  { score: 30, badge: '30', label: '30分方塊區', bg: 'bg-amber-400', text: 'text-slate-900', cubes: ['3x3x3', '2x2x3', '2x3x3', '三階鏡面', '二階鏡面', '二階五魔方', '費雪', '風火輪', '斜轉', '三階齒輪'] },
  { score: 50, badge: '50', label: '50分方塊區', bg: 'bg-emerald-600', text: 'text-white', cubes: ['4x4x4', '5x5x5', 'FTO', '五魔方', '二階金字塔', '四階金字塔'] },
  { score: 60, badge: '60', label: '60分方塊區', bg: 'bg-orange-900', text: 'text-white', cubes: ['Square-1', '超級楓葉', '3x3x4'] },
  { score: 70, badge: '70', label: '70分方塊區', bg: 'bg-violet-800', text: 'text-white', cubes: ['6x6x6', '7x7x7', '三階粽子', '軸方塊', '三葉草'] },
];


// 依 TIERS 順序攤平成一份連續的方塊清單，給「上一顆／下一顆」導覽用
export const ALL_CUBES_FLAT = TIERS.flatMap((tier) => tier.cubes.map((name) => ({ id: `${tier.score}__${name}`, name, tier })));
