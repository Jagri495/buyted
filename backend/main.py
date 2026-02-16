from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース初期化（提案テーブルを追加）
def init_db():
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    # リクエストテーブル
    cursor.execute('''CREATE TABLE IF NOT EXISTS requests 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, card_name TEXT, price INTEGER, condition TEXT)''')
    
    # 【新規】提案テーブル
    # request_id は requests テーブルの id と紐付きます
    cursor.execute('''CREATE TABLE IF NOT EXISTS offers 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       request_id INTEGER, 
                       offer_price INTEGER, 
                       image_url TEXT, 
                       seller_comment TEXT)''')
    conn.commit()
    conn.close()

init_db()

# データモデル
class CardRequest(BaseModel):
    card_name: str
    price: int
    condition: str

class Offer(BaseModel):
    request_id: int
    offer_price: int
    image_url: str
    seller_comment: str

# --- リクエスト関連 ---
@app.post("/requests")
def post_request(req: CardRequest):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO requests (card_name, price, condition) VALUES (?, ?, ?)",
                   (req.card_name, req.price, req.condition))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/requests")
def get_requests():
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM requests")
    data = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "card_name": r[1], "price": r[2], "condition": r[3]} for r in data]

# --- 【新規】提案（Offer）関連 ---
@app.post("/offers")
def post_offer(off: Offer):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO offers (request_id, offer_price, image_url, seller_comment) VALUES (?, ?, ?, ?)",
                   (off.request_id, off.offer_price, off.image_url, off.seller_comment))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "提案が保存されました"}

@app.get("/offers/{request_id}")
def get_offers_for_request(request_id: int):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM offers WHERE request_id = ?", (request_id,))
    data = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "request_id": r[1], "offer_price": r[2], "image_url": r[3], "seller_comment": r[4]} for r in data]