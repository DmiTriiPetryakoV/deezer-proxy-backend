import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'https://dmitriipetryakov.github.io',
  'https://dmitriipetryakov.github.io/musicplaylist',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://dmitriipetryakov.github.io/musicplaylist/'
];

app.use(cors({
  origin: function (origin, callback) {
 
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin  ||
      origin.startsWith(allowedOrigin.replace(/\/$/, ''))
    )) {
      return callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));





app.get("/", (req, res) => {
  res.json({ 
    message: "Deezer Proxy Server is running!",
    endpoints: {
      search: "/search?q=artist+name",
      status: "/status"
    }
  });
});


app.get("/status", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    origin: req.get('origin') || 'No origin header'
  });
});


app.get("/search", async (req, res) => {
  const q = req.query.q;
  
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const response = await fetch(
     `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`
    );
    
    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }
    
    const data = await response.json();
    

    const limited = {
      
      ...data,
      data: data.data ? data.data.slice(0, 4) : []
    };
    
    res.json(limited);

  } catch (err) {
    console.error("Deezer API error:", err.message);
    res.status(500).json({ 
      error: "Ошибка запроса к Deezer API",
      details: err.message 
    });
  }
});


app.get("/track/:id", async (req, res) => {
  const trackId = req.params.id;
  
  try {
    const response = await fetch(
      `https://api.deezer.com/track/${trackId}`
    );
    
    if (!response.ok) {
      throw new Error( `Deezer API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("Deezer API error:", err.message);
    res.status(500).json({ 
      error: "Ошибка получения информации о треке",
      details: err.message 
    });
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🎵 Deezer Proxy Server запущен на порту ${PORT}`);
  console.log(`📍 Локальный URL: http://localhost:${PORT}`);
  console.log(`🌐 Доступные домены: ${allowedOrigins.join(', ')}`);
});