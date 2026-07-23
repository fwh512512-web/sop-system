// ============================================================
// app.js — 應用程式進入點
// 這個檔案要放在所有其他 <script> 之後載入，
// 因為它宣告了全域共用的狀態變數，並在最後呼叫 init() 啟動整個頁面。
// ============================================================

// ── 全域狀態 ────────────────────────────────────────────────
var blocks = [];      // 目前所有 SOP 區塊資料
var isEdit = false;   // 是否處於編輯模式
var curPage = null;   // 目前顯示中的大標題 id
var sq = '';          // 目前的搜尋關鍵字（小寫）
var imgBid = null;    // 圖片 Modal 正在編輯的區塊 id（null 表示新增）
var upUrl = '';       // 圖片上傳成功後的網址，尚未存回 blocks 前暫存在這
var insAt;            // 圖片要插入的位置（區塊 index），undefined 表示插在頁尾

/**
 * 應用程式啟動流程：
 * 1. 先用內建的預設資料（defData）立即畫出畫面，使用者不需要等待網路
 * 2. 背景嘗試連線 JSONBin 抓最新資料，抓到才覆蓋畫面內容
 *    （連不上就維持顯示預設資料，不會卡住或報錯給使用者看）
 */
function init() {
  blocks = migrateAll(defData());
  buildNav();

  var first = firstH1();
  if (first) goPage(first.id); else render();

  setTimeout(function () {
    loadRemote(function (remoteBlocks) {
      blocks = migrateAll(remoteBlocks);
      buildNav();
      var f = firstH1();
      if (f) goPage(f.id);
      toast('✅ 已同步最新資料');
    });
  }, 400);
}

init();
