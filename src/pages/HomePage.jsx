import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import * as THREE from 'three'
import '../components/HomePage.css'

const W = 560
const H = 380

export default function HomePage() {
  const location = useLocation()
  const rootRef = useRef(null)
  const heroCanvasRef = useRef(null)
  const [imgModalOpen, setImgModalOpen] = useState(false)

  const authCode = new URLSearchParams(location.search).get('code')
  if (authCode) {
    return <Navigate to={`/login${location.search}`} replace />
  }
  const hash = location.hash
  if (hash && /access_token|refresh_token|type=/.test(hash)) {
    const hashPart = hash.startsWith('#') ? hash.slice(1) : hash
    const linkType = new URLSearchParams(hashPart).get('type')
    if (linkType === 'recovery') {
      return <Navigate to={{ pathname: '/reset-password', hash: hashPart }} replace />
    }
    return <Navigate to={{ pathname: '/login', hash: hashPart }} replace />
  }

  useEffect(() => {
    document.title = 'SENSO — Learn Braille'
  }, [])

  useEffect(() => {
    const canvas = heroCanvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 100)
    camera.position.set(0, 9, 7)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const key = new THREE.DirectionalLight(0xffffff, 0.5)
    key.position.set(4, 12, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.3)
    fill.position.set(-6, 4, -4)
    scene.add(fill)

    const device = new THREE.Group()
    scene.add(device)

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x6b7280 })
    device.add(new THREE.Mesh(new THREE.BoxGeometry(6, 1.5, 4), bodyMat))

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(5.85, 0.07, 3.85),
      new THREE.MeshLambertMaterial({ color: 0x6b7280 }),
    )
    cap.position.y = 0.78
    device.add(cap)

    const dotMat = new THREE.MeshLambertMaterial({ color: 0xe8e4dc })
    ;[
      [-2.1, -0.95],
      [-1.35, -0.95],
      [-2.1, 0],
      [-1.35, 0],
      [-2.1, 0.95],
      [-1.35, 0.95],
    ].forEach(([x, z]) => {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.28, 22), dotMat)
      d.position.set(x, 0.75 + 0.15, z)
      device.add(d)
    })

    const enter = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.22, 0.92),
      new THREE.MeshLambertMaterial({ color: 0x1a2a4a }),
    )
    enter.position.set(1.6, 0.75 + 0.11, -0.75)
    device.add(enter)

    const triShape = new THREE.Shape()
    triShape.moveTo(0, -0.45)
    triShape.lineTo(0.5, 0.35)
    triShape.lineTo(-0.5, 0.35)
    triShape.closePath()

    const triGeo = new THREE.ExtrudeGeometry(triShape, { depth: 0.22, bevelEnabled: false })
    const bs = new THREE.Mesh(triGeo, new THREE.MeshLambertMaterial({ color: 0xf05a28 }))
    bs.rotation.x = -Math.PI / 2
    bs.rotation.z = Math.PI / 2
    bs.position.set(1.6, 0.75 + 0.11, 0.65)
    device.add(bs)

    const btm = new THREE.Mesh(
      new THREE.BoxGeometry(5.9, 0.06, 3.9),
      new THREE.MeshLambertMaterial({ color: 0x5a6170 }),
    )
    btm.position.y = -0.78
    device.add(btm)

    device.rotation.x = -0.55
    device.rotation.z = 0.15

    let raf = 0
    function animate() {
      raf = requestAnimationFrame(animate)
      device.rotation.y += 0.009
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      renderer.dispose()
      scene.clear()
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const nav = rootRef.current?.querySelector('#navbar')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1'
            e.target.style.transform = 'translateY(0)'
          }
        })
      },
      { threshold: 0.1 },
    )

    root.querySelectorAll('.about-inner, .goal-inner, .goal-card, #purchase h2').forEach((el) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(30px)'
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="home-page" ref={rootRef}>
      <nav id="navbar">
        <Link to="/login" className="nav-account" title="Account">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </Link>
        <div className="nav-logo">senso</div>
        <div style={{ width: 38 }} />
      </nav>

      <section id="hero">
        <div className="hero-canvas-wrap">
          <canvas id="heroCanvas" ref={heroCanvasRef} width={560} height={380} />
          <h1 className="hero-title">
            s
            <span className="braille-e-cell">
              <span className="bd-row">
                <span className="bd" />
                <span className="bd-empty" />
              </span>
              <span className="bd-row">
                <span className="bd-empty" />
                <span className="bd" />
              </span>
              <span className="bd-row">
                <span className="bd-empty" />
                <span className="bd-empty" />
              </span>
            </span>
            nso
          </h1>
        </div>
        <p className="hero-sub">Braille learning, made tactile</p>
        <Link to="/login" className="btn-begin">
          Sign In
        </Link>
        <div className="hero-bypass">
          <Link
            to="/lessons"
            className="btn-bypass btn-bypass-student"
            onClick={() => sessionStorage.setItem('senso_student_bypass', '1')}
          >
            Temporary student bypass
          </Link>
          <button type="button" className="btn-bypass btn-bypass-teacher" title="Coming soon">
            Temporary teacher bypass
          </button>
        </div>
        <div className="scroll-hint">scroll</div>
      </section>

      <section id="about">
        <div className="about-inner">
          <div
            className="device-photo"
            style={{ background: 'transparent' }}
            onClick={() => setImgModalOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && setImgModalOpen(true)}
            role="button"
            tabIndex={0}
            title="Click to zoom"
          >
            <img
              src="/sensoproto.png"
              alt="SENSO device"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: 16,
                cursor: 'zoom-in',
                transform: 'scale(1.1)',
              }}
            />
            <div className="device-label">SENSO device</div>
          </div>

          {imgModalOpen ? (
            <div
              role="presentation"
              onClick={() => setImgModalOpen(false)}
              style={{
                display: 'flex',
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 999,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'zoom-out',
              }}
            >
              <img
                src="/sensoproto.png"
                alt="SENSO device"
                style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 16 }}
              />
            </div>
          ) : null}

          <div className="about-text">
            <h2>What is SENSO?</h2>
            <p>
              SENSO is an affordable, compact braille learning tool designed for kids and beginners.
              Learn up to grade two braille with our teacher, Sen.
            </p>
            <p>
              Six tactile dot buttons map directly to a braille cell — your fingers learn the language
              naturally, just by playing.
            </p>
          </div>
        </div>
      </section>

      <section id="goal">
        <div className="goal-inner">
          <div className="goal-tag">Our Mission</div>
          <h2>Breaking barriers through Braille literacy</h2>
          <p>
            Blindness affects over 43 million people worldwide. Braille literacy opens doors to education,
            independence, and opportunity — yet most learners never get access to proper tools.
          </p>
          <div className="goal-cards">
            <div className="goal-card">
              <div className="goal-icon" style={{ background: '#fff0eb' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e8501a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 11V6a2 2 0 0 0-4 0v5" />
                  <path d="M14 10V4a2 2 0 0 0-4 0v6" />
                  <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
                  <path d="M6 14a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2.5" />
                </svg>
              </div>
              <h3>Tactile Learning</h3>
              <p>Muscle memory through real button presses, not screens</p>
            </div>
            <div className="goal-card">
              <div className="goal-icon" style={{ background: '#eaf0ff' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3d6ec9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3>Grade 1 & 2</h3>
              <p>Full curriculum from alphabet to contracted braille</p>
            </div>
            <div className="goal-card">
              <div className="goal-icon" style={{ background: '#e8f7ef' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2a9d5c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>Affordable</h3>
              <p>Designed to reach learners in under-resourced settings</p>
            </div>
          </div>
        </div>
      </section>

      <section id="purchase">
        <h2>Get your SENSO</h2>
        <p>Everything you need to start your braille journey, right out of the box.</p>
        <a
          href="#"
          className="btn-purchase"
          onClick={(e) => {
            e.preventDefault()
            alert('Shop coming soon! 🎉')
          }}
        >
          Purchase Here →
        </a>
      </section>

      <footer>
        <span>SENSO</span> — Braille Learning Device &nbsp;·&nbsp; Made with care &nbsp;·&nbsp; © 2026
      </footer>
    </div>
  )
}
