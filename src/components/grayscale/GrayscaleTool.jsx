import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Paintbrush, Pipette, Download } from 'lucide-react';


// ============================================================================
// 灰階降彩度工具（設計師專用）：上傳方塊照片 → 系統依「這張照片實際拍到的顏色」
// 自動分群、找出格線 → 點擊/筆刷降低彩度、即時預覽 → 下載。
//
// 這一版把辨識邏輯換掉了：舊版靠一張「系統標準色相表」逐像素比對，光線一變、
// 反光一多，跟標準表對不起來就整片誤判，使用者只能不斷用滴管校正，而且校正
// 一個顏色還會牽動別的顏色，越修越亂。新版不跟任何固定表比對，而是直接對「這
// 張照片自己」做顏色分群（k-means），色群完全依這張照片實際拍到的顏色決定——
// 換一顆燈光、換一支手機拍，分群還是抓得到同一批貼紙，因為判斷的是「這幾群顏
// 色彼此夠不夠像」，不是「跟某個固定基準色差多少」。分群的色彩空間也從 HSV 換
// 成 CIE Lab：HSV 的色相在低飽和度（偏灰、反光強）時非常不穩定，兩個人眼看起來
// 幾乎一樣的顏色，色相角度可能差很多；Lab 是刻意設計成「數值距離≈人眼感受到的
// 色差」，兩個像素在 Lab 空間裡距離夠近，人眼幾乎一定也覺得是同一色。
// ============================================================================
export const GRAY_K = 8; // 目標分群數：略多於「6色貼紙+1黑框」，多出來的群交給下面合併

export const GRAY_MERGE_DIST = 14; // Lab 距離小於這個值的兩群，視為同一個顏色被拆成兩群，合併回去

export const GRAY_MIN_AREA_FRAC = 0.0006;

export const GRAY_MAX_AREA_FRAC = 0.35;

export const GRAY_EDGE_THRESHOLD = 55;


// sRGB(0~255) → CIE Lab（D65 白點）。分兩步：先還原成線性光（sRGB 有 gamma
// 編碼），再用標準矩陣轉 XYZ，最後轉 Lab。
export function graySrgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function grayRgbToLab(r, g, b) {
  const rl = graySrgbToLinear(r), gl = graySrgbToLinear(g), bl = graySrgbToLinear(b);
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function grayBuildLabBuffer(data, n) {
  const lab = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    const [L, A, B] = grayRgbToLab(data[idx], data[idx + 1], data[idx + 2]);
    lab[i * 3] = L; lab[i * 3 + 1] = A; lab[i * 3 + 2] = B;
  }
  return lab;
}


// k-means++ 初始化 + 標準 k-means 疊代，只在「抽樣」上跑（不管照片多大，樣本數
// 固定在兩萬上下），找中心點的時間不會隨照片解析度暴增；找到中心點以後才拿去對
// 「全部」像素做最近中心分類（見 grayAssignClusters），這樣既快又不會因為抽樣
// 漏掉小面積的貼紙。
export function grayKMeansFit(lab, n, k, iterations) {
  const targetSamples = 20000;
  const step = Math.max(1, Math.floor(n / targetSamples));
  const idxList = [];
  for (let i = 0; i < n; i += step) idxList.push(i);
  const ns = idxList.length;
  const sample = new Float32Array(ns * 3);
  for (let i = 0; i < ns; i++) {
    const src = idxList[i] * 3;
    sample[i * 3] = lab[src]; sample[i * 3 + 1] = lab[src + 1]; sample[i * 3 + 2] = lab[src + 2];
  }
  const centroids = new Float32Array(k * 3);
  const first = Math.floor(Math.random() * ns);
  centroids[0] = sample[first * 3]; centroids[1] = sample[first * 3 + 1]; centroids[2] = sample[first * 3 + 2];
  const distSq = new Float32Array(ns).fill(Infinity);
  for (let c = 1; c < k; c++) {
    for (let i = 0; i < ns; i++) {
      const dl = sample[i * 3] - centroids[(c - 1) * 3], da = sample[i * 3 + 1] - centroids[(c - 1) * 3 + 1], db = sample[i * 3 + 2] - centroids[(c - 1) * 3 + 2];
      const d = dl * dl + da * da + db * db;
      if (d < distSq[i]) distSq[i] = d;
    }
    let total = 0; for (let i = 0; i < ns; i++) total += distSq[i];
    if (total <= 0) { centroids[c * 3] = sample[0]; centroids[c * 3 + 1] = sample[1]; centroids[c * 3 + 2] = sample[2]; continue; }
    let r = Math.random() * total, acc = 0, chosen = ns - 1;
    for (let i = 0; i < ns; i++) { acc += distSq[i]; if (acc >= r) { chosen = i; break; } }
    centroids[c * 3] = sample[chosen * 3]; centroids[c * 3 + 1] = sample[chosen * 3 + 1]; centroids[c * 3 + 2] = sample[chosen * 3 + 2];
  }
  const assign = new Int32Array(ns);
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < ns; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const dl = sample[i * 3] - centroids[c * 3], da = sample[i * 3 + 1] - centroids[c * 3 + 1], db = sample[i * 3 + 2] - centroids[c * 3 + 2];
        const d = dl * dl + da * da + db * db;
        if (d < bestD) { bestD = d; best = c; }
      }
      assign[i] = best;
    }
    const sums = new Float64Array(k * 3), counts = new Float64Array(k);
    for (let i = 0; i < ns; i++) {
      const c = assign[i];
      sums[c * 3] += sample[i * 3]; sums[c * 3 + 1] += sample[i * 3 + 1]; sums[c * 3 + 2] += sample[i * 3 + 2];
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) { centroids[c * 3] = sums[c * 3] / counts[c]; centroids[c * 3 + 1] = sums[c * 3 + 1] / counts[c]; centroids[c * 3 + 2] = sums[c * 3 + 2] / counts[c]; }
    }
  }
  return centroids;
}


// 兩個中心點靠太近（同一個顏色因為漸層光影被硬拆成兩群），合併成一群，避免同一
// 顆貼紙內部因為亮暗不同被誤判出一條不存在的格線
export function grayMergeCloseClusters(centroids, k, mergeDist) {
  const parent = Array.from({ length: k }, (_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const dl = centroids[i * 3] - centroids[j * 3], da = centroids[i * 3 + 1] - centroids[j * 3 + 1], db = centroids[i * 3 + 2] - centroids[j * 3 + 2];
      if (Math.sqrt(dl * dl + da * da + db * db) < mergeDist) union(i, j);
    }
  }
  const rootToNew = new Map();
  const mergedList = [];
  for (let i = 0; i < k; i++) {
    const r = find(i);
    if (!rootToNew.has(r)) { rootToNew.set(r, mergedList.length); mergedList.push(r); }
  }
  const m = mergedList.length;
  const mergedCentroids = new Float32Array(m * 3);
  for (let i = 0; i < m; i++) {
    const root = mergedList[i];
    mergedCentroids[i * 3] = centroids[root * 3]; mergedCentroids[i * 3 + 1] = centroids[root * 3 + 1]; mergedCentroids[i * 3 + 2] = centroids[root * 3 + 2];
  }
  return { mergedCentroids, m };
}


// 用給定的中心點對「全部」像素做最近中心分類；work 解析度跟原生解析度匯出都呼
// 叫這個函式，且都是「用同一組中心點」——調色盤只由第一次分析時決定，不會因為
// 換解析度重跑分群而跟預覽時看到的結果對不起來
export function grayAssignClusters(lab, n, centroids, k) {
  const clusterId = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const L = lab[i * 3], A = lab[i * 3 + 1], B = lab[i * 3 + 2];
    let best = 0, bestD = Infinity;
    for (let c = 0; c < k; c++) {
      const dl = L - centroids[c * 3], da = A - centroids[c * 3 + 1], db = B - centroids[c * 3 + 2];
      const d = dl * dl + da * da + db * db;
      if (d < bestD) { bestD = d; best = c; }
    }
    clusterId[i] = best;
  }
  return clusterId;
}


// 對一張新照片（work 解析度）從頭做一次完整分析：Lab 轉換 → k-means 找出這張照
// 片實際的調色盤 → 合併過近的群 → 對全部像素分類
export function grayComputeClustering(data, n) {
  const lab = grayBuildLabBuffer(data, n);
  const rawCentroids = grayKMeansFit(lab, n, GRAY_K, 10);
  const { mergedCentroids, m } = grayMergeCloseClusters(rawCentroids, GRAY_K, GRAY_MERGE_DIST);
  const clusterId = grayAssignClusters(lab, n, mergedCentroids, m);
  return { clusterId, centroids: mergedCentroids, k: m };
}


// 匯出原生解析度時重用同一組中心點，只重新分類（不重新分群），詳見上面的說明
export function grayAssignWithCentroids(data, n, centroids, k) {
  const lab = grayBuildLabBuffer(data, n);
  return grayAssignClusters(lab, n, centroids, k);
}


// 從分群結果猜哪一群是黑色框線：明度明顯比全圖平均暗、彩度（chroma）低（偏中性
//灰黑，不是深藍深紅這種深色貼紙）、而且不是雜訊等級的極小群。猜不到就回傳 -1，
// 交給下面的顏色群交界＋局部反差偵測撐場——這正是「無貼紙方塊本來就沒有黑框」
// 的情況，不該硬指定一個不存在的黑框群。
export function grayIdentifyBorderCluster(centroids, k, clusterId, n) {
  const counts = new Array(k).fill(0);
  for (let i = 0; i < n; i++) counts[clusterId[i]]++;
  let overallL = 0;
  for (let c = 0; c < k; c++) overallL += centroids[c * 3] * counts[c];
  overallL /= n;
  let best = -1, bestScore = -Infinity;
  for (let c = 0; c < k; c++) {
    const L = centroids[c * 3], A = centroids[c * 3 + 1], B = centroids[c * 3 + 2];
    const chroma = Math.sqrt(A * A + B * B);
    if (L < overallL - 15 && L < 35 && chroma < 18 && counts[c] / n > 0.01) {
      const score = (overallL - L) - chroma;
      if (score > bestScore) { bestScore = score; best = c; }
    }
  }
  return best;
}


// 找一小塊區域裡出現最多次的值（眾數），給「點擊指定黑框位置」用：取一小塊區域
// 而不是單一像素，避免剛好點到反光或邊緣噪點所在的那個群
export function grayMode(arr) {
  const counts = new Map();
  let best = arr[0], bestCount = 0;
  for (const v of arr) {
    const c = (counts.get(v) || 0) + 1;
    counts.set(v, c);
    if (c > bestCount) { bestCount = c; best = v; }
  }
  return best;
}


// 移除孤立的雜訊黑塊／黑圈（反光高光周圍常見的暗暈邊、陰影黑點），只保留面積
// 明顯夠大的真實格線網絡，其餘併回旁邊的貼紙
export function grayCleanIsolatedSpecks(isLine, w, h, minIslandSize) {
  const n = w * h;
  const label = new Int32Array(n);
  const areas = [0];
  const stack = new Int32Array(n);
  let next = 1;
  for (let start = 0; start < n; start++) {
    if (!isLine[start] || label[start]) continue;
    let sp = 0; stack[sp++] = start; label[start] = next;
    let area = 0;
    while (sp > 0) {
      const idx = stack[--sp]; area++;
      const x = idx % w, y = (idx / w) | 0;
      if (x > 0) { const m = idx - 1; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
      if (x < w - 1) { const m = idx + 1; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
      if (y > 0) { const m = idx - w; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
      if (y < h - 1) { const m = idx + w; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
    }
    areas.push(area); next++;
  }
  let largest = 0;
  for (let l = 1; l < next; l++) if (areas[l] > largest) largest = areas[l];
  const threshold = Math.max(minIslandSize, largest * 0.04);
  for (let i = 0; i < n; i++) { if (label[i] && areas[label[i]] < threshold) isLine[i] = 0; }
}


// 填補格線上因反光被沖淡、只斷開1～2像素寬的小缺口（左右或上下兩側都已經是
// 格線時才補上，避免整片膨脹誤連不相干的區域）
export function grayBridgeLineGaps(isLine, w, h, passes) {
  for (let p = 0; p < passes; p++) {
    const out = isLine.slice();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (isLine[i]) continue;
        const leftOk = x > 0 && isLine[i - 1];
        const rightOk = x < w - 1 && isLine[i + 1];
        const upOk = y > 0 && isLine[i - w];
        const downOk = y < h - 1 && isLine[i + w];
        if ((leftOk && rightOk) || (upOk && downOk)) out[i] = 1;
      }
    }
    isLine.set(out);
  }
}


// 形態學閉運算（先膨脹再侵蝕）：補 bridgeLineGaps 補不到的缺口——例如金字塔／
// 風火輪這類多片格線從四面八方匯聚到同一個點的形狀，缺口是斜向、放射狀的，
// 不是單純左右或上下兩側夾住。半徑只給 2px，足夠補掉匯聚點的針孔縫，不會吃掉
// 真正的貼紙面積。
export function grayMorphDilate(mask, w, h) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mask[i]) { out[i] = 1; continue; }
      let hit = false;
      for (let dy = -1; dy <= 1 && !hit; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w) continue;
          if (mask[yy * w + xx]) { hit = true; break; }
        }
      }
      out[i] = hit ? 1 : 0;
    }
  }
  return out;
}

export function grayMorphErode(mask, w, h) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i]) { out[i] = 0; continue; }
      let allSet = true;
      for (let dy = -1; dy <= 1 && allSet; dy++) {
        const yy = y + dy;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w || !mask[yy * w + xx]) { allSet = false; break; }
        }
      }
      out[i] = allSet ? 1 : 0;
    }
  }
  return out;
}

export function grayMorphClose(mask, w, h, radius) {
  let m = mask;
  for (let i = 0; i < radius; i++) m = grayMorphDilate(m, w, h);
  for (let i = 0; i < radius; i++) m = grayMorphErode(m, w, h);
  return m;
}


// 局部反差輔助偵測：金屬／鏡面方塊常常整顆都是同一種銀灰色，貼紙彼此之間幾乎
// 沒有色差，光靠顏色分群沒辦法把它們分開。這裡改用不管顏色分群、純粹看「這個
// 像素跟旁邊亮度差多少」的 Sobel 梯度：格線本身即使跟貼紙同色，物理上還是一條
// 真實的凹槽，光線角度一定跟平面不同，亮度梯度會在那裡出現尖峰，這是唯一不依
// 賴顏色判斷的訊號，所以獨立於顏色分群之外、可以互補。
export function grayBuildEdgeMask(data, w, h, threshold) {
  const n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const k = i * 4;
    lum[i] = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
  }
  const edge = new Uint8Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = lum[i - w - 1] + 2 * lum[i - 1] + lum[i + w - 1] - (lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1]);
      const gy = lum[i - w - 1] + 2 * lum[i - w] + lum[i - w + 1] - (lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1]);
      if (Math.sqrt(gx * gx + gy * gy) > threshold) edge[i] = 1;
    }
  }
  return edge;
}


// 建立框線遮罩，回傳三份：
//   rawLine — 黑框群 + 顏色群交界 +（若開啟）局部反差，合併後的原始結果，渲染
//     ／匯出時用來保證「非真正黑框」的部分不會被永久鎖住不能降低彩度。
//   segLine — 在 rawLine 基礎上清除孤立雜訊、補小缺口，只用來做連通區塊分割。
//   blackOnly — 只有真的屬於黑框群的像素，渲染／匯出時唯一「保證永遠維持原圖」
//     的依據。
export function grayBuildLineMaskFromClusters(clusterId, w, h, borderClusterId, edgeMask) {
  const n = w * h;
  const rawLine = new Uint8Array(n);
  const blackOnly = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (borderClusterId !== -1 && clusterId[i] === borderClusterId) { rawLine[i] = 1; blackOnly[i] = 1; }
    if (edgeMask && edgeMask[i]) rawLine[i] = 1;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = clusterId[i];
      if (x < w - 1 && clusterId[i + 1] !== c) { rawLine[i] = 1; rawLine[i + 1] = 1; }
      if (y < h - 1 && clusterId[i + w] !== c) { rawLine[i] = 1; rawLine[i + w] = 1; }
    }
  }
  let segLine = rawLine.slice();
  const minIsland = Math.max(4, Math.round(n * 0.000003));
  grayCleanIsolatedSpecks(segLine, w, h, minIsland);
  grayBridgeLineGaps(segLine, w, h, 2);
  segLine = grayMorphClose(segLine, w, h, 2);
  return { rawLine, segLine, blackOnly };
}


// 連通區塊分割（4方向flood fill），順便統計每塊的中心點座標，供匯出時把「原生
// 解析度重新分割出的區塊」對應回使用者在預覽時點過的區塊。貼紙一定被格線/黑框
// 完整包住、不會碰到照片最外緣；背景則幾乎一定會碰到照片邊界。所以除了面積篩選
// 之外，只要區塊有任何一個像素落在照片最外圍一圈，就直接視為背景、永遠不算有效
// 色塊——不然背景如果剛好面積不大（例如照片裁得比較緊），會被誤判成一顆可點擊
// 的「貼紙」，使用者點歪一點就會把背景也灰階掉。
export function grayFloodFillLabel(isLine, w, h, minAreaFrac, maxAreaFrac) {
  const n = w * h;
  const label = new Int32Array(n);
  const areas = [0], sumX = [0], sumY = [0];
  const touchesBorder = [0];
  const stack = new Int32Array(n);
  let nextLabel = 1;
  for (let start = 0; start < n; start++) {
    if (isLine[start] || label[start]) continue;
    let sp = 0; stack[sp++] = start; label[start] = nextLabel;
    let area = 0, sx = 0, sy = 0, border = 0;
    while (sp > 0) {
      const idx = stack[--sp];
      area++;
      const x = idx % w, y = (idx / w) | 0;
      sx += x; sy += y;
      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) border = 1;
      if (x > 0) { const m = idx - 1; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
      if (x < w - 1) { const m = idx + 1; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
      if (y > 0) { const m = idx - w; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
      if (y < h - 1) { const m = idx + w; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
    }
    areas.push(area); sumX.push(sx); sumY.push(sy); touchesBorder.push(border);
    nextLabel++;
  }
  const totalArea = n;
  const minArea = totalArea * minAreaFrac;
  const maxArea = totalArea * maxAreaFrac;
  const centroidX = new Float64Array(nextLabel), centroidY = new Float64Array(nextLabel);
  const valid = new Uint8Array(nextLabel);
  let count = 0;
  for (let l = 1; l < nextLabel; l++) {
    centroidX[l] = sumX[l] / areas[l]; centroidY[l] = sumY[l] / areas[l];
    if (areas[l] >= minArea && areas[l] <= maxArea && !touchesBorder[l]) { valid[l] = 1; count++; }
  }
  for (let i = 0; i < n; i++) { if (label[i] && !valid[label[i]]) label[i] = 0; }
  return { label, count, centroidX, centroidY, numLabels: nextLabel };
}


// 把「無法辨識但不是黑色」的像素，就近併入旁邊偵測到的色塊分組（4方向 BFS，
// 遇到真正的黑色框線就停止擴散，所以不會跨過真實格線把兩塊不同貼紙的分組混在
// 一起）。回傳的 resolvedLabel 拿來做「灰階與否」的判斷和「點擊命中測試」。
export function grayResolveUnknownLabels(rawLine, blackOnly, label, w, h) {
  const n = w * h;
  const resolved = label.slice();
  const queue = new Int32Array(n);
  let qHead = 0, qTail = 0;
  for (let i = 0; i < n; i++) if (label[i]) queue[qTail++] = i;
  while (qHead < qTail) {
    const idx = queue[qHead++];
    const lab = resolved[idx];
    const x = idx % w, y = (idx / w) | 0;
    const tryExpand = (m) => {
      if (rawLine[m] && !blackOnly[m] && !resolved[m]) { resolved[m] = lab; queue[qTail++] = m; }
    };
    if (x > 0) tryExpand(idx - 1);
    if (x < w - 1) tryExpand(idx + 1);
    if (y > 0) tryExpand(idx - w);
    if (y < h - 1) tryExpand(idx + w);
  }
  return resolved;
}


export function GrayscaleTool() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const paintingRef = useRef(false);
  const lastPaintPointRef = useRef(null);
  const stRef = useRef({
    img: null, natW: 0, natH: 0, workW: 0, workH: 0, workOriginal: null,
    clusterId: null, centroids: null, k: 0, borderClusterId: -1, borderManual: false,
    lineMaskRaw: null, blackOnlyMask: null, boundaryMask: null, nearLineMask: null,
    desatBuffer: null, desatBufferPct: null, desatBufferColor: null,
    labelMask: null, resolvedLabelMask: null, keep: new Map(), manualOverride: null,
  });
  const st = stRef.current;

  const [fileName, setFileName] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [regionCount, setRegionCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState('請先上傳一張魔術方塊照片，系統會自動辨識這張照片實際的顏色與格線。');
  const [showLineMask, setShowLineMask] = useState(false);
  // 金屬／鏡面方塊貼紙彼此顏色太接近，光靠顏色分群常常抓不出格線，局部反差偵測
  // 幾乎都有幫助、沒有明顯副作用，所以直接固定開啟，不用讓使用者自己選
  const auxDetectionMode = true;
  const [desatPct, setDesatPct] = useState(100);
  const [grayColorHex, setGrayColorHex] = useState('#8c8c8c');
  const [brushMode, setBrushMode] = useState(false);
  const [brushForce, setBrushForce] = useState(1);
  const [brushRadius, setBrushRadius] = useState(14);
  const [markingBorder, setMarkingBorder] = useState(false);
  const [borderManualUI, setBorderManualUI] = useState(false);
  const [exporting, setExporting] = useState(false);

  const grayColor = {
    r: parseInt(grayColorHex.slice(1, 3), 16),
    g: parseInt(grayColorHex.slice(3, 5), 16),
    b: parseInt(grayColorHex.slice(5, 7), 16),
  };

  function isKept(lab) {
    if (!lab) return true;
    const v = st.keep.get(lab);
    return v === undefined ? true : v;
  }

  function computeDesatBuffer() {
    const orig = st.workOriginal.data;
    const out = new Uint8ClampedArray(orig.length);
    const amt = desatPct / 100;
    const { r: tr, g: tg, b: tb } = grayColor;
    for (let i = 0; i < orig.length; i += 4) {
      out[i] = orig[i] + (tr - orig[i]) * amt;
      out[i + 1] = orig[i + 1] + (tg - orig[i + 1]) * amt;
      out[i + 2] = orig[i + 2] + (tb - orig[i + 2]) * amt;
      out[i + 3] = orig[i + 3];
    }
    st.desatBuffer = out; st.desatBufferPct = desatPct; st.desatBufferColor = grayColorHex;
  }
  function getDesatBuffer() {
    if (!st.desatBuffer || st.desatBufferPct !== desatPct || st.desatBufferColor !== grayColorHex) computeDesatBuffer();
    return st.desatBuffer;
  }

  // 邊界標示遮罩：只標出「真正被判定為格線、且緊鄰某個偵測到的色塊」的像素，
  // 用來畫細線提示；不會包含大片背景，避免整張圖被塗滿
  function computeBoundaryMask() {
    const w = st.workW, h = st.workH, n = w * h;
    const lineRaw = st.lineMaskRaw, label = st.labelMask;
    const boundary = new Uint8Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!lineRaw[i]) continue;
        let adj = false;
        if (x > 0 && label[i - 1]) adj = true;
        else if (x < w - 1 && label[i + 1]) adj = true;
        else if (y > 0 && label[i - w]) adj = true;
        else if (y < h - 1 && label[i + w]) adj = true;
        boundary[i] = adj ? 1 : 0;
      }
    }
    st.boundaryMask = boundary;
  }

  // 即時預覽合成：手動筆刷（如果有畫）優先權最高、且是硬邊（使用者自己畫的範圍
  // 就該照畫的來）；黑色框線本身跟緊貼它 1px 的保護帶（nearLineMask）永遠維持
  // 原圖，其餘只要是「沒被使用者保留」的色塊一律直接變成完整灰階。
  function renderPreview() {
    const canvas = canvasRef.current;
    if (!canvas || !st.workOriginal) return;
    const ctx = canvas.getContext('2d');
    const w = st.workW, h = st.workH;
    const orig = st.workOriginal.data;
    const desat = getDesatBuffer();
    const blackOnly = st.blackOnlyMask;
    const label = st.resolvedLabelMask;
    const manual = st.manualOverride;
    const boundary = st.boundaryMask;
    const nearLine = st.nearLineMask;
    const out = ctx.createImageData(w, h);
    const od = out.data;
    for (let i = 0; i < w * h; i++) {
      const k = i * 4;
      const override = manual ? manual[i] : 0;
      let alpha;
      if (override === -1) alpha = 0;
      else if (override === 1) alpha = 1;
      else if (blackOnly[i] === 1) alpha = 0;
      else if (!isKept(label[i])) alpha = (nearLine && nearLine[i]) ? 0 : 1;
      else alpha = 0;
      od[k] = orig[k] + (desat[k] - orig[k]) * alpha;
      od[k + 1] = orig[k + 1] + (desat[k + 1] - orig[k + 1]) * alpha;
      od[k + 2] = orig[k + 2] + (desat[k + 2] - orig[k + 2]) * alpha;
      od[k + 3] = 255;
      if (showLineMask && boundary && boundary[i]) {
        const a = 0.55;
        od[k] = od[k] * (1 - a) + 0 * a;
        od[k + 1] = od[k + 1] * (1 - a) + 229 * a;
        od[k + 2] = od[k + 2] * (1 - a) + 255 * a;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  // 用目前的 clusterId／borderClusterId（顏色群沒變，只有格線判斷可能因為輔助
  // 偵測開關或手動指定黑框而變動）重跑一次「建格線 → 分割 → 侵蝕距離」，不重新
  // 分群。分群（k-means）只在上傳新照片時做一次。
  function rebuildFromClusters() {
    const w = st.workW, h = st.workH;
    const edgeMask = auxDetectionMode ? grayBuildEdgeMask(st.workOriginal.data, w, h, GRAY_EDGE_THRESHOLD) : null;
    const { rawLine, segLine, blackOnly } = grayBuildLineMaskFromClusters(st.clusterId, w, h, st.borderClusterId, edgeMask);
    st.lineMaskRaw = rawLine;
    st.blackOnlyMask = blackOnly;
    // 緊貼格線往外恰好 1px 的保護帶：直接在目前這個解析度上做 1 次膨脹算出來，
    // 不是拿工作解析度的距離值等比例放大，所以不會因為照片解析度變高就跟著變粗，
    // 邊緣只會留一點點、不會出現明顯的顏色圈。
    st.nearLineMask = grayMorphDilate(rawLine, w, h);
    const seg = grayFloodFillLabel(segLine, w, h, GRAY_MIN_AREA_FRAC, GRAY_MAX_AREA_FRAC);
    st.labelMask = seg.label;
    st.resolvedLabelMask = grayResolveUnknownLabels(rawLine, blackOnly, seg.label, w, h);
    st.keep = new Map();
    computeBoundaryMask();
    setRegionCount(seg.count);
    setStatusMsg(seg.count > 0
      ? `已自動辨識到 ${seg.count} 個色塊。直接點擊照片上想降低彩度的格子即可，再點一次可還原。`
      : '沒有辨識到任何色塊，可以改用手動筆刷直接塗，或確認左下角的黑框標示是否正確。');
    renderPreview();
  }

  // 對照片做一次完整分析：找出這張照片實際的調色盤（k-means）→ 猜哪一群是黑框
  // →建格線、分割
  function computeSegmentation() {
    const w = st.workW, h = st.workH, n = w * h;
    const { clusterId, centroids, k } = grayComputeClustering(st.workOriginal.data, n);
    st.clusterId = clusterId; st.centroids = centroids; st.k = k;
    st.borderManual = false;
    setBorderManualUI(false);
    st.borderClusterId = grayIdentifyBorderCluster(centroids, k, clusterId, n);
    rebuildFromClusters();
  }

  function buildAnalysis(img) {
    st.img = img; st.natW = img.naturalWidth; st.natH = img.naturalHeight;
    const maxDim = 1400;
    let workScale = maxDim / Math.max(st.natW, st.natH);
    workScale = Math.min(workScale, 1.6);
    st.workW = Math.max(1, Math.round(st.natW * workScale));
    st.workH = Math.max(1, Math.round(st.natH * workScale));

    const wc = document.createElement('canvas');
    wc.width = st.workW; wc.height = st.workH;
    const wctx = wc.getContext('2d', { willReadFrequently: true });
    wctx.drawImage(st.img, 0, 0, st.workW, st.workH);
    st.workOriginal = wctx.getImageData(0, 0, st.workW, st.workH);
    st.desatBuffer = null; st.desatBufferPct = null;
    st.manualOverride = new Int8Array(st.workW * st.workH);

    const canvas = canvasRef.current;
    canvas.width = st.workW; canvas.height = st.workH;

    setHasImage(true);
    computeSegmentation();
  }

  function loadImageFile(file) {
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setStatusMsg('照片已載入，正在分析這張照片實際的顏色與格線…');
      setTimeout(() => { buildAnalysis(img); URL.revokeObjectURL(url); }, 10);
    };
    img.src = url;
  }
  function handleFileChange(e) { const file = e.target.files[0]; if (file) loadImageFile(file); }
  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  }

  function getCanvasPixel(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    return { x, y };
  }

  // 手動指定黑框：取點擊位置周圍一小塊區域裡「出現最多次的顏色群」，不是單一
  // 像素，避免踩到反光或邊緣噪點。顏色分群本身不用重跑，只是換一下「哪一群算
  // 黑框」的認定。
  function sampleBorderAt(cx, cy) {
    const w = st.workW, h = st.workH;
    const radius = 4;
    const ids = [];
    for (let dy = -radius; dy <= radius; dy++) {
      const yy = cy + dy; if (yy < 0 || yy >= h) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const xx = cx + dx; if (xx < 0 || xx >= w) continue;
        ids.push(st.clusterId[yy * w + xx]);
      }
    }
    st.borderClusterId = grayMode(ids);
    st.borderManual = true;
    setBorderManualUI(true);
    setMarkingBorder(false);
    rebuildFromClusters();
  }
  function handleResetBorder() {
    st.borderManual = false;
    setBorderManualUI(false);
    st.borderClusterId = grayIdentifyBorderCluster(st.centroids, st.k, st.clusterId, st.workW * st.workH);
    rebuildFromClusters();
  }

  function stampBrush(cx, cy) {
    const w = st.workW, h = st.workH;
    const r = brushRadius, r2 = r * r;
    const force = brushForce;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= r2) st.manualOverride[y * w + x] = force;
      }
    }
  }
  function paintStroke(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1, brushRadius / 3);
    const steps = Math.max(1, Math.ceil(dist / step));
    for (let i = 0; i <= steps; i++) stampBrush(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
  }

  function handlePointerDown(e) {
    if (!hasImage) return;
    const { x, y } = getCanvasPixel(e);
    if (x < 0 || y < 0 || x >= st.workW || y >= st.workH) return;

    if (markingBorder) { sampleBorderAt(x, y); return; }

    if (brushMode) {
      paintingRef.current = true;
      lastPaintPointRef.current = { x, y };
      stampBrush(x, y);
      renderPreview();
      return;
    }

    if (!st.resolvedLabelMask) return;
    const lab = st.resolvedLabelMask[y * st.workW + x];
    if (!lab) {
      setStatusMsg('這個位置沒有辨識到獨立色塊（可能是格線、或面積太小／太大被自動排除），請點色塊中間位置，或改用「手動筆刷」直接塗。');
      return;
    }
    const cur = isKept(lab);
    st.keep.set(lab, !cur);
    renderPreview();
  }
  function handlePointerMove(e) {
    if (!paintingRef.current) return;
    const { x, y } = getCanvasPixel(e);
    const cx = Math.max(0, Math.min(st.workW - 1, x));
    const cy = Math.max(0, Math.min(st.workH - 1, y));
    paintStroke(lastPaintPointRef.current, { x: cx, y: cy });
    lastPaintPointRef.current = { x: cx, y: cy };
    renderPreview();
  }
  function handlePointerUp() { paintingRef.current = false; lastPaintPointRef.current = null; }

  useEffect(() => { if (hasImage) renderPreview(); }, [desatPct, grayColorHex, showLineMask]); // eslint-disable-line react-hooks/exhaustive-deps

  // 把預覽解析度的手動筆刷遮罩，用最近鄰放大成原生解析度。筆刷只是使用者畫的
  // 一塊遮罩，不是語意分割結果，直接照座標比例放大取樣即可
  function scaleManualOverrideToNative(natW, natH) {
    const manual = st.manualOverride;
    if (!manual) return null;
    let hasAny = false;
    for (let i = 0; i < manual.length; i++) if (manual[i]) { hasAny = true; break; }
    if (!hasAny) return null;
    const workW = st.workW, workH = st.workH;
    const out = new Int8Array(natW * natH);
    for (let y = 0; y < natH; y++) {
      const wy = Math.min(workH - 1, Math.floor((y * workH) / natH));
      const rowBase = y * natW, wRowBase = wy * workW;
      for (let x = 0; x < natW; x++) {
        const wx = Math.min(workW - 1, Math.floor((x * workW) / natW));
        out[rowBase + x] = manual[wRowBase + wx];
      }
    }
    return out;
  }

  // 匯出：在「原生解析度」重新分類＋重新分割（不是把預覽用的低解析度結果直接
  // 放大貼上去），格線邊緣才會貼合原始照片、不會出現鋸齒毛邊。重用分析時就找
  // 好的調色盤（centroids），不重新分群，確保匯出結果跟預覽看到的一致；侵蝕／
  // 羽化的半徑也按解析度比例放大，不然原生解析度下 1px 的安全邊界會小到看不
  // 出效果。因為是重新分割，原生解析度的區塊編號跟預覽時不會一樣，用每個原生
  // 區塊的中心點換算回預覽解析度，查出使用者點過哪一塊、有沒有被保留。
  function doExport() {
    const natW = st.natW, natH = st.natH;
    const off = document.createElement('canvas');
    off.width = natW; off.height = natH;
    const octx = off.getContext('2d');
    octx.drawImage(st.img, 0, 0, natW, natH);
    const origData = octx.getImageData(0, 0, natW, natH);
    const orig = origData.data;
    const n = natW * natH;

    const nativeClusterId = grayAssignWithCentroids(orig, n, st.centroids, st.k);
    const edgeMask = auxDetectionMode ? grayBuildEdgeMask(orig, natW, natH, GRAY_EDGE_THRESHOLD) : null;
    const { rawLine: isLineNative, segLine, blackOnly: blackOnlyNative } = grayBuildLineMaskFromClusters(nativeClusterId, natW, natH, st.borderClusterId, edgeMask);
    const seg = grayFloodFillLabel(segLine, natW, natH, GRAY_MIN_AREA_FRAC, GRAY_MAX_AREA_FRAC);
    const resolvedNative = grayResolveUnknownLabels(isLineNative, blackOnlyNative, seg.label, natW, natH);
    // 跟預覽一樣，直接在原生解析度上做 1 次膨脹算保護帶，不會因為原生解析度比
    // 工作解析度高很多而跟著等比例變粗。
    const nearLineNative = grayMorphDilate(isLineNative, natW, natH);

    const workW = st.workW, workH = st.workH, workLabel = st.labelMask;
    const nativeToWork = new Int32Array(seg.numLabels);
    for (let l = 1; l < seg.numLabels; l++) {
      const wx = Math.min(workW - 1, Math.max(0, Math.round((seg.centroidX[l] * workW) / natW)));
      const wy = Math.min(workH - 1, Math.max(0, Math.round((seg.centroidY[l] * workH) / natH)));
      nativeToWork[l] = workLabel[wy * workW + wx];
    }

    const manualNative = scaleManualOverrideToNative(natW, natH);

    const out = octx.createImageData(natW, natH);
    const od = out.data;
    const amt = desatPct / 100;
    const { r: tr, g: tg, b: tb } = grayColor;

    for (let i = 0; i < n; i++) {
      const idx = i * 4;
      const r = orig[idx], g = orig[idx + 1], b = orig[idx + 2];
      const override = manualNative ? manualNative[i] : 0;
      let alpha;
      if (override === -1) alpha = 0;
      else if (override === 1) alpha = 1;
      else if (blackOnlyNative[i]) alpha = 0;
      else {
        const nlab = resolvedNative[i];
        const wlab = nlab ? nativeToWork[nlab] : 0;
        alpha = !isKept(wlab) ? (nearLineNative[i] ? 0 : 1) : 0;
      }
      const gr = r + (tr - r) * amt, gg = g + (tg - g) * amt, gb = b + (tb - b) * amt;
      od[idx] = r + (gr - r) * alpha;
      od[idx + 1] = g + (gg - g) * alpha;
      od[idx + 2] = b + (gb - b) * alpha;
      od[idx + 3] = orig[idx + 3];
    }
    octx.putImageData(out, 0, 0);
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'rubik-grayscale-' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg('已下載完成。可以繼續點擊照片調整，或上傳下一張照片。');
      setExporting(false);
    }, 'image/png');
  }
  function handleExportClick() {
    if (!hasImage) return;
    setExporting(true);
    setStatusMsg('正在以原始解析度重新分析並產生圖片，請稍候…');
    setTimeout(doExport, 10);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-3xl font-black text-[var(--fg)] uppercase tracking-widest">
          灰階降彩度工具
        </h1>
      </div>
      <p className="text-[var(--mutedFg)] text-base mb-6">
        上傳魔術方塊照片，系統會分析這張照片實際拍到的顏色並切成一格一格，點擊想降低彩度的格子即可，處理完直接下載。
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div
            className="bg-black border border-[var(--border)] cyber-chamfer flex items-center justify-center overflow-auto"
            style={{ minHeight: 360 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {!hasImage && (
              <p className="text-[var(--mutedFg)] text-base py-16 px-6 text-center">尚未上傳照片，拖放照片到這裡，或用右側「上傳照片」選擇檔案</p>
            )}
            <canvas
              ref={canvasRef}
              width={10}
              height={10}
              className={`max-w-full h-auto ${hasImage ? '' : 'hidden'} ${brushMode ? 'cursor-crosshair' : markingBorder ? 'cursor-copy' : 'cursor-pointer'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0 space-y-4">
          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2">01 · 上傳照片</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-[var(--fg)]"
            />
            {fileName && <p className="text-sm text-[var(--mutedFg)] mt-1 truncate">{fileName}</p>}
          </div>

          <div className={`border cyber-chamfer p-4 text-sm font-medium leading-relaxed ${regionCount > 0 ? 'bg-[#00ff88]/10 border-[#00ff88]/50 text-[var(--fg)]' : 'bg-[var(--muted)] border-[var(--border)] text-[var(--mutedFg)]'}`}>
            {statusMsg}
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2">02 · 格線辨識</h3>
            <p className="text-sm text-[var(--mutedFg)] mb-2">系統會自動分析這張照片實際拍到的顏色來分組、找出格線，不用手動校色。</p>
            <label className="flex items-center gap-2 text-sm text-[var(--fg)] cursor-pointer">
              <input type="checkbox" checked={showLineMask} onChange={(e) => setShowLineMask(e.target.checked)} />
              用細線標示目前辨識到的格線位置
            </label>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2 flex items-center gap-1.5">
              <Pipette className="w-3.5 h-3.5" /> 03 · 黑框標示（選填）
            </h3>
            <p className="text-sm text-[var(--mutedFg)] mb-3">系統會自動判斷哪一群顏色是黑色框線；如果猜錯（例如誤判成深色貼紙，或反過來沒找到黑框），點下面按鈕、再點照片上真正的黑框位置即可修正。</p>
            <button
              onClick={() => setMarkingBorder((prev) => !prev)}
              className={`w-full text-sm font-mono uppercase tracking-wider px-3 py-1.5 cyber-chamfer-sm border-2 transition ${
                markingBorder ? 'border-[#ffee00] text-[var(--yellowText)] shadow-[0_0_8px_#ffee0080]' : 'border-[var(--border)] text-[var(--fg)] hover:border-[#00ff88] hover:text-[var(--accentText)]'
              }`}
            >
              {markingBorder ? '請點擊照片上的黑框位置…' : '指定黑框位置'}
            </button>
            <p className="text-sm text-[var(--mutedFg)] mt-2">
              {borderManualUI ? '目前使用你手動指定的黑框。' : '目前使用系統自動判斷的黑框。'}
            </p>
            {borderManualUI && (
              <button
                onClick={handleResetBorder}
                className="w-full mt-2 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
              >
                改回自動判斷
              </button>
            )}
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2">04 · 降低彩度</h3>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm text-[var(--mutedFg)]">統一灰階顏色</label>
              <input type="color" value={grayColorHex} onChange={(e) => setGrayColorHex(e.target.value)} className="w-9 h-7 border border-[var(--border)] bg-transparent cursor-pointer" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-[var(--mutedFg)]">降低彩度強度</label>
              <span className="text-sm font-mono text-[var(--accentText)]">{desatPct}%</span>
            </div>
            <input type="range" min="0" max="100" value={desatPct} onChange={(e) => setDesatPct(parseInt(e.target.value))} className="w-full accent-[#00ff88]" />
            <button
              onClick={() => { st.keep = new Map(); renderPreview(); }}
              className="w-full mt-3 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              全部還原成原圖
            </button>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2 flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5" /> 05 · 手動筆刷修正
            </h3>
            <label className="flex items-center gap-2 text-sm text-[var(--fg)] cursor-pointer mb-3">
              <input type="checkbox" checked={brushMode} onChange={(e) => setBrushMode(e.target.checked)} />
              開啟手動筆刷（開啟後點擊/拖曳照片＝塗筆刷，不是切換色塊）
            </label>
            {brushMode && (
              <>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setBrushForce(1)}
                    className={`flex-1 text-sm font-mono uppercase tracking-wider px-3 py-1.5 cyber-chamfer-sm border-2 transition ${
                      brushForce === 1 ? 'border-[#00ff88] bg-[#00ff88] text-[#0a0a0f]' : 'border-[var(--border)] text-[var(--fg)]'
                    }`}
                  >
                    塗灰
                  </button>
                  <button
                    onClick={() => setBrushForce(-1)}
                    className={`flex-1 text-sm font-mono uppercase tracking-wider px-3 py-1.5 cyber-chamfer-sm border-2 transition ${
                      brushForce === -1 ? 'border-[#00ff88] bg-[#00ff88] text-[#0a0a0f]' : 'border-[var(--border)] text-[var(--fg)]'
                    }`}
                  >
                    還原原圖
                  </button>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-[var(--mutedFg)]">筆刷大小</label>
                  <span className="text-sm font-mono text-[var(--accentText)]">{brushRadius}px</span>
                </div>
                <input type="range" min="3" max="60" value={brushRadius} onChange={(e) => setBrushRadius(parseInt(e.target.value))} className="w-full accent-[#00ff88] mb-3" />
                <button
                  onClick={() => { if (st.manualOverride) st.manualOverride.fill(0); renderPreview(); }}
                  className="w-full text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                >
                  清除所有手動筆刷痕跡
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleExportClick}
            disabled={!hasImage || exporting}
            className="w-full flex items-center justify-center gap-1.5 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-base font-mono uppercase tracking-wider px-4 py-3 cyber-chamfer hover:bg-[#00ff88] hover:text-[#0a0a0f] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            06 · 下載處理後圖片
          </button>
        </div>
      </div>
    </div>
  );
}
