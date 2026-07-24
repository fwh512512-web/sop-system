// ============================================================
// search.js — 關鍵字搜尋
// 實際的搜尋結果渲染（renderSearch）放在 render.js，
// 這裡只負責搜尋狀態（sq）的更新與搜尋橫幅的顯示。
// ============================================================

/** 側邊欄搜尋框輸入時觸發：更新搜尋字串、顯示符合筆數、重新渲染 */
function doSearch(v) {
  sq = v.trim().toLowerCase();
  var banner = document.getElementById('banner');

  if (sq) {
    var count = 0;
    for (var i = 0; i < blocks.length; i++) {
      if (searchableText(blocks[i]).toLowerCase().indexOf(sq) >= 0) count++;
    }
    banner.style.display = 'flex';
    document.getElementById('bt').textContent = '找到 ' + count + ' 個符合「' + v + '」的結果';
  } else {
    banner.style.display = 'none';
  }

  render(); // 定義在 render.js
}

/** 清除搜尋：清空輸入框、隱藏橫幅、回到一般頁面顯示 */
function clrSearch() {
  document.getElementById('si').value = '';
  sq = '';
  document.getElementById('banner').style.display = 'none';
  render();
}
