from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
import uuid

from database import get_db
import models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CafeCreate(BaseModel):
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    price: int


class PriceReportCreate(BaseModel):
    price: int


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/cafes")
def get_cafes(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT c.id, c.name, c.address, c.lat, c.lng,
               pr.price, pr.reported_at
        FROM cafes c
        LEFT JOIN LATERAL (
            SELECT price, reported_at
            FROM price_reports
            WHERE cafe_id = c.id
            ORDER BY reported_at DESC
            LIMIT 1
        ) pr ON true
        ORDER BY pr.price ASC NULLS LAST
    """))
    return [
        {
            "id": str(row.id),
            "name": row.name,
            "address": row.address,
            "lat": row.lat,
            "lng": row.lng,
            "price": row.price,
            "reported_at": row.reported_at.isoformat() if row.reported_at else None,
        }
        for row in result
    ]


@app.post("/cafes")
def create_cafe(cafe: CafeCreate, db: Session = Depends(get_db)):
    new_cafe = models.Cafe(
        name=cafe.name,
        address=cafe.address,
        lat=cafe.lat,
        lng=cafe.lng,
    )
    db.add(new_cafe)
    db.flush()

    db.add(models.PriceReport(cafe_id=new_cafe.id, price=cafe.price))
    db.commit()
    db.refresh(new_cafe)
    return {"id": str(new_cafe.id), "name": new_cafe.name}


@app.post("/cafes/{cafe_id}/reports")
def add_report(cafe_id: str, report: PriceReportCreate, db: Session = Depends(get_db)):
    cafe = db.query(models.Cafe).filter(models.Cafe.id == uuid.UUID(cafe_id)).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")

    db.add(models.PriceReport(cafe_id=uuid.UUID(cafe_id), price=report.price))
    db.commit()
    return {"success": True}
