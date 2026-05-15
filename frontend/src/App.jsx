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
  const reportModeRef = useRef(false)
  const myLocationMarkerRef = useRef(null)
  const [selectedCafe, setSelectedCafe] = useState(null)
  const [reportMode, setReportMode] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [reportLocation, setReportLocation] = useState(null)
  const [cafeName, setCafeName] = useState('')
  const [cafePrice, setCafePrice] = useState('')
  const [locating, setLocating] = useState(false)

  const setReportModeSync = (val) => {
    reportModeRef.current = val
    setReportMode(val)
  }

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
        if (reportModeRef.current) return
        infowindow.open(map, marker)
        setSelectedCafe(cafe)
      })
    })

    window.naver.maps.Event.addListener(map, 'click', (e) => {
      if (!reportModeRef.current) return
      setReportLocation({ lat: e.coord.lat(), lng: e.coord.lng() })
      setShowForm(true)
      setReportModeSync(false)
    })
  }, [])

  const moveTo = (cafe) => {
    const map = mapInstanceRef.current
    if (!map) return
    map.setCenter(new window.naver.maps.LatLng(cafe.lat, cafe.lng))
    map.setZoom(18)
    setSelectedCafe(cafe)
  }

  const moveToMyLocation = () => {
    if (!navigator.geolocation) return
    const map = mapInstanceRef.current
    if (!map) return

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        map.setCenter(new window.naver.maps.LatLng(lat, lng))
        map.setZoom(17)

        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.setPosition(new window.naver.maps.LatLng(lat, lng))
        } else {
          myLocationMarkerRef.current = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(lat, lng),
            map,
            icon: {
              content: '<div class="my-location-dot"><div class="my-location-pulse"></div></div>',
              anchor: new window.naver.maps.Point(12, 12),
            },
          })
        }
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleReportClick = () => {
    setReportModeSync(true)
    setReportLocation(null)
    setCafeName('')
    setCafePrice('')
  }

  const handleFormClose = () => {
    setShowForm(false)
    setReportModeSync(false)
    setReportLocation(null)
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">🧋 아메가격</h1>
        <p className="tagline">내 주변 테이크아웃 아메리카노 최저가</p>
      </header>

      <div className="map-container">
        <div ref={mapRef} className="map" />

        <button
          className={`btn-my-location ${locating ? 'locating' : ''}`}
          onClick={moveToMyLocation}
          title="내 위치"
        >
          {locating ? '⏳' : '◎'}
        </button>

        {reportMode && (
          <div className="map-overlay">
            <div className="map-overlay-message">
              📍 가격을 제보할 카페 위치를 탭하세요
              <button className="btn-overlay-cancel" onClick={() => setReportModeSync(false)}>취소</button>
            </div>
          </div>
        )}
      </div>

      <section className="cafe-list">
        <div className="list-header">
          <h2>주변 카페 ({SAMPLE_CAFES.length})</h2>
          <button className="btn-report" onClick={handleReportClick}>+ 가격 제보</button>
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
        <div className="modal-overlay" onClick={handleFormClose}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>가격 제보하기</h3>
            <p className="modal-sub">익명으로 제보됩니다</p>

            {reportLocation && (
              <div className="location-badge">
                📍 위치 선택됨 ({reportLocation.lat.toFixed(4)}, {reportLocation.lng.toFixed(4)})
              </div>
            )}

            <label className="input-label">카페 이름</label>
            <input
              className="input"
              type="text"
              placeholder="예: 메가커피 강남역점"
              value={cafeName}
              onChange={e => setCafeName(e.target.value)}
              autoFocus
            />

            <label className="input-label">아메리카노 가격</label>
            <div className="price-input-wrap">
              <input
                className="input"
                type="number"
                placeholder="예: 1500"
                value={cafePrice}
                onChange={e => setCafePrice(e.target.value)}
              />
              <span className="price-unit">원</span>
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleFormClose}>취소</button>
              <button
                className="btn-submit"
                disabled={!cafeName || !cafePrice}
              >
                제보하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
