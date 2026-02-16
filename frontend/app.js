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
async function loadRequests() {
    const res = await fetch(`${API_URL}/requests`);
    const requests = await res.json();
    const list = document.getElementById('requestList');
    
    // リクエストごとに、それに紐づく提案も取得
    for (const req of requests.reverse()) {
        const offRes = await fetch(`${API_URL}/offers/${req.id}`);
        const offers = await offRes.json();

        let offersHtml = "";
        offers.forEach(off => {
            offersHtml += `
                <div class="offer-box">
                    <strong>提案：${off.offer_price.toLocaleString()}円</strong><br>
                    <span>💬 ${off.seller_comment || "コメントなし"}</span><br>
                    <small style="color:#666;">🖼 画像URL: ${off.image_url}</small>
                </div>
            `;
        });

        list.innerHTML += `
            <div class="request-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:1.2em; font-weight:bold;">${req.card_name}</span>
                    <span class="price">${req.price.toLocaleString()}円</span>
                </div>
                <p style="color:#666;">希望状態：${req.condition}</p>
                <button class="offer-btn" onclick="openOfferModal(${req.id}, '${req.card_name}')">このリクエストに応募する</button>
                <div id="offers-${req.id}">${offersHtml}</div>
            </div>
        `;
    }
}

loadRequests();