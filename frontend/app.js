const API_URL = "http://127.0.0.1:8000";

// 1. リクエストをバックエンドに送る関数
async function sendRequest() {
    const name = document.getElementById('cardName').value;
    const price = document.getElementById('price').value;

    if(!name || !price) {
        return alert("カード名と価格を入力してください");
    }

    // バックエンドの /requests にデータを送信
    const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            card_name: name, 
            price: parseInt(price), 
            condition: "美品" // プロトタイプなので固定
        })
    });

    if (response.ok) {
        alert("リクエストを投稿しました！");
        // 入力欄を空にする
        document.getElementById('cardName').value = "";
        document.getElementById('price').value = "";
        // 一覧を再読み込み
        loadRequests();
    }
}

// 2. バックエンドからリクエスト一覧を取得して画面に出す関数
async function loadRequests() {
    const res = await fetch(`${API_URL}/requests`);
    const data = await res.json();
    
    const list = document.getElementById('requestList');
    list.innerHTML = '<h3>募集中リクエスト</h3>'; // 一旦リセット

    if (data.length === 0) {
        list.innerHTML += '<p>現在募集中のカードはありません。</p>';
    }

    data.reverse().forEach(req => { // 新しい順に表示
        list.innerHTML += `
            <div class="request-card">
                <b>${req.card_name}</b><br>
                希望価格：<span class="price">${req.price.toLocaleString()}円</span> (${req.condition})
            </div>
        `;
    });
}

// ページを開いた時に実行
loadRequests();