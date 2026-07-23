// ============================================================
// navigation.js — 左側目錄與分頁邏輯
// 負責：目錄產生、切換主題頁、捲動到指定副標題
// ============================================================

/** 找出 blocks 裡第一個大標題（h1），找不到回傳 null */
function firstH1() {
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'h1') return blocks[i];
  }
  return null;
}

/** 依 id 找出對應的區塊，找不到回傳 null */
function findBlock(id) {
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) return blocks[i];
  }
  return null;
}

/**
 * 計算「目前頁面」在 blocks 陣列中的範圍 [起點, 終點)
 * 起點是目前這個 h1 的 index，終點是下一個 h1 的 index（或陣列結尾）
 */
function pageRange() {
  if (!curPage) return [0, 0];
  var s = -1;
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].id === curPage) { s = i; break; }
  }
  if (s < 0) return [0, 0];
  var e = blocks.length;
  for (var j = s + 1; j < blocks.length; j++) {
    if (blocks[j].type === 'h1') { e = j; break; }
  }
  return [s, e];
}

/**
 * 切換顯示的主題頁面（點左側大標題時呼叫）
 * 會更新：側邊欄 active 樣式、頂部麵包屑文字、內容區渲染、捲動回頂部
 */
function goPage(id) {
  curPage = id;

  var items = document.querySelectorAll('.si');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');

  var navItem = document.querySelector('.si[data-id="' + id + '"]');
  if (navItem) {
    navItem.classList.add('active');
    // 注意：這裡「不」強制展開子選單。
    // 是否展開完全交給使用者點擊（navClick 的 toggle 邏輯）決定，
    // 避免每次切頁都把使用者剛收合的選單又重新打開。
  }

  var b = findBlock(id);
  if (b) document.getElementById('crumb').innerHTML = '路境行旅 <b>' + esc(bText(b)) + '</b>';

  render(); // 定義在 render.js
  window.scrollTo(0, 0);
}

/** 左側目錄重新產生（新增/刪除/修改大標題或副標題後都要呼叫） */
function buildNav() {
  var nav = document.getElementById('sn');
  var html = '';
  var hasH1 = false;

  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].type !== 'h1') continue;
    hasH1 = true;
    var h1 = blocks[i];

    // 收集這個 h1 底下、下一個 h1 之前的所有 h2
    var subs = [];
    for (var j = i + 1; j < blocks.length; j++) {
      if (blocks[j].type === 'h1') break;
      if (blocks[j].type === 'h2') subs.push(blocks[j]);
    }

    html += '<div class="si" data-id="' + h1.id + '" onclick="navClick(\'' + h1.id + '\',this)">'
      + '<span>📌</span>'
      + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(bText(h1)) + '</span>'
      + (subs.length ? '<span class="ar">›</span>' : '')
      + '</div>';

    if (subs.length) {
      html += '<div class="sc">';
      for (var k = 0; k < subs.length; k++) {
        html += '<div class="sci" onclick="subClick(\'' + subs[k].id + '\',\'' + h1.id + '\',this)">📂 ' + esc(bText(subs[k])) + '</div>';
      }
      html += '</div>';
    }
  }

  nav.innerHTML = hasH1
    ? '<div class="snl">目錄</div>' + html
    : '<div style="padding:12px 14px;font-size:12px;color:#8E8E93">尚無內容</div>';
}

/** 點左側大標題：展開/收合子項 + 切換頁面 */
function navClick(id, el) {
  var children = el.nextElementSibling;
  if (children && children.classList.contains('sc')) {
    el.classList.toggle('open');
    children.classList.toggle('open');
  }
  if (sq) clrSearch(); // 定義在 search.js
  goPage(id);
  if (window.innerWidth <= 768) tSb();
}

/** 點左側副標題：切換到對應主題頁，並捲動到該副標題的位置 */
function subClick(h2id, h1id, el) {
  if (sq) clrSearch();
  goPage(h1id);

  // 等 render() 把 DOM 畫出來後才能捲動，故延遲執行
  setTimeout(function () { scrollToSec(h2id); }, 120);

  var items = document.querySelectorAll('.sci');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  el.classList.add('active');

  if (window.innerWidth <= 768) tSb();
}

/**
 * 精準捲動到指定副標題的位置
 * 不用固定數字硬猜偏移量，而是即時量測目前畫面上
 * 頂部工具列（.tb）、編輯工具列（#ebar）、搜尋橫幅（#banner）
 * 各自實際的高度，加總起來當作捲動偏移量，確保不同模式下都對得準
 */
function scrollToSec(id) {
  var target = document.getElementById('sec-' + id);
  if (!target) return;

  var offset = 16; // 額外留白，避免標題貼著頂部工具列邊緣
  var tb = document.querySelector('.tb');
  var ebar = document.getElementById('ebar');
  var banner = document.getElementById('banner');

  if (tb) offset += tb.offsetHeight;
  if (ebar && ebar.style.display === 'flex') offset += ebar.offsetHeight;
  if (banner && banner.style.display === 'flex') offset += banner.offsetHeight;

  var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: top, behavior: 'smooth' });
}

/** 手機版：開關左側側邊欄 */
function tSb() {
  document.getElementById('sidebar').classList.toggle('open');
}
