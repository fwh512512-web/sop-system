// ============================================================
// upload.js — 圖片上傳 Modal 的互動邏輯
// 實際上傳到 Cloudinary 的網路請求在 storage.js（uploadToCloudinary）
// 這裡只負責 Modal 的開關、拖曳/選檔事件、確認送出後更新 blocks
// ============================================================

/**
 * 開啟圖片上傳 Modal
 * bid 為 null 表示「新增圖片」；有值表示「更換某個既有圖片區塊」
 */
function opI(bid) {
  imgBid = bid;
  upUrl = '';
  document.getElementById('ic').value = '';
  document.getElementById('ui').innerHTML = '<div style="font-size:28px">📷</div><p>點擊或拖曳圖片到這裡（最大10MB）</p>';
  document.getElementById('us').textContent = '';

  if (bid) {
    var b = findBlock(bid);
    if (b) document.getElementById('ic').value = bCaption(b);
  }

  document.getElementById('im').style.display = '';
}

/** 關閉圖片上傳 Modal 並重置狀態 */
function clI() {
  document.getElementById('im').style.display = 'none';
  imgBid = null;
  upUrl = '';
  insAt = undefined;
}

/**
 * 確認插入/更新圖片
 * - 若是更換既有圖片（imgBid 有值）：直接更新該區塊的 content
 * - 若是新增：依 insAt（插入位置）決定放在哪裡，沒有指定就放在頁面最後
 */
function okI() {
  if (!upUrl) { toast('⚠️ 請先上傳圖片'); return; }
  var caption = document.getElementById('ic').value.trim();
  syncDOM();

  if (imgBid) {
    var b = findBlock(imgBid);
    if (b) b.content = { url: upUrl, caption: caption };
  } else {
    var newBlock = { id: uid(), type: 'img', content: { url: upUrl, caption: caption } };
    if (insAt !== undefined) {
      blocks.splice(insAt + 1, 0, newBlock);
    } else {
      var range = pageRange();
      blocks.splice(range[1], 0, newBlock);
    }
  }

  dirty = true;
  clI();
  render();
  buildNav();
}

/** <input type="file"> 選擇檔案時觸發 */
function hFile(input) {
  if (input.files[0]) upImg(input.files[0]);
}

/** 拖曳圖片到上傳區時觸發 */
function hDrop(e) {
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  if (file && file.type.indexOf('image') === 0) upImg(file);
}

/** 執行實際上傳，並更新 Modal 內的預覽/狀態文字 */
function upImg(file) {
  if (file.size > 10485760) { toast('⚠️ 圖片不能超過10MB'); return; }

  document.getElementById('ui').innerHTML = '<div class="sp"></div>';
  document.getElementById('us').textContent = '上傳中…';

  uploadToCloudinary(
    file,
    function (secureUrl) { // 成功
      upUrl = secureUrl;
      document.getElementById('ui').innerHTML = '<img src="' + secureUrl + '" class="upr">';
      document.getElementById('us').textContent = '✅ 上傳成功';
    },
    function () { // 失敗
      document.getElementById('ui').innerHTML = '<div style="font-size:28px">📷</div><p>點擊或拖曳圖片到這裡</p>';
      document.getElementById('us').textContent = '❌ 上傳失敗';
    }
  );
}
