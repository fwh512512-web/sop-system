// ============================================================
// render.js — 畫面渲染
// 原本是一個很肥大的 render() 函數，這裡拆成：
//   renderH1 / renderH2 / renderH3 / renderStep / renderNote / renderImage
// 每個只負責產生「自己那一種區塊」的 HTML 字串，
// render() 本身只剩下走迴圈 + 判斷 type + 串接字串，維持在 50 行內。
// ============================================================

/** 編輯模式下才需要的 contenteditable 屬性字串，非編輯模式回傳空字串 */
function edAttr() {
  return isEdit ? 'contenteditable="true" onkeydown="kd(event)" oninput="dirty=true" ' : '';
}

/** 文字區塊按 Enter 時，阻止換行（用 Shift+Enter 才能真正換行） */
function kd(e) {
  if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
}

/** 把畫面上 contenteditable 區塊目前顯示的文字，同步寫回 blocks 資料 */
function syncDOM() {
  blocks.forEach(function (b) {
    var el = document.getElementById('t-' + b.id);
    if (el && typeof el.innerText === 'string' && b.content) {
      b.content.text = el.innerText.trim();
    }
  });
}

/** 編輯模式下，每個區塊左側的 ↑↓✕ 控制按鈕 */
function ctrls(i) {
  if (!isEdit) return '';
  return '<div class="bc">'
    + '<button class="cb" onclick="mvUp(' + i + ')" title="上移">↑</button>'
    + '<button class="cb" onclick="mvDn(' + i + ')" title="下移">↓</button>'
    + '<button class="cb dl" onclick="delB(' + i + ')" title="刪除">✕</button>'
    + '</div>';
}

/** 編輯模式下，區塊與區塊之間 hover 出現的「＋插入」列 */
function insBar(i) {
  if (!isEdit) return '';
  return '<div class="ib"><div class="il"></div>'
    + '<button class="ibtn" onclick="insB(\'h2\',' + i + ')">＋副標</button>'
    + '<button class="ibtn" onclick="insB(\'h3\',' + i + ')">＋小標</button>'
    + '<button class="ibtn" onclick="insB(\'step\',' + i + ')">＋步驟</button>'
    + '<button class="ibtn" onclick="insB(\'note\',' + i + ')">＋注意</button>'
    + '<button class="ibtn" onclick="insB(\'img\',' + i + ')">＋圖片</button>'
    + '<div class="il"></div></div>';
}

// ── 各類型區塊的渲染函數 ────────────────────────────────────
// 每個函數只負責一件事：把單一 block 轉成對應的 HTML 字串

function renderH1(b, i) {
  var tx = hl(esc(bText(b)));
  return '<div class="bw">' + ctrls(i)
    + '<div style="flex:1"><div ' + edAttr() + 'class="vh1" id="t-' + b.id + '">' + tx + '</div>'
    + '<div class="vh1line"></div></div></div>' + insBar(i);
}

function renderH2(b, i) {
  var tx = hl(esc(bText(b)));
  return '<div class="bw" id="sec-' + b.id + '">' + ctrls(i)
    + '<div class="vh2wrap"><div class="vh2bar"></div>'
    + '<div ' + edAttr() + 'class="vh2" id="t-' + b.id + '">' + tx + '</div></div></div>' + insBar(i);
}

function renderH3(b, i) {
  var tx = hl(esc(bText(b)));
  return '<div class="bw">' + ctrls(i)
    + '<div ' + edAttr() + 'class="vh3" id="t-' + b.id + '">' + tx + '</div></div>' + insBar(i);
}

function renderStep(b, i, stepNum) {
  var tx = hl(esc(bText(b)));
  return '<div class="bw">' + ctrls(i)
    + '<div class="vstw"><div class="vsn">' + stepNum + '</div>'
    + '<div ' + edAttr() + 'class="vst" id="t-' + b.id + '">' + tx + '</div></div></div>' + insBar(i);
}

function renderNote(b, i) {
  var tx = hl(esc(bText(b)));
  return '<div class="bw">' + ctrls(i)
    + '<div class="vntw"><span>⚠️</span>'
    + '<div ' + edAttr() + 'class="vnt" id="t-' + b.id + '">' + tx + '</div></div></div>' + insBar(i);
}

function renderImage(b, i) {
  var changeBtn = isEdit
    ? '<button class="ab" style="margin-top:6px" onclick="opI(\'' + b.id + '\')">🔄 更換圖片</button>'
    : '';
  return '<div class="bw">' + ctrls(i)
    + '<div class="vimw"><figure><img src="' + esc(bUrl(b)) + '" loading="lazy">'
    + '<figcaption>' + esc(bCaption(b)) + '</figcaption></figure>' + changeBtn + '</div></div>' + insBar(i);
}

/** 依 type 分派到對應的 render 函數，並負責步驟編號的遞增邏輯 */
function renderBlock(b, i, stepCounter) {
  if (b.type === 'h1') { stepCounter.n = 0; return renderH1(b, i); }
  if (b.type === 'h2') { stepCounter.n = 0; return renderH2(b, i); }
  if (b.type === 'h3') { return renderH3(b, i); }
  if (b.type === 'step') { stepCounter.n++; return renderStep(b, i, stepCounter.n); }
  if (b.type === 'note') { return renderNote(b, i); }
  if (b.type === 'img') { return renderImage(b, i); }
  return '';
}

// ── 主要渲染入口 ────────────────────────────────────────────

/**
 * 主渲染函數：畫出目前應該顯示的內容
 * - 搜尋中 → 交給 renderSearch
 * - 沒選頁面 → 顯示提示文字
 * - 正常情況 → 走訪目前頁面範圍內的區塊，逐一渲染
 */
function render() {
  var cw = document.getElementById('cw');

  if (sq) { renderSearch(cw); return; }
  if (!curPage) { cw.innerHTML = '<div class="est"><div class="i">📋</div><h3>請從左側選擇主題</h3></div>'; return; }

  var range = pageRange();
  var start = range[0], end = range[1];
  if (end - start <= 0) {
    cw.innerHTML = '<div class="est"><div class="i">📋</div><h3>此頁尚無內容</h3></div>';
    return;
  }

  var html = '';
  var stepCounter = { n: 0 };
  for (var i = start; i < end; i++) {
    html += renderBlock(blocks[i], i, stepCounter);
  }
  cw.innerHTML = html;
}

/**
 * 搜尋結果渲染：列出所有命中的區塊，並依所屬大標題分組標示
 * 點主題名稱可以直接跳回該主題頁面繼續閱讀/編輯
 */
function renderSearch(cw) {
  var matched = [];
  for (var i = 0; i < blocks.length; i++) {
    if (bText(blocks[i]).toLowerCase().indexOf(sq) >= 0) matched.push(i);
  }
  if (!matched.length) {
    cw.innerHTML = '<div class="est"><div class="i">🔍</div><h3>找不到「' + esc(sq) + '」</h3></div>';
    return;
  }

  var html = '', lastH1Text = '';
  for (var k = 0; k < matched.length; k++) {
    var i = matched[k], b = blocks[i];
    var tx = hl(esc(bText(b)));

    var owner = null;
    for (var j = i; j >= 0; j--) { if (blocks[j].type === 'h1') { owner = blocks[j]; break; } }
    if (owner && bText(owner) !== lastH1Text) {
      html += '<div style="font-size:11px;color:#4A7C59;font-weight:600;margin:16px 0 6px;cursor:pointer" '
        + 'onclick="clrSearch();goPage(\'' + owner.id + '\')">📌 ' + esc(bText(owner)) + ' ›</div>';
      lastH1Text = bText(owner);
    }

    if (b.type === 'h2') html += '<div class="bw"><div class="vh2wrap"><div class="vh2bar"></div><div class="vh2">' + tx + '</div></div></div>';
    else if (b.type === 'h3') html += '<div class="bw"><div class="vh3">' + tx + '</div></div>';
    else if (b.type === 'step') html += '<div class="bw"><div class="vstw"><div class="vsn">•</div><div class="vst">' + tx + '</div></div></div>';
    else if (b.type === 'note') html += '<div class="bw"><div class="vntw"><span>⚠️</span><div class="vnt">' + tx + '</div></div></div>';
  }
  cw.innerHTML = html;
}
