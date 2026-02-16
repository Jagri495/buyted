const API_URL = "http://127.0.0.1:8000";
let currentRequestId = null;

// リクエスト投稿
async function sendRequest() {
    const name = document.getElementById('cardName').value;
    const rarity = document.getElementById('cardRarity').value;
    const condition = document.getElementById('cardCondition').value;
    const description = document.getElementById('cardDescription').value;
    const price = document.getElementById('price').value;

    if(!name || !price) return alert("必須項目を入力してください");

    await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            card_name: name, 
            rarity: rarity,
            price: parseInt(price), 
            condition: condition,
            description: description
        })
    });
    location.reload();
}
async function approveOffer(offerId) {
    if(!confirm("この提案を承認して取引を開始しますか？")) return;

    const res = await fetch(`${API_URL}/offers/${offerId}/approve`, { method: 'POST' });
    if(res.ok) {
        alert("取引が成立しました！対面または郵送の手続きに進みます。");
        location.reload();
    }
}
// モーダルの開閉
function openOfferModal(id, name) {
    currentRequestId = id;
    document.getElementById('modalTargetCard').innerText = `「${name}」への提案`;
    document.getElementById('offerModal').style.display = "block";
}

function closeModal() {
    document.getElementById('offerModal').style.display = "none";
}

// 提案の送信
async function submitOffer() {
    const price = document.getElementById('offerPrice').value;
    const img = document.getElementById('offerImage').value;
    const comment = document.getElementById('offerComment').value;

    if(!price || !img) return alert("価格と画像URLを入力してください");

    await fetch(`${API_URL}/offers`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            request_id: currentRequestId,
            offer_price: parseInt(price),
            image_url: img,
            seller_comment: comment
        })
    });
    alert("提案を送信しました！");
    closeModal();
    location.reload();
}

// データの一覧表示
// データの一覧表示
async function loadRequests() {
    const res = await fetch(`${API_URL}/requests`);
    const requests = await res.json();
    const list = document.getElementById('requestList');
    list.innerHTML = '<h3>募集中のリクエスト一覧</h3>'; // 重複防止のために一度クリア
    
    for (const req of requests.reverse()) {
        const offRes = await fetch(`${API_URL}/offers/${req.id}`);
        const offers = await offRes.json();

        let offersHtml = "";
        offers.forEach(off => {
            // 承認済みかどうかの判定で見た目を変える
            const isApproved = off.status === 'approved';
            offersHtml += `
                <div class="offer-box" style="${isApproved ? 'background:#e3f2fd; border-left-color:#2196f3;' : ''}">
                    <strong>提案：${off.offer_price.toLocaleString()}円</strong> 
                    ${isApproved ? '<b style="color:#2196f3;"> [承認済み]</b>' : ''}<br>
                    <span>💬 ${off.seller_comment || "コメントなし"}</span><br>
                    <small style="color:#666;">🖼 画像URL: ${off.image_url}</small><br>
                    ${(!isApproved) ? `<button onclick="approveOffer(${off.id})" style="background:#2196f3; padding:5px 10px; font-size:12px; margin-top:5px; width:auto;">この提案を承認する</button>` : ''}
                </div>
            `;
        });

        list.innerHTML += `
            <div class="request-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:1.2em; font-weight:bold;">${req.card_name}</span>
                    <span class="price">${req.price.toLocaleString()}円</span>
                </div>
                <p style="margin: 5px 0; color:#007bff; font-weight:bold;">レアリティ: ${req.rarity || '未指定'}</p>
                <p style="margin: 5px 0; color:#666;">希望状態：${req.condition}</p>
                <p style="font-size: 0.9em; background:#f9f9f9; padding:5px; border-radius:4px;">メモ: ${req.description || 'なし'}</p>
                
                <button class="offer-btn" onclick="openOfferModal(${req.id}, '${req.card_name}')">このリクエストに応募する</button>
                <div id="offers-${req.id}">${offersHtml}</div>
            </div>
        `;
    }
}
loadRequests();