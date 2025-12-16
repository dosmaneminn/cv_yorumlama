import { useState, useEffect } from 'react'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabaseUrl = "https://hgrjpcnisunqoogakcji.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmpwY25pc3VucW9vZ2FrY2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDA4MjIsImV4cCI6MjA4MTExNjgyMn0.Kv8-uV9_-3GKlayP6LBVKhGuaifhd4W-Swyt5yZl5PA"
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  // --- STATE (DURUMLAR) ---
  const [ikEmail, setIkEmail] = useState('')
  const [girisYapildi, setGirisYapildi] = useState(false)
  const [yeniAdayAd, setYeniAdayAd] = useState('')
  const [yeniAdayEmail, setYeniAdayEmail] = useState('')
  const [basvurular, setBasvurular] = useState([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const [secilenBasvuru, setSecilenBasvuru] = useState(null)
  const [uploadDurumu, setUploadDurumu] = useState('') 
  
  // Arama ve Filtre
  const [aramaMetni, setAramaMetni] = useState('')
  const [filtreDurumu, setFiltreDurumu] = useState('hepsi') // hepsi, yuksek, incelendi

  // --- BAŞLANGIÇ ---
  useEffect(() => {
    const kayitliKullanici = localStorage.getItem('rosiva_ik_mail');
    if (kayitliKullanici) {
      setIkEmail(kayitliKullanici);
      setGirisYapildi(true);
      listeyiGuncelle(kayitliKullanici);
    }
  }, [])

  // --- LİSTE ÇEKME ---
  const listeyiGuncelle = async (aktifIkMail) => {
    const mail = aktifIkMail || ikEmail;
    setYukleniyor(true);
    try {
      const cevap = await axios.get(`https://localhost:5000/api/cvs?ikEmail=${mail}`)
      setBasvurular(cevap.data)
    } catch (hata) {
      console.error("Hata:", hata)
    } finally {
      setYukleniyor(false)
    }
  }

  // --- GİRİŞ / ÇIKIŞ ---
  const handleGiris = (e) => {
    e.preventDefault();
    if(!ikEmail) return alert("E-posta gerekli!");
    localStorage.setItem('rosiva_ik_mail', ikEmail);
    setGirisYapildi(true);
    listeyiGuncelle(ikEmail);
  }

  const handleCikis = () => {
    localStorage.removeItem('rosiva_ik_mail');
    setGirisYapildi(false);
    setIkEmail('');
    setBasvurular([]);
    setSecilenBasvuru(null);
  }

  const handleBasvuruSecim = (basvuru) => {
    if (secilenBasvuru && secilenBasvuru.id === basvuru.id) {
      setSecilenBasvuru(null); 
    } else {
      setSecilenBasvuru(basvuru);
    }
  }

  // --- YENİ: İNCELEMEYİ TAMAMLA (ARŞİVLE) ---
  const handleIncelemeyiBitir = async () => {
    if (!secilenBasvuru) return;
    
    // 1. Supabase'de güncelle
    const { error } = await supabase
      .from('basvurular')
      .update({ durum: 'İncelendi' })
      .eq('id', secilenBasvuru.id);

    if (error) {
      alert("Hata oluştu!");
      return;
    }

    // 2. Arayüzü güncelle (Sayfayı yenilemeden)
    setBasvurular(prev => prev.map(b => 
      b.id === secilenBasvuru.id ? { ...b, durum: 'İncelendi' } : b
    ));
    
    // Seçimi kapat veya güncelle
    setSecilenBasvuru(prev => ({ ...prev, durum: 'İncelendi' }));
    alert("✅ CV 'İncelendi' olarak işaretlendi!");
  }

  // --- DOSYA YÜKLEME ---
  const dosyaYukle = async (e) => {
    const dosya = e.target.files[0];
    if (!dosya) return;
    if (!yeniAdayAd || !yeniAdayEmail) {
      alert("İsim ve E-posta zorunlu!");
      e.target.value = null; return; 
    }
    setUploadDurumu('yukleniyor');
    try {
      const dosyaAdi = `${Date.now()}_${dosya.name.replace(/\s/g, '')}`;
      const { error: uploadError } = await supabase.storage.from('cv_deposu').upload(dosyaAdi, dosya);
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('cv_deposu').getPublicUrl(dosyaAdi);
      
      await axios.post('https://localhost:5000/api/analyze', {
        pdfUrl: publicData.publicUrl,
        adayEmail: yeniAdayEmail,
        adSoyad: yeniAdayAd,
        ikEmail: ikEmail
      });

      setUploadDurumu('bitti');
      alert("✅ Aday Eklendi! Analiz başlıyor...");
      setYeniAdayAd(''); setYeniAdayEmail(''); e.target.value = null;
      setTimeout(() => listeyiGuncelle(), 1000); 
    } catch (hata) {
      console.error(hata); setUploadDurumu('hata'); alert("Hata!");
    }
  }

  const getPuanRengi = (puan) => {
    if (puan === 0) return 'analiz'; 
    if (puan >= 80) return 'yuksek';
    if (puan >= 50) return 'orta';
    return 'dusuk';
  }

  // --- FİLTRELEME MANTIĞI ---
  const filtrelenmisBasvurular = basvurular.filter(b => {
    const metinUyumu = b.ad_soyad.toLowerCase().includes(aramaMetni.toLowerCase()) || 
                       b.email.toLowerCase().includes(aramaMetni.toLowerCase());
    
    if (filtreDurumu === 'hepsi') return metinUyumu;
    if (filtreDurumu === 'yuksek') return metinUyumu && b.puan >= 80;
    // YENİ FİLTRE: Sadece durumu 'İncelendi' olanlar
    if (filtreDurumu === 'incelendi') return metinUyumu && b.durum === 'İncelendi';
    
    return metinUyumu;
  });

  // --- GÖRÜNÜM ---
  if (!girisYapildi) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <img src="/logo.png" alt="Logo" className="brand-logo-img" onError={(e) => e.target.style.display='none'}/>
            <h1>İnsan Kaynakları Yönetim Paneli</h1>
          </div>
          <form onSubmit={handleGiris}>
            <div className="input-group">
              <input type="email" placeholder="Kurumsal E-posta Adresiniz" value={ikEmail} onChange={(e) => setIkEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary full-width">Giriş Yap</button>
          </form>
          <div className="login-footer">© 2025 Rosiva Tech</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="R" className="brand-logo-img sm" onError={(e) => e.target.style.display='none'}/>
          <span>Rosiva</span>
        </div>
        
        <div className="user-profile">
          <div className="avatar">{ikEmail[0].toUpperCase()}</div>
          <div className="user-details">
            <span className="user-email">{ikEmail}</span>
            <span className="user-role">Recruiter</span>
          </div>
        </div>

        <nav className="menu">
          <div className="menu-label">ADAY İŞLEMLERİ</div>
          <div className="upload-widget">
            <input type="text" placeholder="Ad Soyad" value={yeniAdayAd} onChange={(e) => setYeniAdayAd(e.target.value)} />
            <input type="email" placeholder="E-posta" value={yeniAdayEmail} onChange={(e) => setYeniAdayEmail(e.target.value)} />
            <label className={`btn-upload ${uploadDurumu === 'yukleniyor' ? 'loading' : ''}`}>
              {uploadDurumu === 'yukleniyor' ? 'Yükleniyor...' : '+ PDF Yükle'}
              <input type="file" accept=".pdf" onChange={dosyaYukle} hidden />
            </label>
          </div>
          <button className="btn-logout" onClick={handleCikis}>Çıkış Yap</button>
        </nav>
      </aside>

      {/* ANA İÇERİK */}
      <main className="main-content">
        <header className="top-bar">
          <h2>Aday Havuzu</h2>
          <div className="top-right" style={{marginLeft: 'auto', display:'flex', gap:'10px'}}>
            <span className="badge">{basvurular.length} Toplam</span>
            <span className="badge green">{basvurular.filter(x=>x.puan>=80).length} Yıldız</span>
          </div>
        </header>

        <div className="content-grid">
          
          {/* SOL PANEL */}
          <div className="list-panel">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Aday ara (İsim, E-posta)..." 
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
              />
              <div className="filter-tags">
                <button className={filtreDurumu==='hepsi' ? 'active':''} onClick={()=>setFiltreDurumu('hepsi')}>Tümü</button>
                <button className={filtreDurumu==='yuksek' ? 'active':''} onClick={()=>setFiltreDurumu('yuksek')}>Yüksek Puan</button>
                <button className={filtreDurumu==='incelendi' ? 'active':''} onClick={()=>setFiltreDurumu('incelendi')}>İncelendi ✔</button>
              </div>
            </div>

            <div className="list-items-container">
              {filtrelenmisBasvurular.length === 0 && <div className="empty-state" style={{padding:'20px', textAlign:'center', color:'#999'}}>Aday bulunamadı.</div>}
              {filtrelenmisBasvurular.map(basvuru => (
                <div 
                  key={basvuru.id} 
                  className={`list-item ${secilenBasvuru?.id === basvuru.id ? 'active' : ''}`}
                  onClick={() => handleBasvuruSecim(basvuru)}
                >
                  <div className="list-info">
                    <span className="list-name">{basvuru.ad_soyad}</span>
                    <span className="list-date">{new Date(basvuru.created_at).toLocaleDateString()}</span>
                  </div>
                  {basvuru.puan === 0 ? <span className="score-badge analiz">⏳</span> : <span className={`score-badge ${getPuanRengi(basvuru.puan)}`}>{basvuru.puan}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* SAĞ PANEL */}
          <div className="detail-panel">
            {secilenBasvuru ? (
              <div className="detail-card fade-in">
                
                {/* 1. ÜST KISIM (HEADER & BUTON) */}
                <div className="detail-header">
                  {secilenBasvuru.puan === 0 ? (
                    <div className="score-circle analiz"><div className="loader"></div></div>
                  ) : (
                    <div className={`score-circle ${getPuanRengi(secilenBasvuru.puan)}`}>{secilenBasvuru.puan}</div>
                  )}
                  <div className="header-text">
                    <h1>{secilenBasvuru.ad_soyad}</h1>
                    <span className="status-badge">{secilenBasvuru.durum || 'Beklemede'}</span>
                    {secilenBasvuru.puan === 0 && <span className="status-pill">⚡ AI İnceliyor...</span>}
                  </div>
                  
                  {/* AKSİYON BUTONLARI */}
                  <div className="action-buttons">
                    {/* YENİ BUTON: İNCELEDİM */}
                    {secilenBasvuru.durum !== 'İncelendi' && (
                       <button className="btn-mark-read" onClick={handleIncelemeyiBitir}>
                         ✅ İncelendi Olarak İşaretle
                       </button>
                    )}
                    
                    {secilenBasvuru.cv_url && <a href={secilenBasvuru.cv_url} target="_blank" className="btn-download">📄 CV</a>}
                  </div>
                </div>
                
                {/* 2. RAPOR KISMI */}
                <div className="report-container">
                   <div className="report-title">📌 YAPAY ZEKA DEĞERLENDİRMESİ</div>
                   <div className="ai-summary">
                      <p>{secilenBasvuru.ai_ozet}</p>
                   </div>
                </div>

                {/* 3. YENİ İLETİŞİM ALANI */}
                <div className="contact-section">
                  <div className="report-title">📞 İLETİŞİM BİLGİLERİ</div>
                  <div className="contact-card">
                    <div className="contact-item">
                      <span className="icon">📧</span>
                      <div className="info">
                        <label>E-Posta</label>
                        <a href={`mailto:${secilenBasvuru.email}`}>{secilenBasvuru.email}</a>
                      </div>
                    </div>
                    <div className="contact-item">
                      <span className="icon">👤</span>
                      <div className="info">
                        <label>Aday İsmi</label>
                        <span>{secilenBasvuru.ad_soyad}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* YENİ ANİMASYONLU BOŞ EKRAN */
              <div className="dashboard-logo-container fade-in">
                <div className="pulsing-logo-wrapper">
                  {/* LOGO BURAYA GELİYOR */}
                  <a href="https://www.instagram.com/rosivadigital/" target="_blank" rel="noreferrer">
    <img src="/logo.png" alt="Rosiva" className="pulsing-logo" />
  </a>
                  <div className="glow-effect"></div>
                </div>
                <h2>Rosiva Recruitment</h2>
                <p>İşe alımın geleceği parmaklarınızın ucunda.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App