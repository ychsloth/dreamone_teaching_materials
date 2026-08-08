import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, FileText, MessageSquare, AlertTriangle, X, Lock, ArrowLeft, Box, CheckCircle2, Video, FolderOpen, ImagePlus, LayoutDashboard } from 'lucide-react';
import { Header } from './components/Header.jsx';
import { LandingScreen } from './components/LandingScreen.jsx';
import { NotificationPanel } from './components/NotificationPanel.jsx';
import { ProfileSetup } from './components/ProfileSetup.jsx';
import { ReportModal } from './components/ReportModal.jsx';
import { AdminDrawer } from './components/admin/AdminDrawer.jsx';
import { AuthScreen, PendingApprovalScreen } from './components/auth/AuthScreens.jsx';
import { CommentSection } from './components/comments/CommentComponents.jsx';
import { ContentOverviewDrawer } from './components/content/ContentOverviewDrawer.jsx';
import { AddFileModal } from './components/files/AddFileModal.jsx';
import { FullscreenPreviewModal } from './components/files/DrivePdfViewer.jsx';
import { ArticleBlock, InstructorHandout, SimpleFileBlock, VersionedFileBlock } from './components/files/FileBlocks.jsx';
import { ReviewModal } from './components/files/ReviewModal.jsx';
import { GrayscaleTool } from './components/grayscale/GrayscaleTool.jsx';
import { CubeNavButton } from './components/learningMap/LearningMap.jsx';
import { AssignTaskModal, DesignTaskModal, ScheduleView } from './components/schedule/ScheduleComponents.jsx';
import { CubeBadges, LoadingScreen } from './components/shared/SmallUI.jsx';
import { ADMIN_EMAIL, ALL_CUBES_FLAT, CATEGORY_COMMENT_COLUMN, CATEGORY_TABLE, CUBE_IMAGE_MAP, GENERAL_INSTRUCTOR_EMAILS, PROFILES_TABLE, ROLE_META, STAFF_EMAILS, TIERS, getCubeImageStorageFileName, getCubeImageUrl, normalizeEmail } from './lib/constants.js';
import { STORAGE_BUCKET, supabase } from './lib/supabaseClient.js';
import { FONT_IMPORT } from './styles/fontImport.js';


export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [learningMapError, setLearningMapError] = useState(false);

  const [view, setView] = useState('landing'); // landing | dashboard | cube | profile
  const [selectedCube, setSelectedCube] = useState(null);
  const [openTier, setOpenTier] = useState(10);
  const [brokenImages, setBrokenImages] = useState({});
  // 方塊圖片重新上傳後，Storage 物件路徑沒變，瀏覽器/CDN 會一直吃舊的快取版本，
  // 靠這個 state 幫「剛上傳的那個人」在網址後面加版本號逼瀏覽器重抓，不用等快取過期
  const [imageVersion, setImageVersion] = useState({});

  const [draftFiles, setDraftFiles] = useState([]);
  const [editedFiles, setEditedFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [boxFiles, setBoxFiles] = useState([]);
  const [cubeComments, setCubeComments] = useState([]);
  const [cubeArticle, setCubeArticle] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [cubeStatusMap, setCubeStatusMap] = useState({});
  const [profileDirectory, setProfileDirectory] = useState({});

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showOverviewDrawer, setShowOverviewDrawer] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [designTasks, setDesignTasks] = useState([]);
  // null = 關閉，'new' = 新增，任務物件 = 編輯該任務
  const [designTaskModalTarget, setDesignTaskModalTarget] = useState(null);
  const [internalDocs, setInternalDocs] = useState([]);
  const [internalDocComments, setInternalDocComments] = useState([]);
  const [showInternalDocsPanel, setShowInternalDocsPanel] = useState(false);
  const [showAddInternalDocModal, setShowAddInternalDocModal] = useState(false);
  const [internalDocUploadForm, setInternalDocUploadForm] = useState({ version_label: '', file_url: '', note: '' });
  const [internalDocUploading, setInternalDocUploading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const [showAddFileModal, setShowAddFileModal] = useState(null);
  const [reviewFile, setReviewFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ version_label: '', file_url: '', note: '' });
  const [uploading, setUploading] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ---- 核心上傳函式：一律透過唯一初始化的 supabase 客戶端呼叫 Storage API ----
  const handleUpload = async (file, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '60',
          upsert: true,
        });
      if (error) throw error;
      console.log('上傳成功:', data);
      return { ok: true, path: data.path };
    } catch (err) {
      console.error('上傳失敗詳細原因:', err);
      alert('上傳失敗，請檢查網路或權限：' + err.message);
      return { ok: false };
    }
  };

  // status 跟 theme 這兩個欄位，你的 Profiles 表當初可能還沒建，PostgREST 對「查詢裡包含不存在的欄位」是整條查詢直接判定失敗（400），
  // 不是那個欄位讀到空值而已。這幾個小工具負責偵測這種特定錯誤，自動改用不含這兩個欄位的版本重試，
  // 這樣不管你之後有沒有把這兩個欄位加回資料庫，登入流程都不會被卡住。
  const isMissingColumnError = (err) => !!err && /column|schema cache/i.test(err.message || '');

  const selectProfileRow = async (id) => {
    let { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('id, email, role, nickname, avatar_url, status, theme, notif_seen_at')
      .eq('id', id)
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      console.warn(`[${PROFILES_TABLE}] 資料表缺少 status 或 theme 欄位，改用精簡查詢重試`);
      const fallback = await supabase
        .from(PROFILES_TABLE)
        .select('id, email, role, nickname, avatar_url')
        .eq('id', id)
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, status: undefined, theme: undefined } : null;
      error = fallback.error;
    }
    return { data, error };
  };

  const upsertProfileRow = async (row) => {
    let { data, error } = await supabase
      .from(PROFILES_TABLE)
      .upsert(row, { onConflict: 'id' })
      .select('id, email, role, nickname, avatar_url, status, theme, notif_seen_at')
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      console.warn(`[${PROFILES_TABLE}] upsert 缺少 status 或 theme 欄位，改用精簡版本重試`);
      const { status, theme, notif_seen_at, ...rowWithoutExtras } = row;
      const fallback = await supabase
        .from(PROFILES_TABLE)
        .upsert(rowWithoutExtras, { onConflict: 'id' })
        .select('id, email, role, nickname, avatar_url')
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, status: undefined, theme: undefined } : null;
      error = fallback.error;
    }
    return { data, error };
  };

  const updateProfileRow = async (id, patch) => {
    let { error } = await supabase.from(PROFILES_TABLE).update(patch).eq('id', id);
    if (error && isMissingColumnError(error)) {
      console.warn(`[${PROFILES_TABLE}] update 缺少 status 或 theme 欄位，改用精簡版本重試`);
      const { status, theme, notif_seen_at, ...patchWithoutExtras } = patch;
      const fallback = await supabase.from(PROFILES_TABLE).update(patchWithoutExtras).eq('id', id);
      error = fallback.error;
    }
    return { error };
  };

  // ---- Profiles 讀取／同步：資料表名稱使用 PROFILES_TABLE 常數，欄位含 nickname / avatar_url / theme ----
  const resolveAndSyncProfile = useCallback(async (authUser) => {
    const email = authUser.email;
    let targetRole = null;
    if (normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL)) targetRole = 'admin';
    else if (STAFF_EMAILS.some((e) => normalizeEmail(e) === normalizeEmail(email))) targetRole = 'internal_partner';
    else if (GENERAL_INSTRUCTOR_EMAILS.some((e) => normalizeEmail(e) === normalizeEmail(email))) targetRole = 'general_instructor';

    const { data, error } = await selectProfileRow(authUser.id);

    console.log(`[${PROFILES_TABLE} 讀取結果]`, { userId: authUser.id, data, error });
    if (error) console.error(`[${PROFILES_TABLE} 讀取失敗]`, error.message, error);

    if (!data) {
      const role = targetRole || 'general_instructor';
      const status = targetRole ? 'approved' : 'pending';
      const upsertResult = await upsertProfileRow({ id: authUser.id, email, role, status, theme: 'dark' });

      if (upsertResult.error) {
        console.error(`[${PROFILES_TABLE} 建立/同步失敗]`, upsertResult.error.message, upsertResult.error);
        return { id: authUser.id, email, role, status: 'approved', theme: 'dark', nickname: null, avatar_url: null };
      }
      const row = upsertResult.data || { id: authUser.id, email, role, nickname: null, avatar_url: null };
      return { ...row, status: row.status || 'approved', theme: row.theme || 'dark' };
    }

    // 資料庫目前若還沒有 status/theme 欄位，會是 undefined，這裡給預設值，避免擋住既有帳號
    const status = data.status || 'approved';
    const theme = data.theme || 'dark';

    // 重要：這裡「不再」用 STAFF_EMAILS/GENERAL_INSTRUCTOR_EMAILS 去強制覆蓋既有帳號的角色。
    // 之前的版本會在每次登入時重新比對這份清單，導致 admin 在後台手動把人設成「內部夥伴」之後，
    // 只要那個信箱還留在「一般講師」清單裡，下次登入就會被自動打回一般講師——這是先前回報的 bug 的成因。
    // 角色清單現在只在「第一次建立帳號」時（上面 !data 那個分支）用來決定初始角色，
    // 之後角色一律以資料庫裡實際的值為準，只能透過權限管理後台手動更改。
    return { ...data, status, theme };
  }, []);

  const fetchProfile = useCallback(async (authUser) => {
    setProfileLoading(true);
    const resolved = await resolveAndSyncProfile(authUser);
    setProfile(resolved);
    setProfileLoading(false);
  }, [resolveAndSyncProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchProfile(data.session.user);
        // 如果使用者是先在首頁按了「進入完整教材系統」才被導去 Google 登入，
        // 登入完成整頁重新載入後，這裡會直接帶他繼續進去，不用回到首頁再按一次
        if (sessionStorage.getItem('dc_enter_intent') === '1') {
          sessionStorage.removeItem('dc_enter_intent');
          setView('dashboard');
        }
      }
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error('[Google 登入失敗]', error.message, error);
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('landing');
    setSelectedCube(null);
    setShowAdminPanel(false);
  };

  // ---- 個人資料儲存（新手引導 + 編輯共用）----
  const saveProfile = async ({ nickname, avatarFile }) => {
    if (!session) return;
    setSavingProfile(true);
    let avatarUrl = profile ? profile.avatar_url : null;

    if (avatarFile) {
      const ext = (avatarFile.name.split('.').pop() || 'png').toLowerCase();
      const path = `avatars/${session.user.id}.${ext}`;
      const result = await handleUpload(avatarFile, path);
      if (result.ok) {
        const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        avatarUrl = publicUrlData.publicUrl;
      } else {
        setSavingProfile(false);
        return; // handleUpload 已經 alert 過失敗原因
      }
    }

    const { error } = await supabase
      .from(PROFILES_TABLE)
      .update({ nickname, avatar_url: avatarUrl })
      .eq('id', session.user.id);

    setSavingProfile(false);

    if (error) {
      console.error(`[${PROFILES_TABLE} 更新失敗]`, error.message, error);
      alert('儲存失敗：' + error.message);
      return;
    }

    setProfile((prev) => ({ ...prev, nickname, avatar_url: avatarUrl }));
    showToast('個人資料已更新');
    setView('dashboard');
  };

  // 切換淺色/深色模式，存進 Profiles.theme，讓使用者下次登入也記得偏好
  const updateTheme = async (newTheme) => {
    setProfile((prev) => (prev ? { ...prev, theme: newTheme } : prev)); // 先讓畫面立即反應，不用等資料庫回應
    if (!session) return;
    const { error } = await updateProfileRow(session.user.id, { theme: newTheme });
    if (error) {
      console.error(`[${PROFILES_TABLE} 主題更新失敗]`, error.message, error);
      showToast('切換風格失敗：' + error.message);
    }
  };

  const fetchAllProfiles = useCallback(async () => {
    setAdminLoading(true);
    const { data, error } = await supabase.from(PROFILES_TABLE).select('*');
    // 如果你是 admin，這裡的 data 卻只有你自己一筆（看不到其他待審核的人），
    // 代表 Profiles 的 SELECT 政策目前只開放「讀自己那一列」，需要另外開一條給 admin 讀全部的政策。
    console.log(`[權限管理後台] 讀到 ${data ? data.length : 0} 筆使用者資料`, { data, error });
    if (error) console.error(`[讀取所有使用者失敗，可能是 RLS SELECT 政策沒有開放給 admin 讀取全部資料]`, error.message, error);
    if (!error) setAllProfiles(data || []);
    setAdminLoading(false);
  }, []);

  // ---- 通知／任務指派：admin 看留言與校稿動態，內部夥伴看被指派的任務 ----
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[讀取任務失敗]', error.message, error); return; }
    setTasks(data || []);
  }, []);

  const fetchRecentComments = useCallback(async () => {
    const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) { console.error('[讀取最新留言動態失敗]', error.message, error); return; }
    setRecentComments(data || []);
  }, []);

  const markNotificationsSeen = async () => {
    if (!profile || profile.role !== 'admin') return;
    const now = new Date().toISOString();
    setProfile((prev) => (prev ? { ...prev, notif_seen_at: now } : prev));
    const { error } = await updateProfileRow(session.user.id, { notif_seen_at: now });
    if (error) console.error(`[${PROFILES_TABLE} 通知已讀更新失敗]`, error.message, error);
  };

  const assignTask = async (form) => {
    const { error } = await supabase.from('tasks').insert({
      cube_name: form.cube_name,
      category: form.category,
      version_label: form.version_label || null,
      assigned_to: form.assigned_to,
      assigned_by: session.user.email,
      due_date: form.due_date || null,
      note: form.note || null,
    });
    if (error) { console.error('[指派任務失敗]', error.message, error); showToast('指派失敗：' + error.message); return; }
    showToast('已指派任務');
    setShowAssignModal(false);
    fetchTasks();
  };

  const markTaskDone = async (taskId) => {
    const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId);
    if (error) { console.error('[更新任務狀態失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    fetchTasks();
  };

  // ---- 排程清單：admin 指派「要修改的內容／要製作的新講義」給設計師，設計師登入後只看到指派給自己的項目 ----
  const fetchDesignTasks = useCallback(async () => {
    const { data, error } = await supabase.from('design_tasks').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[讀取排程任務失敗]', error.message, error); return; }
    setDesignTasks(data || []);
  }, []);

  const buildDesignTaskPayload = (form) => {
    const isRevise = form.task_type === 'revise';
    return {
      title: form.title,
      description: form.description || null,
      task_type: form.task_type,
      assigned_to: form.assigned_to,
      due_date: form.due_date || null,
      cube_name: isRevise ? form.cube_name || null : null,
      file_category: isRevise ? form.file_category || null : null,
      file_id: isRevise ? form.file_id || null : null,
      pages: isRevise && form.pages && form.pages.length > 0 ? form.pages : null,
      page_notes: isRevise && form.pageNotes && Object.keys(form.pageNotes).length > 0 ? form.pageNotes : null,
    };
  };

  const createDesignTask = async (form) => {
    const { error } = await supabase.from('design_tasks').insert({
      ...buildDesignTaskPayload(form),
      assigned_by: session.user.email,
    });
    if (error) { console.error('[新增排程任務失敗]', error.message, error); showToast('新增失敗：' + error.message); return; }
    showToast('已新增排程項目');
    setDesignTaskModalTarget(null);
    fetchDesignTasks();
  };

  const updateDesignTask = async (taskId, form) => {
    const { error } = await supabase.from('design_tasks').update(buildDesignTaskPayload(form)).eq('id', taskId);
    if (error) { console.error('[更新排程任務失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    showToast('已更新排程項目');
    setDesignTaskModalTarget(null);
    fetchDesignTasks();
  };

  const markDesignTaskDone = async (taskId) => {
    const { error } = await supabase.from('design_tasks').update({ status: 'done' }).eq('id', taskId);
    if (error) { console.error('[更新排程任務狀態失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    fetchDesignTasks();
  };

  const deleteDesignTask = async (taskId) => {
    const { error } = await supabase.from('design_tasks').delete().eq('id', taskId);
    if (error) { console.error('[刪除排程任務失敗]', error.message, error); showToast('刪除失敗：' + error.message); return; }
    fetchDesignTasks();
  };

  // ---- 內部其他文件校稿區：不綁定特定方塊，admin／內部夥伴專用 ----
  const fetchInternalDocs = useCallback(async () => {
    const { data, error } = await supabase.from('internal_docs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[讀取內部文件失敗]', error.message, error); return; }
    setInternalDocs(data || []);
  }, []);

  const fetchInternalDocComments = useCallback(async () => {
    const { data, error } = await supabase.from('comments').select('*').not('internal_doc_id', 'is', null);
    if (error) { console.error('[讀取內部文件留言失敗]', error.message, error); return; }
    setInternalDocComments(data || []);
  }, []);

  const addInternalDoc = async (form) => {
    if (!session) return;
    if (!form.version_label.trim() || !form.file_url.trim()) { showToast('請填寫名稱與連結'); return; }
    setInternalDocUploading(true);
    const { error } = await supabase.from('internal_docs').insert({
      version_label: form.version_label, file_url: form.file_url, note: form.note, uploaded_by: session.user.email,
    });
    setInternalDocUploading(false);
    if (error) { console.error('[新增內部文件失敗]', error.message, error); showToast('新增失敗：' + error.message); return; }
    showToast('已新增');
    setShowAddInternalDocModal(false);
    setInternalDocUploadForm({ version_label: '', file_url: '', note: '' });
    fetchInternalDocs();
  };

  const editInternalDoc = async (fileId, form) => {
    const { error } = await supabase.from('internal_docs').update({ version_label: form.version_label, file_url: form.file_url, note: form.note }).eq('id', fileId);
    if (error) { console.error('[更新內部文件失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    showToast('已更新');
    fetchInternalDocs();
  };

  const deleteInternalDoc = async (fileId) => {
    const { error } = await supabase.from('internal_docs').delete().eq('id', fileId);
    if (error) { console.error('[刪除內部文件失敗]', error.message, error); showToast('刪除失敗：' + error.message); return; }
    showToast('已刪除');
    fetchInternalDocs();
  };

  const postInternalDocComment = async (fileId, content, pageNumber) => {
    if (!session) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: '__internal_docs__', user_email: session.user.email, content, is_internal: true,
      internal_doc_id: fileId, page_number: pageNumber ?? null,
    });
    if (error) { console.error('[內部文件留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchInternalDocComments();
  };

  useEffect(() => {
    if (!showAdminPanel) return;
    fetchAllProfiles();
    const channel = supabase
      .channel(`${PROFILES_TABLE}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: PROFILES_TABLE }, () => fetchAllProfiles())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showAdminPanel, fetchAllProfiles]);

  const setUserRole = async (user, role) => {
    const { error } = await updateProfileRow(user.id, { role, status: 'approved' });
    if (error) {
      console.error(`[更新使用者角色失敗]`, error.message, error);
      showToast('更新失敗：' + error.message);
      return;
    }
    showToast(`已將 ${user.nickname || user.email || user.id} 設為 ${ROLE_META[role] ? ROLE_META[role].label : role}`);
    fetchAllProfiles();
  };

  // ---- 使用者名冊（email -> 暱稱/頭貼），用來把留言、上傳者從 email 轉成暱稱顯示 ----
  const fetchProfileDirectory = useCallback(async () => {
    const { data, error } = await supabase.from(PROFILES_TABLE).select('email, nickname, avatar_url');
    if (error) {
      console.error(`[讀取使用者名冊失敗]`, error.message, error);
      return;
    }
    const map = {};
    (data || []).forEach((p) => { if (p.email) map[p.email] = { nickname: p.nickname, avatar_url: p.avatar_url }; });
    setProfileDirectory(map);
  }, []);

  const resolveAuthorName = useCallback((email) => {
    if (!email) return '未知使用者';
    const entry = profileDirectory[email];
    return entry && entry.nickname ? entry.nickname : email;
  }, [profileDirectory]);

  // ---- 全部方塊的狀態徽章（草稿/美編/影片/文章），只有管理者與內部夥伴需要看 ----
  const fetchAllCubeStatus = useCallback(async () => {
    const [draftsRes, finalRes, videosRes, boxRes, articlesRes] = await Promise.all([
      supabase.from('cube_drafts').select('cube_name'),
      supabase.from('cube_final').select('cube_name'),
      supabase.from('cube_videos').select('cube_name'),
      supabase.from('cube_box').select('cube_name'),
      supabase.from('cube_articles').select('cube_name, content'),
    ]);
    if (draftsRes.error) console.error('[讀取草稿狀態失敗]', draftsRes.error.message, draftsRes.error);
    if (finalRes.error) console.error('[讀取美編狀態失敗]', finalRes.error.message, finalRes.error);
    if (videosRes.error) console.error('[讀取影片狀態失敗]', videosRes.error.message, videosRes.error);
    if (boxRes.error) console.error('[讀取紙盒狀態失敗]', boxRes.error.message, boxRes.error);
    if (articlesRes.error) console.error('[讀取文章狀態失敗]', articlesRes.error.message, articlesRes.error);

    const map = {};
    const mark = (rows, key) => {
      (rows || []).forEach((row) => {
        if (!row.cube_name) return;
        if (!map[row.cube_name]) map[row.cube_name] = { draft: false, edited: false, video: false, box: false, article: false };
        map[row.cube_name][key] = true;
      });
    };
    mark(draftsRes.data, 'draft');
    mark(finalRes.data, 'edited');
    mark(videosRes.data, 'video');
    mark(boxRes.data, 'box');
    // 文章的資料列就算內容被清空也還是會存在，這裡要求「有實際文字內容」才算數，
    // 不然文章被清空/刪除後，圖示會一直留著不會消失。
    mark((articlesRes.data || []).filter((row) => row.content && row.content.trim().length > 0), 'article');
    setCubeStatusMap(map);
  }, []);

  useEffect(() => {
    if (!profile || profile.status !== 'approved' || !profile.nickname) return;
    const role = profile.role;
    fetchProfileDirectory();
    if (role === 'admin' || role === 'internal_partner' || role === 'designer') {
      fetchAllCubeStatus();
    }
    if (role === 'admin' || role === 'internal_partner') {
      fetchTasks();
      if (role === 'admin') fetchRecentComments();
    }
    if (role === 'admin' || role === 'designer') {
      fetchDesignTasks();
    }
  }, [profile, fetchProfileDirectory, fetchAllCubeStatus, fetchTasks, fetchRecentComments, fetchDesignTasks]);

  // admin 訂閱全站留言（含勘誤與建議回報）的即時異動，有人送出新留言/回報時鈴鐺紅點會立刻出現，不用重新整理頁面
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    const channel = supabase
      .channel('comments-admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => fetchRecentComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, fetchRecentComments]);

  const fetchDraftFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_drafts').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取草稿講義失敗]', error.message, error); setDraftFiles([]); } else setDraftFiles(data || []);
  }, []);

  const fetchEditedFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_final').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取美編講義失敗]', error.message, error); setEditedFiles([]); } else setEditedFiles(data || []);
  }, []);

  const fetchVideoFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_videos').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取複習影片失敗]', error.message, error); setVideoFiles([]); } else setVideoFiles(data || []);
  }, []);

  const fetchBoxFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_box').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取紙盒檔案失敗]', error.message, error); setBoxFiles([]); } else setBoxFiles(data || []);
  }, []);

  const fetchCubeComments = useCallback(async (cubeName) => {
    setCommentsLoading(true);
    const { data, error } = await supabase.from('comments').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取留言失敗]', error.message, error); setCubeComments([]); } else setCubeComments(data || []);
    setCommentsLoading(false);
  }, []);

  const fetchCubeArticle = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_articles').select('*').eq('cube_name', cubeName).maybeSingle();
    if (error) { console.error('[讀取文章失敗]', error.message, error); setCubeArticle(null); } else setCubeArticle(data);
  }, []);

  useEffect(() => {
    if (view !== 'cube' || !selectedCube) return;
    const role = profile ? profile.role : null;
    fetchDraftFiles(selectedCube.name);
    fetchEditedFiles(selectedCube.name);
    fetchVideoFiles(selectedCube.name);
    fetchBoxFiles(selectedCube.name);
    fetchCubeComments(selectedCube.name);
    if (role === 'admin' || role === 'internal_partner' || role === 'designer') fetchCubeArticle(selectedCube.name);

    const draftsChannel = supabase
      .channel(`drafts-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_drafts', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchDraftFiles(selectedCube.name))
      .subscribe();
    const finalChannel = supabase
      .channel(`final-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_final', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchEditedFiles(selectedCube.name))
      .subscribe();
    const videosChannel = supabase
      .channel(`videos-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_videos', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchVideoFiles(selectedCube.name))
      .subscribe();
    const boxChannel = supabase
      .channel(`box-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_box', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchBoxFiles(selectedCube.name))
      .subscribe();
    const commentsChannel = supabase
      .channel(`comments-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchCubeComments(selectedCube.name))
      .subscribe();
    const articleChannel = supabase
      .channel(`article-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_articles', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchCubeArticle(selectedCube.name))
      .subscribe();

    return () => {
      supabase.removeChannel(draftsChannel);
      supabase.removeChannel(finalChannel);
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(boxChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(articleChannel);
    };
  }, [view, selectedCube, profile, fetchDraftFiles, fetchEditedFiles, fetchVideoFiles, fetchBoxFiles, fetchCubeComments, fetchCubeArticle]);

  const refetchCategory = (category, cubeName) => {
    if (category === 'draft') fetchDraftFiles(cubeName);
    else if (category === 'edited') fetchEditedFiles(cubeName);
    else if (category === 'video') fetchVideoFiles(cubeName);
    else if (category === 'box') fetchBoxFiles(cubeName);
  };

  const addCubeFile = async (category, form) => {
    if (!session) { console.error('[新增檔案失敗] 沒有有效的 session'); alert('請先登入'); return; }
    if (!form.version_label.trim() || !form.file_url.trim()) { showToast('請填寫名稱與連結'); return; }
    const table = CATEGORY_TABLE[category];
    const payload = {
      cube_name: selectedCube.name,
      version_label: form.version_label,
      file_url: form.file_url,
      note: form.note,
      uploaded_by: session.user.email,
    };
    setUploading(true);
    const { error } = await supabase.from(table).insert(payload);
    setUploading(false);
    if (error) { console.error(`[新增${table}失敗]`, error.message, error); showToast('新增失敗：' + error.message); return; }
    showToast('已新增');
    setShowAddFileModal(null);
    setUploadForm({ version_label: '', file_url: '', note: '' });
    refetchCategory(category, selectedCube.name);
    fetchAllCubeStatus();
  };

  const editCubeFile = async (category, fileId, form) => {
    const table = CATEGORY_TABLE[category];
    const payload = { version_label: form.version_label, file_url: form.file_url, note: form.note };
    const { error } = await supabase.from(table).update(payload).eq('id', fileId);
    if (error) { console.error(`[更新${table}失敗]`, error.message, error); showToast('更新失敗：' + error.message); return; }
    showToast('已更新');
    refetchCategory(category, selectedCube.name);
  };

  const deleteCubeFile = async (category, fileId) => {
    const table = CATEGORY_TABLE[category];
    const { error } = await supabase.from(table).delete().eq('id', fileId);
    if (error) { console.error(`[刪除${table}失敗]`, error.message, error); showToast('刪除失敗：' + error.message); return; }
    showToast('已刪除');
    refetchCategory(category, selectedCube.name);
    fetchAllCubeStatus();
  };

  // 只有 admin 能勾選「哪一個美編講義版本」要對外公開給一般講師看，一次只能有一個是公開狀態
  const setPublishedVersion = async (fileId) => {
    // 現在允許同時有多個版本對外公開，所以這裡不會再把同一顆方塊的其他版本清成非公開，
    // 只單獨把這一筆設為公開。
    const { error } = await supabase.from('cube_final').update({ is_public: true }).eq('id', fileId);
    if (error) { console.error('[設定公開版本失敗]', error.message, error); showToast('設定失敗：' + error.message); return; }
    showToast('已設為對外公開版本');
    fetchEditedFiles(selectedCube.name);
  };

  const setUnpublishedVersion = async (fileId) => {
    const { error } = await supabase.from('cube_final').update({ is_public: false }).eq('id', fileId);
    if (error) { console.error('[取消對外公開失敗]', error.message, error); showToast('取消失敗：' + error.message); return; }
    showToast('已取消對外公開，講師目前看不到任何美編講義版本');
    fetchEditedFiles(selectedCube.name);
  };

  // 勘誤與建議回報：借用 comments 表，掛在目前檢視的方塊底下，內容加上識別前綴，
  // 這樣就能直接搭上 admin 既有的「最新留言與校稿動態」通知，不用另外蓋一套通知機制
  const submitReport = async (title, desc) => {
    if (!selectedCube || !session) return { error: new Error('目前沒有選取方塊，請重新開啟回報視窗') };
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name,
      user_email: session.user.email,
      content: `【勘誤與建議回報】${title}${desc ? `\n${desc}` : ''}`,
      is_internal: true,
    });
    if (error) console.error('[勘誤與建議回報送出失敗]', error.message, error);
    return { error };
  };

  const postGeneralComment = async (content, isInternal) => {
    if (!selectedCube || !session) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: isInternal,
    });
    if (error) { console.error('[留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
  };

  const postFileComment = async (category, fileId, content, pageNumber) => {
    if (!selectedCube || !session) return;
    const column = CATEGORY_COMMENT_COLUMN[category];
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: true, [column]: fileId,
      page_number: pageNumber ?? null,
    });
    if (error) { console.error('[版本留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
  };

  const editFileComment = async (commentId, newContent) => {
    const { error } = await supabase.from('comments').update({ content: newContent }).eq('id', commentId);
    if (error) { console.error('[編輯留言失敗]', error.message, error); showToast('編輯留言失敗：' + error.message); return; }
    if (selectedCube) fetchCubeComments(selectedCube.name);
    fetchInternalDocComments();
  };

  const deleteFileComment = async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) { console.error('[刪除留言失敗]', error.message, error); showToast('刪除留言失敗：' + error.message); return; }
    if (selectedCube) fetchCubeComments(selectedCube.name);
    fetchInternalDocComments();
  };

  const postArticleComment = async (content) => {
    if (!selectedCube || !session || !cubeArticle) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: true, article_id: cubeArticle.id,
    });
    if (error) { console.error('[文章留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
  };

  const saveArticle = async (content) => {
    const { error } = await supabase.from('cube_articles').upsert(
      { cube_name: selectedCube.name, content, updated_by: session.user.email, updated_at: new Date().toISOString() },
      { onConflict: 'cube_name' }
    );
    if (error) { console.error('[文章儲存失敗]', error.message, error); showToast('儲存失敗：' + error.message); return; }
    showToast('文章已儲存');
    fetchCubeArticle(selectedCube.name);
    fetchAllCubeStatus();
  };

  const handleCubeImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !selectedCube) return;
    if (!session) { alert('請先登入後再上傳'); return; }
    const fileName = getCubeImageStorageFileName(selectedCube.name);
    if (!fileName) {
      console.error(`[圖片上傳失敗] CUBE_IMAGE_MAP 找不到「${selectedCube.name}」對應的檔名`);
      alert('這顆方塊尚未在 CUBE_IMAGE_MAP 設定檔名，請先請工程師新增對照');
      return;
    }
    const result = await handleUpload(file, fileName);
    if (result.ok) {
      showToast('圖片已更新');
      setBrokenImages((prev) => {
        const next = { ...prev };
        delete next[selectedCube.id];
        delete next[`detail-${selectedCube.id}`];
        return next;
      });
      setImageVersion((prev) => ({ ...prev, [selectedCube.id]: Date.now() }));
    }
  };

  const openCube = (cube) => { setSelectedCube(cube); setView('cube'); };
  const backToDashboard = () => {
    if (selectedCube) setOpenTier(selectedCube.tier.score);
    setView('dashboard');
    setSelectedCube(null);
    setDraftFiles([]);
    setEditedFiles([]);
    setVideoFiles([]);
    setBoxFiles([]);
    setCubeComments([]);
    setCubeArticle(null);
  };

  // ---- 首頁一律最先顯示,不管有沒有登入——按下「進入完整教材系統」才會走到下面的登入/審核流程 ----
  if (view === 'landing') {
    return (
      <LandingScreen
        imageError={learningMapError}
        onImageError={() => setLearningMapError(true)}
        onEnter={() => { sessionStorage.setItem('dc_enter_intent', '1'); setView('dashboard'); }}
        onOpenCube={openCube}
        brokenImages={brokenImages}
        setBrokenImages={setBrokenImages}
        role={profile ? profile.role : null}
        cubeStatusMap={cubeStatusMap}
        theme={profile ? profile.theme : 'dark'}
      />
    );
  }

  // ---- 防呆守門：任何必要狀態尚未就緒一律顯示載入畫面，絕不直接渲染主畫面 ----
  if (authLoading && !session) {
    return <LoadingScreen label="連線中..." />;
  }

  if (!session) {
    return <AuthScreen onGoogleLogin={handleGoogleLogin} authError={authError} authLoading={authLoading} />;
  }

  if (profileLoading || !profile) {
    return <LoadingScreen label="讀取使用者權限中..." />;
  }

  if (profile.status !== 'approved') {
    return <PendingApprovalScreen email={session.user.email} onLogout={handleLogout} />;
  }

  // 新手引導：Profiles 裡沒有暱稱，強制先完成設定才能看到主畫面
  if (!profile.nickname) {
    return <ProfileSetup mode="setup" initialNickname="" initialAvatarUrl={null} onSave={saveProfile} onBack={handleLogout} saving={savingProfile} />;
  }

  const role = profile.role;
  const theme = profile.theme || 'dark';

  const hasUnseenActivity = role === 'admin'
    ? recentComments.some((c) => new Date(c.created_at) > new Date(profile.notif_seen_at || 0))
    : role === 'internal_partner'
      ? tasks.some((t) => t.assigned_to === session.user.email && t.status !== 'done')
      : false;
  const hasPendingDesignTasks = role === 'designer'
    ? designTasks.some((t) => t.assigned_to === session.user.email && t.status !== 'done')
    : role === 'admin'
      ? designTasks.some((t) => t.status !== 'done')
      : false;
  if (!role || !ROLE_META[role]) {
    console.error(`[角色錯誤] profile.role 的值「${role}」不在 ROLE_META 定義的角色中`);
    return <LoadingScreen label="角色設定異常，請聯繫總監..." />;
  }

  if (!CUBE_IMAGE_MAP || Object.keys(CUBE_IMAGE_MAP).length === 0) {
    console.error('[CUBE_IMAGE_MAP 錯誤] 圖片對照表是空的');
    return <LoadingScreen label="載入圖片對照表中..." />;
  }

  const canManageFiles = role === 'admin' || role === 'internal_partner' || role === 'designer';

  const instructorComments = cubeComments.filter((c) => !c.is_internal && !c.draft_id && !c.final_id && !c.video_id && !c.box_id && !c.article_id);
  const articleComments = cubeArticle ? cubeComments.filter((c) => c.article_id === cubeArticle.id) : [];

  const commentAuthorMap = (rows) => rows.map((r) => ({ id: r.id, author: resolveAuthorName(r.user_email), text: r.content, time: r.created_at, email: r.user_email }));

  const detailImageUrlBase = selectedCube ? getCubeImageUrl(selectedCube.name) : null;
  const detailImageUrl = detailImageUrlBase && selectedCube && imageVersion[selectedCube.id]
    ? `${detailImageUrlBase}?v=${imageVersion[selectedCube.id]}`
    : detailImageUrlBase;
  const detailStatus = selectedCube ? { draft: draftFiles.length > 0, edited: editedFiles.length > 0, video: videoFiles.length > 0, box: boxFiles.length > 0, article: !!cubeArticle } : null;

  let prevCube = null;
  let nextCube = null;
  if (selectedCube) {
    const idx = ALL_CUBES_FLAT.findIndex((c) => c.id === selectedCube.id);
    if (idx >= 0) {
      prevCube = ALL_CUBES_FLAT[(idx - 1 + ALL_CUBES_FLAT.length) % ALL_CUBES_FLAT.length];
      nextCube = ALL_CUBES_FLAT[(idx + 1) % ALL_CUBES_FLAT.length];
    }
  }

  if (view === 'profile') {
    return (
      <div className={`theme-${theme} min-h-screen bg-[var(--bg)]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <style>{FONT_IMPORT}</style>
        <Header
          profile={profile}
          session={session}
          role={role}
          onOpenAdmin={() => setShowAdminPanel(true)}
          onOpenProfile={() => {}}
          onLogout={handleLogout}
          logoError={logoError}
          onLogoError={() => setLogoError(true)}
          onGoHome={() => setView('landing')}
          hasUnseenActivity={hasUnseenActivity}
          onOpenNotif={() => { setShowNotifPanel(true); if (role === 'admin') markNotificationsSeen(); }}
          onOpenAssign={() => { fetchAllProfiles(); setShowAssignModal(true); }}
          onOpenInternalDocs={() => { fetchInternalDocs(); fetchInternalDocComments(); setShowInternalDocsPanel(true); }}
          onOpenSchedule={() => { setView('schedule'); fetchDesignTasks(); if (role === 'admin') fetchAllProfiles(); }}
          hasPendingDesignTasks={hasPendingDesignTasks}
          onOpenGrayscale={() => setView('grayscale')}
        />
        <ProfileSetup
          mode="edit"
          initialNickname={profile.nickname}
          initialAvatarUrl={profile.avatar_url}
          onSave={saveProfile}
          onCancel={() => setView('dashboard')}
          saving={savingProfile}
          theme={theme}
          onChangeTheme={updateTheme}
        />
        {showAdminPanel && (
          <AdminDrawer allUsers={allProfiles} onSetRole={setUserRole} onClose={() => setShowAdminPanel(false)} loading={adminLoading} />
        )}
      </div>
    );
  }

  return (
    <div className={`theme-${theme} min-h-screen bg-[var(--bg)] text-[var(--fg)]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>

      <Header
        profile={profile}
        session={session}
        role={role}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenProfile={() => setView('profile')}
        onLogout={handleLogout}
        logoError={logoError}
        onLogoError={() => setLogoError(true)}
        onGoHome={() => setView('landing')}
        hasUnseenActivity={hasUnseenActivity}
        onOpenNotif={() => { setShowNotifPanel(true); if (role === 'admin') markNotificationsSeen(); }}
        onOpenAssign={() => { fetchAllProfiles(); setShowAssignModal(true); }}
        onOpenInternalDocs={() => { fetchInternalDocs(); fetchInternalDocComments(); setShowInternalDocsPanel(true); }}
        onOpenSchedule={() => { setView('schedule'); fetchDesignTasks(); if (role === 'admin') fetchAllProfiles(); }}
        hasPendingDesignTasks={hasPendingDesignTasks}
        onOpenGrayscale={() => setView('grayscale')}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'schedule' && (
          <ScheduleView
            role={role}
            currentUserEmail={session.user.email}
            session={session}
            tasks={designTasks}
            onOpenCreate={() => { fetchAllProfiles(); setDesignTaskModalTarget('new'); }}
            onEdit={(t) => { fetchAllProfiles(); setDesignTaskModalTarget(t); }}
            onMarkDone={markDesignTaskDone}
            onDelete={deleteDesignTask}
            resolveAuthorName={resolveAuthorName}
          />
        )}

        {view === 'grayscale' && (role === 'designer' || role === 'admin') && <GrayscaleTool />}

        {view === 'dashboard' && (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
              <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-3xl font-black text-[var(--fg)] uppercase tracking-widest">
                綜合能力認證分數地圖
              </h1>
              {canManageFiles && (
                <button
                  onClick={() => setShowOverviewDrawer(true)}
                  className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> 教材總覽
                </button>
              )}
            </div>
            <p className="text-[var(--mutedFg)] text-base mb-8">依 31 顆魔術方塊的認證分數分類，點擊分數展開對應方塊清單</p>
            <div className="space-y-4">
              {TIERS.map((tier) => {
                const isOpen = openTier === tier.score;
                return (
                  <div key={tier.score} className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer overflow-hidden ">
                    <button
                      onClick={() => setOpenTier(isOpen ? null : tier.score)}
                      className="w-full flex items-center justify-between p-5 hover:bg-[#00ff88]/10 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 cyber-chamfer-sm flex items-center justify-center font-bold text-xl font-mono ${tier.bg} ${tier.text}`}>
                          {tier.badge}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">{tier.label}</p>
                          <p className="text-sm text-[var(--mutedFg)]">共 {tier.cubes.length} 顆方塊</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-[var(--mutedFg)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5 pt-0">
                        {tier.cubes.map((name) => {
                          const cube = { id: `${tier.score}__${name}`, name, tier };
                          const imgUrl = getCubeImageUrl(name);
                          const status = cubeStatusMap[name];
                          return (
                            <button
                              key={cube.id}
                              onClick={() => openCube(cube)}
                              className="group bg-[var(--card)] hover:shadow-[0_0_15px_rgba(255,51,102,0.3)] border border-[var(--border)] hover:border-[#ff3366] cyber-chamfer overflow-hidden flex flex-col transition text-left"
                            >
                              <div className="aspect-square bg-[var(--muted)] overflow-hidden flex items-center justify-center">
                                {imgUrl && !brokenImages[cube.id] ? (
                                  <img
                                    src={imgUrl}
                                    alt={cube.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                    onError={() => {
                                      console.warn(`[圖片載入失敗] 方塊「${cube.name}」讀取失敗：${imgUrl}`);
                                      setBrokenImages((prev) => ({ ...prev, [cube.id]: true }));
                                    }}
                                  />
                                ) : (
                                  <Box className="w-8 h-8 text-[var(--mutedFg)]" />
                                )}
                              </div>
                              <div className="p-3 text-center">
                                <span className="text-base font-medium text-[var(--fg)]">{cube.name}</span>
                                {canManageFiles && <CubeBadges status={status} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                        {canManageFiles && (
                          <div className="flex justify-end px-5 pb-4">
                            <p className="text-sm text-[var(--mutedFg)] font-mono">
                              ✏️ 草稿講義　📖 美編定稿　📷 複習影片　📦 紙盒檔案　📝 介紹文章
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'cube' && selectedCube && (
          <div>
            <div className="flex items-center gap-2 text-base text-[var(--mutedFg)] mb-4 flex-wrap">
              <button onClick={backToDashboard} className="flex items-center gap-1 hover:text-[var(--accentText)] transition">
                <ArrowLeft className="w-4 h-4" /> 返回總覽
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{selectedCube.tier.label}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[var(--fg)]">{selectedCube.name}</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <CubeNavButton direction="prev" cube={prevCube} onNavigate={openCube} brokenImages={brokenImages} setBrokenImages={setBrokenImages} />
              <div className="flex-1 flex items-center justify-between flex-wrap gap-4 bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-6 ">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 overflow-hidden cyber-chamfer-sm flex items-center justify-center shrink-0 ${selectedCube.tier.bg} ${selectedCube.tier.text}`}
                >
                  {detailImageUrl && !brokenImages[`detail-${selectedCube.id}`] ? (
                    <img
                      src={detailImageUrl}
                      alt={selectedCube.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.warn(`[圖片載入失敗] 方塊詳情頁「${selectedCube.name}」讀取失敗：${detailImageUrl}`);
                        setBrokenImages((prev) => ({ ...prev, [`detail-${selectedCube.id}`]: true }));
                      }}
                    />
                  ) : (
                    <Box className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-2xl font-black text-[var(--fg)] uppercase tracking-wide">{selectedCube.name}</h2>
                    {canManageFiles && <CubeBadges status={detailStatus} />}
                  </div>
                  <p className="text-sm text-[var(--mutedFg)]">{typeof selectedCube.tier.score === 'number' ? `認證分數 ${selectedCube.tier.score} 分・` : ''}{selectedCube.tier.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {role === 'admin' && (
                  <>
                    <input type="file" accept="image/*" className="hidden" id="cube-image-input" onChange={handleCubeImageUpload} />
                    <button
                      onClick={() => document.getElementById('cube-image-input').click()}
                      className="flex items-center gap-1.5 border border-[var(--border)] text-[var(--fg)] bg-transparent text-base font-mono uppercase tracking-wider px-4 py-2.5 cyber-chamfer hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                    >
                      <ImagePlus className="w-4 h-4" /> 更換方塊圖片
                    </button>
                  </>
                )}
                {role === 'general_instructor' && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-base font-mono uppercase tracking-wider px-4 py-2.5 cyber-chamfer hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
                  >
                    <AlertTriangle className="w-4 h-4" /> 勘誤與建議回報
                  </button>
                )}
              </div>
              </div>
              <CubeNavButton direction="next" cube={nextCube} onNavigate={openCube} brokenImages={brokenImages} setBrokenImages={setBrokenImages} />
            </div>

            {(role === 'admin' || role === 'internal_partner' || role === 'designer') && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VersionedFileBlock
                    title="草稿講義"
                    icon={FileText}
                    files={draftFiles}
                    canManage={canManageFiles}
                    resolveAuthorName={resolveAuthorName}
                    onAdd={() => setShowAddFileModal({ category: 'draft', label: '草稿講義版本' })}
                    onEdit={(fileId, form) => editCubeFile('draft', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('draft', fileId)}
                    onReview={(f) => setReviewFile({ file: f, category: 'draft', kindLabel: '草稿講義' })}
                    onPreview={(f) => setPreviewFile({ file: f, category: 'draft', kindLabel: '草稿講義', watermark: false })}
                  />
                  <VersionedFileBlock
                    title="美編講義"
                    icon={FileText}
                    files={editedFiles}
                    canManage={canManageFiles}
                    canPublish={role === 'admin'}
                    resolveAuthorName={resolveAuthorName}
                    onAdd={() => setShowAddFileModal({ category: 'edited', label: '美編講義版本' })}
                    onEdit={(fileId, form) => editCubeFile('edited', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('edited', fileId)}
                    onPublish={setPublishedVersion}
                    onUnpublish={setUnpublishedVersion}
                    onReview={(f) => setReviewFile({ file: f, category: 'edited', kindLabel: '美編講義' })}
                    onPreview={(f) => setPreviewFile({ file: f, category: 'edited', kindLabel: '美編講義', watermark: false })}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimpleFileBlock
                    title="複習影片放置區"
                    icon={Video}
                    files={videoFiles}
                    canManage={canManageFiles}
                    comments={cubeComments}
                    commentField="video_id"
                    commentsLoading={commentsLoading}
                    resolveAuthorName={resolveAuthorName}
                    onAdd={() => setShowAddFileModal({ category: 'video', label: '複習影片' })}
                    onEdit={(fileId, form) => editCubeFile('video', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('video', fileId)}
                    onComment={(fileId, text) => postFileComment('video', fileId, text)}
                    onCommentEdit={editFileComment}
                    onCommentDelete={deleteFileComment}
                    currentUserEmail={session.user.email}
                    canModerateComments={canManageFiles}
                  />
                  <SimpleFileBlock
                    title="紙盒檔案放置區"
                    icon={FolderOpen}
                    files={boxFiles}
                    canManage={canManageFiles}
                    onAdd={() => setShowAddFileModal({ category: 'box', label: '紙盒檔案' })}
                    onEdit={(fileId, form) => editCubeFile('box', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('box', fileId)}
                  />
                </div>

                <ArticleBlock
                  article={cubeArticle}
                  canEdit={role === 'admin'}
                  comments={commentAuthorMap(articleComments)}
                  commentsLoading={commentsLoading}
                  onSave={saveArticle}
                  onComment={postArticleComment}
                  onCommentEdit={editFileComment}
                  onCommentDelete={deleteFileComment}
                  currentUserEmail={session.user.email}
                  canModerateComments={canManageFiles}
                />
              </div>
            )}

            {role === 'general_instructor' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <InstructorHandout
                    files={editedFiles}
                    session={session}
                    onPreview={(f) => setPreviewFile({ file: f, category: 'edited', kindLabel: '美編講義', watermark: true })}
                  />
                  <SimpleFileBlock
                    title="複習影片"
                    icon={Video}
                    files={videoFiles}
                    canManage={false}
                    comments={cubeComments}
                    commentField="video_id"
                    commentsLoading={commentsLoading}
                    resolveAuthorName={resolveAuthorName}
                    onComment={(fileId, text) => postFileComment('video', fileId, text)}
                    onCommentEdit={editFileComment}
                    onCommentDelete={deleteFileComment}
                    currentUserEmail={session.user.email}
                    canModerateComments={false}
                  />
                  <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
                    <CommentSection
                      title="講師交流留言區"
                      icon={MessageSquare}
                      comments={commentAuthorMap(instructorComments)}
                      loading={commentsLoading}
                      placeholder="分享您的教學心得..."
                      onAdd={(t) => postGeneralComment(t, false)}
                      onEdit={editFileComment}
                      onDelete={deleteFileComment}
                      currentUserEmail={session.user.email}
                      canModerate={false}
                    />
                  </div>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 h-fit ">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-[var(--mutedFg)]" />
                    <h4 className="text-base font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">權限說明</h4>
                  </div>
                  <p className="text-sm text-[var(--mutedFg)] leading-relaxed">
                    您目前以「一般外部講師」身分檢視，可查看總監公開的美編講義與複習影片並留言。如需查閱草稿版本、紙盒檔案或介紹文章，請聯繫教材總監升級為內部夥伴。
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showAdminPanel && (
        <AdminDrawer allUsers={allProfiles} onSetRole={setUserRole} onClose={() => setShowAdminPanel(false)} loading={adminLoading} />
      )}

      {showOverviewDrawer && (
        <ContentOverviewDrawer cubeStatusMap={cubeStatusMap} onOpenCube={openCube} onClose={() => setShowOverviewDrawer(false)} />
      )}

      {showAddFileModal && (
        <AddFileModal
          kindLabel={showAddFileModal.label}
          form={uploadForm}
          setForm={setUploadForm}
          onClose={() => setShowAddFileModal(null)}
          onSubmit={() => addCubeFile(showAddFileModal.category, uploadForm)}
          submitting={uploading}
        />
      )}

      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} onSubmit={submitReport} />}

      {reviewFile && (
        <ReviewModal
          file={reviewFile.file}
          category={reviewFile.category}
          kindLabel={reviewFile.kindLabel}
          comments={
            reviewFile.category === 'other_docs'
              ? internalDocComments.filter((c) => c.internal_doc_id === reviewFile.file.id)
              : cubeComments.filter((c) => c[CATEGORY_COMMENT_COLUMN[reviewFile.category]] === reviewFile.file.id)
          }
          commentsLoading={commentsLoading}
          resolveAuthorName={resolveAuthorName}
          onComment={(text, page) =>
            reviewFile.category === 'other_docs'
              ? postInternalDocComment(reviewFile.file.id, text, page)
              : postFileComment(reviewFile.category, reviewFile.file.id, text, page)
          }
          onEditComment={editFileComment}
          onDeleteComment={deleteFileComment}
          onClose={() => setReviewFile(null)}
          session={session}
        />
      )}

      {previewFile && (
        <FullscreenPreviewModal
          file={previewFile.file}
          category={previewFile.category}
          kindLabel={previewFile.kindLabel}
          watermark={previewFile.watermark}
          session={session}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {showNotifPanel && (
        <NotificationPanel
          role={role}
          recentComments={recentComments}
          tasks={tasks}
          currentUserEmail={session.user.email}
          resolveAuthorName={resolveAuthorName}
          onClose={() => setShowNotifPanel(false)}
          onMarkTaskDone={markTaskDone}
        />
      )}

      {showAssignModal && (
        <AssignTaskModal
          cubeOptions={ALL_CUBES_FLAT.map((c) => c.name)}
          internalUsers={allProfiles.filter((p) => p.role === 'internal_partner' || p.role === 'admin')}
          onClose={() => setShowAssignModal(false)}
          onSubmit={assignTask}
          resolveAuthorName={resolveAuthorName}
        />
      )}

      {designTaskModalTarget && (
        <DesignTaskModal
          designers={allProfiles.filter((p) => p.role === 'designer')}
          cubeOptions={ALL_CUBES_FLAT.map((c) => c.name)}
          session={session}
          editingTask={designTaskModalTarget === 'new' ? null : designTaskModalTarget}
          onClose={() => setDesignTaskModalTarget(null)}
          onSubmit={designTaskModalTarget === 'new' ? createDesignTask : (form) => updateDesignTask(designTaskModalTarget.id, form)}
        />
      )}

      {showInternalDocsPanel && (
        <div className="fixed inset-0 bg-black/70 z-[240] flex justify-end" onClick={() => setShowInternalDocsPanel(false)}>
          <div className="w-full max-w-2xl h-full bg-[var(--bg)] border-l-2 border-[#00ff88] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--fg)] uppercase tracking-wide font-mono flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[var(--accentText)]" /> 內部文件校稿區
              </h2>
              <button onClick={() => setShowInternalDocsPanel(false)} className="text-[var(--mutedFg)] hover:text-[var(--fg)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--mutedFg)] mb-4">僅 admin／內部夥伴看得到，外部講師完全看不到這個區塊。</p>
            <VersionedFileBlock
              title="其他內部文件"
              icon={FolderOpen}
              files={internalDocs}
              canManage
              onAdd={() => setShowAddInternalDocModal(true)}
              onEdit={editInternalDoc}
              onDelete={deleteInternalDoc}
              onReview={(f) => setReviewFile({ file: f, category: 'other_docs', kindLabel: '內部文件' })}
              onPreview={(f) => setPreviewFile({ file: f, category: 'other_docs', kindLabel: '內部文件', watermark: false })}
              resolveAuthorName={resolveAuthorName}
            />
          </div>
        </div>
      )}

      {showAddInternalDocModal && (
        <AddFileModal
          kindLabel="內部文件"
          form={internalDocUploadForm}
          setForm={setInternalDocUploadForm}
          onClose={() => setShowAddInternalDocModal(false)}
          onSubmit={() => addInternalDoc(internalDocUploadForm)}
          submitting={internalDocUploading}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[var(--card)] border border-[#00ff88]/50 text-base text-[var(--fg)] font-mono px-5 py-3 cyber-chamfer shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--accentText)]" /> {toast}
        </div>
      )}
    </div>
  );
}
