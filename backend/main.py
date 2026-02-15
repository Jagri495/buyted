from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()

# 【重要】フロントエンド（HTML）からのアクセスを許可する設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # どこからでも接続OK（開発用）
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベースの初期化（buyted.db というファイルが自動で作られます）
def init_db():
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    # テーブル作成：ID, カード名, 価格, 状態
    cursor.execute('''CREATE TABLE IF NOT EXISTS requests 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, card_name TEXT, price INTEGER, condition TEXT)''')
    conn.commit()
    conn.close()

init_db()

# データの形を定義
class CardRequest(BaseModel):
    card_name: str
    price: int
    condition: str

# 1. リクエストを受け取る（保存する）
@app.post("/requests")
def post_request(req: CardRequest):
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO requests (card_name, price, condition) VALUES (?, ?, ?)",
                   (req.card_name, req.price, req.condition))
    conn.commit()
    conn.close()
    return {"status": "success"}

# 2. リクエスト一覧を返す
@app.get("/requests")
def get_requests():
    conn = sqlite3.connect('buyted.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM requests")
    data = cursor.fetchall()
    conn.close()
    # フロントエンドが使いやすいようにリスト形式に変換
    return [{"id": r[0], "card_name": r[1], "price": r[2], "condition": r[3]} for r in data]

@app.get("/")
def home():
    return {"message": "buyted API is running!"}