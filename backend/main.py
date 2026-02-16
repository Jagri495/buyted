import os
import shutil
import sqlite3
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# フロントエンドからのアクセスを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 【重要】assetsフォルダをWebから見えるように公開する
# これで http://127.0.0.1:8000/assets/filename.jpg で画像が表示可能になります
app.mount("/assets", StaticFiles(directory="../assets"), name="assets")

def init_db():
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS requests 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, card_name TEXT, rarity TEXT, 
                       price INTEGER, condition TEXT, description TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS offers 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER, 
                       offer_price INTEGER, image_url TEXT, seller_comment TEXT,
                       status TEXT DEFAULT 'pending')''')
    conn.commit()
    conn.close()

init_db()

# リクエスト用のモデル
class CardRequest(BaseModel):
    card_name: str
    rarity: str
    price: int
    condition: str
    description: Optional[str] = ""

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

# 【変更】提案投稿API：ファイルを受け取るために「Form」と「File」を使用
@app.post("/offers")
async def post_offer(
    request_id: int = Form(...),
    offer_price: int = Form(...),
    seller_comment: str = Form(...),
    image: UploadFile = File(...)
):
    # 1. assetsフォルダに画像を保存
    file_path = os.path.join("../assets", image.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # 2. DBにはファイル名を保存
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO offers (request_id, offer_price, image_url, seller_comment) VALUES (?, ?, ?, ?)",
                   (request_id, offer_price, image.filename, seller_comment))
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

@app.post("/offers/{offer_id}/approve")
def approve_offer(offer_id: int):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE offers SET status = 'approved' WHERE id = ?", (offer_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}