const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Render環境の動的ポートに対応（ローカル環境では3000番を使用）
const PORT = process.env.PORT || 3000;

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// 1. 検索APIのエンドポイント
app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q || '';
        const page = req.query.page || '1';
        
        // 外部の検索APIを呼び出し
        const targetUrl = `https://nyaa-rho.vercel.app/api/search?q=${encodeURIComponent(keyword)}&page=${page}`;
        const response = await axios.get(targetUrl);
        
        res.json(response.data);
    } catch (error) {
        console.error('Search API Error:', error.message);
        res.status(500).json({ error: '検索に失敗しました' });
    }
});

// 2. ストリーム情報取得APIのエンドポイント
app.get('/api/stream', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        if (!videoUrl) {
            return res.status(400).json({ error: 'URLパラメータが必要です' });
        }

        // 外部のストリーム取得APIを呼び出し
        const targetUrl = `https://api-so9i.onrender.com/get_stream?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(targetUrl);
        
        res.json(response.data);
    } catch (error) {
        console.error('Stream API Error:', error.message);
        res.status(500).json({ error: 'ストリーム情報の取得に失敗しました' });
    }
});

// メイン画面のHTMLを返す
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
