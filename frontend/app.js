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
            card_name: name, rarity: rarity, price: parseInt(price), 
            condition: condition, description: description
        })
    });
    location.reload();
}

async function approveOffer(offerId) {
    if(!confirm("この提案を承認して取引を開始しますか？")) return;
    await fetch(`${API_URL}/offers/${offerId}/approve`, { method: 'POST' });
    location.reload();
}

function openOfferModal(id, name) {
    currentRequestId = id;
    document.getElementById('modalTargetCard').innerText = `「${name}」への提案`;
    document.getElementById('offerModal').style.display = "block";
}

function closeModal() {
    document.getElementById('offerModal').style.display = "none";
}

// 【重要】提案送信：FormDataを使ってファイルを送る
async function submitOffer() {
    const price = document.getElementById('offerPrice').value;
    const comment = document.getElementById('offerComment').value;
    const fileInput = document.getElementById('offerImageFile');
    const file = fileInput.files[0];

    if(!price || !file) return alert("価格と写真を選択してください");

    const formData = new FormData();
    formData.append('request_id', currentRequestId);
    formData.append('offer_price', price);
    formData.append('seller_comment', comment);
    formData.append('image', file);

    const res = await fetch(`${API_URL}/offers`, {
        method: 'POST',
        body: formData // FormDataの場合はheadersを指定しないのがコツ
    });

    if(res.ok) {
        alert("提案を送信しました！");
        location.reload();
    }
}

async function loadRequests() {
    const res = await fetch(`${API_URL}/requests`);
    const requests = await res.json();
    const list = document.getElementById('requestList');
    list.innerHTML = '<h3>募集中のリクエスト一覧</h3>';
    
    for (const req of requests.reverse()) {
        const offRes = await fetch(`${API_URL}/offers/${req.id}`);
        const offers = await offRes.json();

        let offersHtml = "";
        offers.forEach(off => {
            const isApproved = off.status === 'approved';
            offersHtml += `
                <div class="offer-box" style="${isApproved ? 'background:#e3f2fd; border-left-color:#2196f3;' : ''}">
                    <strong>提案：${off.offer_price.toLocaleString()}円</strong> 
                    ${isApproved ? '<b style="color:#2196f3;"> [承認済み]</b>' : ''}<br>
                    <span>💬 ${off.seller_comment || "コメントなし"}</span><br>
                    <img src="${API_URL}/assets/${off.image_url}" style="width:100%; max-width:300px; border-radius:8px; margin-top:10px; display:block;">
                    <br>
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
                <p style="font-size: 0.8em; background:#f9f9f9; padding:5px; border-radius:4px;">メモ: ${req.description || 'なし'}</p>
                
                <button class="offer-btn" onclick="openOfferModal(${req.id}, '${req.card_name}')">このリクエストに応募する</button>
                <div id="offers-${req.id}">${offersHtml}</div>
            </div>
        `;
    }
}
loadRequests();