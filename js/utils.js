// ============================================================
// utils.js — 共用工具函式
// 不依賴任何其他模組，可被所有檔案安全呼叫
// ============================================================

/**
 * 產生一個不重複的區塊 ID
 * 用時間戳記 + 隨機字串組成，足夠給單一知識庫使用
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/**
 * HTML escape，避免使用者輸入的文字被當成 HTML 標籤解析（防 XSS）
 * 任何要塞進 innerHTML 的使用者文字都必須先過這裡
 */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 將命中搜尋關鍵字的文字包上 <mark> 標籤做高亮
 * sq（search query）是全域搜尋字串，定義在 app.js
 */
function hl(s) {
  if (!sq || !s) return s;
  try {
    var re = new RegExp(sq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return s.replace(re, function (m) { return '<mark>' + m + '</mark>'; });
  } catch (e) {
    return s;
  }
}

/**
 * 畫面下方顯示一個短暫的提示訊息（例如「已儲存」「上傳失敗」）
 * 2.6 秒後自動消失
 */
function toast(m) {
  var t = document.getElementById('toast');
  t.textContent = m;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.style.display = 'none'; }, 2600);
}

// ── 資料模型相容層 ──────────────────────────────────────────
// 新格式：{ id, type, content:{...} }
//   一般文字類型（h1/h2/h3/step/note）：content = { text }
//   圖片類型（img）                    ：content = { url, caption }
// 舊格式（升級前）：{ id, type, text, url? } — 欄位直接放在最外層
//
// migrateBlock() 負責把任何舊格式資料轉成新格式，讓舊的 JSONBin
// 資料、或別人手動編輯過的 JSON 都能正常載入，不會壞掉。

/**
 * 判斷並轉換單一區塊為新格式
 * 已是新格式（有 content 欄位）就直接回傳，不重複轉換
 */
function migrateBlock(b) {
  if (!b || !b.id || !b.type) return null;
  if (b.content) return b; // 已是新格式

  if (b.type === 'img') {
    return { id: b.id, type: b.type, content: { url: b.url || '', caption: b.text || '' } };
  }
  return { id: b.id, type: b.type, content: { text: b.text || '' } };
}

/**
 * 批次轉換一整個陣列，並過濾掉無效資料
 */
function migrateAll(arr) {
  return (arr || [])
    .map(migrateBlock)
    .filter(function (b) { return b !== null; });
}

// ── 內容存取小幫手 ──────────────────────────────────────────
// 讓其他模組不用每次都寫 (b.content && b.content.text) || ''

function bText(b) { return (b.content && b.content.text) || ''; }
function bUrl(b) { return (b.content && b.content.url) || ''; }
function bCaption(b) { return (b.content && b.content.caption) || ''; }
