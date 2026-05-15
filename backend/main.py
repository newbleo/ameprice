from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from database import supabase

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
def get_cafes():
    cafes = supabase.table("cafes").select("*").execute().data
    reports = supabase.table("price_reports").select("*").order("reported_at", desc=True).execute().data

    latest = {}
    for r in reports:
        if r["cafe_id"] not in latest:
            latest[r["cafe_id"]] = r

    for cafe in cafes:
        report = latest.get(cafe["id"])
        cafe["price"] = report["price"] if report else None
        cafe["reported_at"] = report["reported_at"] if report else None

    cafes.sort(key=lambda x: (x["price"] is None, x["price"]))
    return cafes


@app.post("/cafes")
def create_cafe(cafe: CafeCreate):
    result = supabase.table("cafes").insert({
        "name": cafe.name,
        "address": cafe.address,
        "lat": cafe.lat,
        "lng": cafe.lng,
    }).execute()

    cafe_id = result.data[0]["id"]

    supabase.table("price_reports").insert({
        "cafe_id": cafe_id,
        "price": cafe.price,
    }).execute()

    return {"id": cafe_id, "name": cafe.name}


@app.post("/cafes/{cafe_id}/reports")
def add_report(cafe_id: str, report: PriceReportCreate):
    exists = supabase.table("cafes").select("id").eq("id", cafe_id).execute().data
    if not exists:
        raise HTTPException(status_code=404, detail="Cafe not found")

    supabase.table("price_reports").insert({
        "cafe_id": cafe_id,
        "price": report.price,
    }).execute()

    return {"success": True}
