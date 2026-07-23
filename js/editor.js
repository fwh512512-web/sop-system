// ============================================================
// editor.js — 編輯模式與區塊增刪移動
// 負責：密碼驗證進出編輯模式、新增/插入/搬移/刪除區塊、
//       離開頁面前的未儲存提醒
// ============================================================

/** 是否有尚未儲存的修改，離開頁面時用來決定要不要跳提醒 */
var dirty = false;

/** 點側邊欄「進入/退出編輯模式」按鈕 */
function tEdit() {
  if (!isEdit) {
    document.getElementById('pm').style.display = '';
    setTimeout(function () { document.getElementById('pi').focus(); }, 50);
  } else {
    if (dirty && !confirm('有未儲存的修改，確定退出？')) return;
    exitE();
  }
}

/** 驗證密碼 Modal 的確認按鈕 */
function ckP() {
  if (document.getElementById('pi').value === CFG.PWD) {
    clP();
    enterE();
  } else {
    document.getElementById('pe').style.display = 'block';
    document.getElementById('pi').value = '';
  }
}

/** 關閉密碼 Modal 並清空輸入 */
function clP() {
  document.getElementById('pm').style.display = 'none';
  document.getElementById('pi').value = '';
  document.getElementById('pe').style.display = 'none';
}

/** 正式進入編輯模式：顯示編輯工具列、儲存按鈕變啟用 */
function enterE() {
  isEdit = true;
  dirty = false;
  document.getElementById('ebt').classList.add('on');
  document.getElementById('ebl').textContent = '退出編輯模式';
  document.getElementById('ebar').style.display = 'flex';
  document.getElementById('svf').classList.add('on');
  render();
}

/** 退出編輯模式：同步畫面上的修改回資料、隱藏編輯 UI */
function exitE() {
  syncDOM(); // 定義在 render.js
  isEdit = false;
  dirty = false;
  document.getElementById('ebt').classList.remove('on');
  document.getElementById('ebl').textContent = '進入編輯模式';
  document.getElementById('ebar').style.display = 'none';
  document.getElementById('svf').classList.remove('on');
  document.getElementById('svind').style.display = 'none';
  render();
}

/**
 * 讓新增的文字區塊自動 focus 並選取全部內容，
 * 使用者可以直接打字覆蓋掉預設的提示文字
 */
function focusB(id) {
  setTimeout(function () {
    var el = document.getElementById('t-' + id);
    if (el) {
      el.focus();
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 80);
}

/** 頂部工具列「新增到頁尾」按鈕：在目前頁面最後面加入新區塊 */
function addEnd(type) {
  if (type === 'img') { insAt = undefined; opI(null); return; } // opI 定義在 upload.js

  syncDOM();
  var range = pageRange(); // 定義在 navigation.js
  var endIdx = range[1];

  var placeholder = { h1: '新主題名稱', h2: '副標題', h3: '小標題', step: '步驟說明', note: '注意事項' }[type];
  var b = { id: uid(), type: type, content: { text: placeholder } };

  if (type === 'h1') {
    blocks.splice(endIdx, 0, b);
    buildNav(); // 定義在 navigation.js
    goPage(b.id);
  } else {
    blocks.splice(endIdx, 0, b);
    render();
  }
  dirty = true;
  focusB(b.id);
}

/** 區塊間的「＋插入」按鈕：在指定位置之後插入新區塊 */
function insB(type, afterIdx) {
  if (type === 'img') { insAt = afterIdx; opI(null); return; }

  syncDOM();
  var placeholder = { h2: '副標題', h3: '小標題', step: '步驟說明', note: '注意事項' }[type];
  var b = { id: uid(), type: type, content: { text: placeholder } };

  blocks.splice(afterIdx + 1, 0, b);
  dirty = true;
  render();
  buildNav();
  focusB(b.id);
}

/** 上移區塊，但不允許跨越到上一個主題頁（避免區塊跑錯頁面） */
function mvUp(i) {
  syncDOM();
  if (i <= 0) return;
  var cur = blocks[i], prev = blocks[i - 1];
  if (prev.type === 'h1' && cur.type !== 'h1') return; // 前面是別的大標題，不能移過去
  blocks[i] = prev;
  blocks[i - 1] = cur;
  dirty = true;
  render();
  buildNav();
}

/** 下移區塊，同樣禁止跨頁；大標題本身也不允許下移（避免拆散頁面內容） */
function mvDn(i) {
  syncDOM();
  if (i >= blocks.length - 1) return;
  var cur = blocks[i], next = blocks[i + 1];
  if (cur.type === 'h1') return;
  if (cur.type !== 'h1' && next.type === 'h1') return; // 後面是下一頁的大標題，不能移過去
  blocks[i] = next;
  blocks[i + 1] = cur;
  dirty = true;
  render();
  buildNav();
}

/**
 * 刪除區塊
 * 如果刪的剛好是「目前顯示中」的大標題，自動跳去第一個還存在的主題頁，
 * 避免畫面留在一個已經不存在的頁面上變成空白
 */
function delB(i) {
  if (!confirm('確定刪除？')) return;
  syncDOM();

  var b = blocks[i];
  blocks.splice(i, 1);
  dirty = true;

  if (b.type === 'h1' && b.id === curPage) {
    var next = firstH1();
    buildNav();
    if (next) goPage(next.id);
    else { curPage = null; render(); }
  } else {
    render();
    buildNav();
  }
}

/** 編輯模式下，若有未儲存修改就關閉分頁/重新整理，跳出瀏覽器原生確認提醒 */
window.addEventListener('beforeunload', function (e) {
  if (isEdit && dirty) { e.preventDefault(); e.returnValue = ''; }
});
