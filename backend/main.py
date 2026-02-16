from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    # リクエストテーブル（レアリティと詳細コメントを追加）
    cursor.execute('''CREATE TABLE IF NOT EXISTS requests 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       card_name TEXT, 
                       rarity TEXT, 
                       price INTEGER, 
                       condition TEXT, 
                       description TEXT)''')
    
    # 提案テーブル（承認ステータス status を追加）
    cursor.execute('''CREATE TABLE IF NOT EXISTS offers 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       request_id INTEGER, 
                       offer_price INTEGER, 
                       image_url TEXT, 
                       seller_comment TEXT,
                       status TEXT DEFAULT 'pending')''') # pending, approved
    conn.commit()
    conn.close()

init_db()

class CardRequest(BaseModel):
    card_name: str
    rarity: str
    price: int
    condition: str
    description: Optional[str] = ""

class Offer(BaseModel):
    request_id: int
    offer_price: int
    image_url: str
    seller_comment: str

# --- API ---

@app.post("/requests")
def post_request(req: CardRequest):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO requests (card_name, rarity, price, condition, description) VALUES (?, ?, ?, ?, ?)",
                   (req.card_name, req.rarity, req.price, req.condition, req.description))
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
    return [{"id": r[0], "card_name": r[1], "rarity": r[2], "price": r[3], "condition": r[4], "description": r[5]} for r in data]

@app.post("/offers")
def post_offer(off: Offer):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO offers (request_id, offer_price, image_url, seller_comment) VALUES (?, ?, ?, ?)",
                   (off.request_id, off.offer_price, off.image_url, off.seller_comment))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/offers/{request_id}")
def get_offers(request_id: int):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM offers WHERE request_id = ?", (request_id,))
    data = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "request_id": r[1], "offer_price": r[2], "image_url": r[3], "seller_comment": r[4], "status": r[5]} for r in data]

# 【新規】購入者が提案を承認するAPI
@app.post("/offers/{offer_id}/approve")
def approve_offer(offer_id: int):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE offers SET status = 'approved' WHERE id = ?", (offer_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "提案を承認しました。取引を開始します。"}