// ============================================================
// storage.js — 資料儲存與圖片上傳
// 所有對 JSONBin / Cloudinary 的網路請求都集中在這個檔案
// ⚠️ 注意：CFG 裡的金鑰目前是明文寫在前端，任何人看原始碼都能看到。
//    這是已知風險，之後可考慮改用後端（如 Cloudflare Worker）代理，
//    讓金鑰不會出現在瀏覽器端。
// ============================================================

var CFG = {
  BIN: '6a603f6cf5f4af5e29af2fa1',
  KEY: '$2a$10$gMxDaF3CQfAsAvbqEQpgDOmNNFmz9CXKzA7pgg0u2Lb0pMkrxVQAW',
  CLD: 'db1pzd5xq',
  PRE: 'sop_upload',
  PWD: '1234'
};

/**
 * 從 JSONBin 讀取最新資料（背景執行，不阻塞畫面顯示）
 * 成功且有資料時才呼叫 onSuccess(rawBlocksArray)
 * 失敗就靜默放棄，畫面繼續用目前已顯示的資料（通常是預設資料）
 */
function loadRemote(onSuccess) {
  fetch('https://api.jsonbin.io/v3/b/' + CFG.BIN + '/latest', {
    headers: { 'X-Master-Key': CFG.KEY }
  })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) {
      var rm = (j.record && j.record.blocks) || [];
      if (rm.length > 0 && onSuccess) onSuccess(rm);
    })
    .catch(function () { /* 連不上就算了，不影響已顯示的內容 */ });
}

/** 右下角儲存按鈕的點擊入口：非編輯模式時只提示，不會真的送出請求 */
function doSave() {
  if (!isEdit) { toast('⚠️ 請先進入編輯模式'); return; }
  saveNow();
}

/**
 * 把目前的 blocks 陣列存回 JSONBin
 * 會更新畫面上的儲存狀態指示（svind）與右下角儲存按鈕的樣式
 */
function saveNow() {
  syncDOM(); // 定義在 render.js：把畫面上正在編輯的文字同步回 blocks

  var ind = document.getElementById('svind');
  ind.style.display = 'inline';
  ind.style.color = '#4A7C59';
  ind.textContent = '儲存中…';

  fetch('https://api.jsonbin.io/v3/b/' + CFG.BIN, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': CFG.KEY },
    body: JSON.stringify({ blocks: blocks })
  })
    .then(function (r) { if (!r.ok) throw 0;
      ind.style.color = '#2D7D46';
      ind.textContent = '✓ 已儲存';
      toast('✅ 已儲存');
      dirty = false; // 定義在 editor.js：標記「有未儲存修改」的旗標
    })
    .catch(function () {
      ind.style.color = '#FF3B30';
      ind.textContent = '儲存失敗';
      toast('❌ 儲存失敗，請檢查網路後重試');
    });
}

/**
 * 上傳圖片檔案到 Cloudinary
 * 成功時呼叫 onDone(secureUrl)，失敗時呼叫 onFail()
 * UI 的 loading / 預覽狀態切換交給呼叫端（upload.js）處理
 */
function uploadToCloudinary(file, onDone, onFail) {
  var fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CFG.PRE);
  fd.append('folder', 'sop-system');

  fetch('https://api.cloudinary.com/v1_1/' + CFG.CLD + '/image/upload', {
    method: 'POST',
    body: fd
  })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) { if (onDone) onDone(j.secure_url); })
    .catch(function () { if (onFail) onFail(); });
}
