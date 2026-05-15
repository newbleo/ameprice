import { useEffect, useRef, useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL

export default function App() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const reportModeRef = useRef(false)
  const myLocationMarkerRef = useRef(null)
  const markersRef = useRef([])

  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCafe, setSelectedCafe] = useState(null)
  const [reportMode, setReportMode] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [reportLocation, setReportLocation] = useState(null)
  const [cafeName, setCafeName] = useState('')
  const [cafePrice, setCafePrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)

  const setReportModeSync = (val) => {
    reportModeRef.current = val
    setReportMode(val)
  }

  const fetchCafes = async () => {
    try {
      const res = await fetch(`${API}/cafes`)
      const data = await res.json()
      setCafes(data)
      return data
    } catch (e) {
      console.error('카페 불러오기 실패', e)
      return []
    } finally {
      setLoading(false)
    }
  }

  const renderMarkers = (map, data) => {
    markersRef.current.forEach(({ marker, infowindow }) => {
      marker.setMap(null)
      infowindow.close()
    })
    markersRef.current = []

    data.forEach(cafe => {
      if (!cafe.lat || !cafe.lng) return

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(cafe.lat, cafe.lng),
        map,
        title: cafe.name,
      })

      const infowindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding:10px 14px;min-width:160px">
            <strong style="font-size:14px">${cafe.name}</strong>
            <p style="color:#2563eb;font-size:18px;font-weight:700;margin:4px 0">
              ${cafe.price ? cafe.price.toLocaleString() + '원' : '가격 정보 없음'}
            </p>
            <p style="color:#64748b;font-size:12px">${cafe.address ?? ''}</p>
          </div>
        `,
      })

      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (reportModeRef.current) return
        infowindow.open(map, marker)
        setSelectedCafe(cafe)
      })

      markersRef.current.push({ marker, infowindow })
    })
  }

  useEffect(() => {
    if (!window.naver || mapInstanceRef.current) return

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.4979, 127.0276),
      zoom: 16,
    })
    mapInstanceRef.current = map

    window.naver.maps.Event.addListener(map, 'click', (e) => {
      if (!reportModeRef.current) return
      setReportLocation({ lat: e.coord.lat(), lng: e.coord.lng() })
      setShowForm(true)
      setReportModeSync(false)
    })

    fetchCafes().then(data => renderMarkers(map, data))
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

  const handleSubmit = async () => {
    if (!cafeName || !cafePrice) return
    setSubmitting(true)
    try {
      await fetch(`${API}/cafes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cafeName,
          lat: reportLocation?.lat ?? 37.4979,
          lng: reportLocation?.lng ?? 127.0276,
          price: parseInt(cafePrice),
        }),
      })
      handleFormClose()
      const data = await fetchCafes()
      renderMarkers(mapInstanceRef.current, data)
    } catch (e) {
      alert('제보 실패. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
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
          <h2>주변 카페 ({loading ? '...' : cafes.length})</h2>
          <button className="btn-report" onClick={handleReportClick}>+ 가격 제보</button>
        </div>

        {loading ? (
          <div className="loading">카페 정보를 불러오는 중...</div>
        ) : cafes.length === 0 ? (
          <div className="loading">아직 등록된 카페가 없습니다.<br />첫 번째 제보자가 되어보세요!</div>
        ) : (
          cafes.map(cafe => (
            <div
              key={cafe.id}
              className={`cafe-item ${selectedCafe?.id === cafe.id ? 'active' : ''}`}
              onClick={() => moveTo(cafe)}
            >
              <div className="cafe-info">
                <span className="cafe-name">{cafe.name}</span>
                <span className="cafe-address">{cafe.address ?? '위치 정보 없음'}</span>
              </div>
              <span className="cafe-price">
                {cafe.price ? cafe.price.toLocaleString() + '원' : '-'}
              </span>
            </div>
          ))
        )}
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
                disabled={!cafeName || !cafePrice || submitting}
                onClick={handleSubmit}
              >
                {submitting ? '제보 중...' : '제보하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
