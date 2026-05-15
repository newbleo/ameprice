import { useEffect, useRef, useState } from 'react'
import './App.css'

const SAMPLE_CAFES = [
  { id: 1, name: '메가커피 강남역점', address: '서울 강남구 강남대로 396', price: 1500, lat: 37.4979, lng: 127.0276 },
  { id: 2, name: '컴포즈커피 강남역점', address: '서울 서초구 강남대로 373', price: 1500, lat: 37.4962, lng: 127.0282 },
  { id: 3, name: '빽다방 강남역점', address: '서울 강남구 강남대로 438', price: 1500, lat: 37.4990, lng: 127.0272 },
  { id: 4, name: '스타벅스 강남역점', address: '서울 서초구 강남대로 385', price: 4700, lat: 37.4969, lng: 127.0279 },
]

export default function App() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [selectedCafe, setSelectedCafe] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!window.naver || mapInstanceRef.current) return

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.4979, 127.0276),
      zoom: 16,
    })
    mapInstanceRef.current = map

    SAMPLE_CAFES.forEach(cafe => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(cafe.lat, cafe.lng),
        map,
        title: cafe.name,
      })

      const infowindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding:10px 14px;min-width:160px">
            <strong style="font-size:14px">${cafe.name}</strong>
            <p style="color:#2563eb;font-size:18px;font-weight:700;margin:4px 0">${cafe.price.toLocaleString()}원</p>
            <p style="color:#64748b;font-size:12px">${cafe.address}</p>
          </div>
        `,
      })

      window.naver.maps.Event.addListener(marker, 'click', () => {
        infowindow.open(map, marker)
        setSelectedCafe(cafe)
      })
    })
  }, [])

  const moveTo = (cafe) => {
    const map = mapInstanceRef.current
    if (!map) return
    map.setCenter(new window.naver.maps.LatLng(cafe.lat, cafe.lng))
    map.setZoom(18)
    setSelectedCafe(cafe)
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">☕ 아메가격</h1>
        <p className="tagline">내 주변 테이크아웃 아메리카노 최저가</p>
      </header>

      <div ref={mapRef} className="map" />

      <section className="cafe-list">
        <div className="list-header">
          <h2>주변 카페 ({SAMPLE_CAFES.length})</h2>
          <button className="btn-report" onClick={() => setShowForm(true)}>+ 가격 제보</button>
        </div>
        {SAMPLE_CAFES.sort((a, b) => a.price - b.price).map(cafe => (
          <div
            key={cafe.id}
            className={`cafe-item ${selectedCafe?.id === cafe.id ? 'active' : ''}`}
            onClick={() => moveTo(cafe)}
          >
            <div className="cafe-info">
              <span className="cafe-name">{cafe.name}</span>
              <span className="cafe-address">{cafe.address}</span>
            </div>
            <span className="cafe-price">{cafe.price.toLocaleString()}원</span>
          </div>
        ))}
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>가격 제보하기</h3>
            <p style={{color:'#64748b',fontSize:'14px',marginBottom:'16px'}}>익명으로 제보됩니다</p>
            <input className="input" type="text" placeholder="카페 이름" />
            <input className="input" type="text" placeholder="주소" />
            <input className="input" type="number" placeholder="아메리카노 가격 (원)" />
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowForm(false)}>취소</button>
              <button className="btn-submit">제보하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
