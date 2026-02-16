const API_URL = "http://127.0.0.1:8000";
let currentRequestId = null;

// リクエスト送信
async function sendRequest() {
    const name = document.getElementById('cardName').value;
    const price = document.getElementById('price').value;
    if(!name || !price) return alert("入力してください");

    await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ card_name: name, price: parseInt(price), condition: "美品" })
    });
    location.reload();
}

// 提案モーダルを開く
function openOfferModal(id, name) {
    currentRequestId = id;
    document.getElementById('modalTargetCard').innerText = "対象カード: " + name;
    document.getElementById('offerModal').style.display = "block";
}

function closeModal() {
    document.getElementById('offerModal').style.display = "none";
}

// 提案を送信
async function submitOffer() {
    const price = document.getElementById('offerPrice').value;
    const img = document.getElementById('offerImage').value;
    const comment = document.getElementById('offerComment').value;

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

// リクエスト一覧と、それに紐づく提案をロード
async function loadRequests() {
    const res = await fetch(`${API_URL}/requests`);
    const requests = await res.json();
    const list = document.getElementById('requestList');
    
    for (const req of requests.reverse()) {
        // 各リクエストに対する提案を取得
        const offRes = await fetch(`${API_URL}/offers/${req.id}`);
        const offers = await offRes.json();

        let offersHtml = "";
        offers.forEach(off => {
            offersHtml += `
                <div class="offer-box">
                    <b>提案あり：${off.offer_price}円</b><br>
                    コメント：${off.seller_comment}<br>
                    <small>画像：${off.image_url}</small>
                </div>
            `;
        });

        list.innerHTML += `
            <div class="request-card">
                <b>${req.card_name}</b> - <span class="price">${req.price}円</span> (${req.condition})
                <br>
                <button class="offer-btn" onclick="openOfferModal(${req.id}, '${req.card_name}')">提案する</button>
                <div id="offers-${req.id}">${offersHtml}</div>
            </div>
        `;
    }
}
loadRequests();