require('dotenv').config(); // Gizli şifreleri (.env) okur
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // n8n ile konuşmak için
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

// --- 1. GÜVENLİK VE AYARLAR (Middleware) ---
app.use(cors()); // Kapıları herkese aç (Frontend girebilsin)
app.use(express.json()); // Gelen verileri JSON olarak oku

// --- 2. SUPABASE BAĞLANTISI ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ HATA: .env dosyasında SUPABASE bilgileri eksik!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 3. ROTALAR (Yol Haritası) ---

// A) Sağlık Kontrolü (Tarayıcıdan girince bunu görürsün)
app.get('/', (req, res) => {
  res.send('🏹 Rosiva Backend Kalesi Ayakta! (Burada bir şey yok, /api/cvs adresine git)');
});

// B) CV'leri Listeleme (E-Posta Filtreli)
// B) CV'leri Listeleme (GÜNCELLENDİ: İK E-Postasına Göre Getir)
app.get('/api/cvs', async (req, res) => {
  const { ikEmail } = req.query; // Artık 'email' değil 'ikEmail' soruyoruz

  console.log(`🔍 İK Sorgusu: ${ikEmail}`);

  if (!ikEmail) return res.json([]); 

  const { data, error } = await supabase
    .from('basvurular')
    .select('*')
    .eq('ik_email', ikEmail) // <--- KRİTİK NOKTA: Sadece bu İK'nın yüklediklerini getir
    .order('created_at', { ascending: false }); // En yeniler üstte olsun

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// C) n8n Tetikleme (Dosya Yüklendiğinde Burası Çalışır)
// C) n8n Tetikleme ve Veritabanına Kayıt (GÜNCELLENDİ)
// C) n8n Tetikleme ve Kayıt (GÜNCELLENDİ: İK İmzasını Ekle)
app.post('/api/analyze', async (req, res) => {
  // Frontend'den artık 'ikEmail' de geliyor
  const { pdfUrl, adayEmail, adSoyad, ikEmail } = req.body; 

  console.log("📥 İK Yüklemesi:", { ik: ikEmail, aday: adSoyad });

  try {
    const { data, error } = await supabase
      .from('basvurular')
      .insert([
        { 
          ad_soyad: adSoyad, 
          email: adayEmail, // Adayın maili (iletişim için)
          ik_email: ikEmail, // <--- YÜKLEYEN KİŞİ (Filtre için)
          cv_url: pdfUrl,
          durum: 'Analiz Ediliyor...', 
          puan: 0, 
          ai_ozet: 'Yapay zeka inceliyor...' 
        }
      ])
      .select();

    // ... (Kodun geri kalanı, n8n kısmı aynı kalabilir) ...
    
    // NOT: n8n kısmında bir değişiklik yapmana gerek yok, 
    // n8n sadece PDF'i okur, kimin yüklediğiyle ilgilenmez.
    // ...

    res.json({ message: 'Başvuru alındı, analiz başlıyor!', kayit: data });

  } catch (err) {
    console.error("Genel Hata:", err.message);
    res.status(500).json({ error: 'İşlem sırasında sunucu hatası.' });
  }
});

// --- 4. SUNUCUYU BAŞLAT ---
app.listen(port, () => {
  console.log(`🔥 Sunucu ${port} portunda nöbette!`);
  console.log(`👉 Test Linki: http://localhost:${port}/`);
});