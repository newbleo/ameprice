# 아메가격 (AmePrice)

서울 전역 테이크아웃 아메리카노 가격 지도 — 사용자 참여형 크라우드소싱 서비스

## 서비스 목표
- 주변 가장 저렴한 아메리카노를 한눈에 확인
- 익명으로 누구나 가격 제보 가능
- 실시간 가격 업데이트

## 기술 스택
- **Frontend**: React + Vite
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (Supabase)
- **지도**: 네이버 지도 API
- **배포**: Vercel (frontend) + Render (backend)

## 로컬 개발 환경

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 프로젝트 구조
```
ameprice/
├── frontend/          # React + Vite
│   └── src/
├── backend/           # FastAPI
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
└── README.md
```
