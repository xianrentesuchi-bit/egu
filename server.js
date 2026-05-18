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
        const data = response.data;

        // サムネイルがnullの場合に動画URLからサムネイルURLを生成してセットする処理
        if (data && data.results && Array.isArray(data.results)) {
            data.results = data.results.map(video => {
                if (!video.thumbnail && video.url) {
                    // xvideosのURLからID部分（video.xxxxxxx の xxxxxxx）を抽出する
                    const match = video.url.match(/video\.([^/]+)/);
                    if (match && match[1]) {
                        const videoId = match[1];
                        // 指定された形式のサムネイルURLを適用（IDをパラメータ等に付与、もしくは指定の固定URLに設定）
                        // ここでは指定されたURLの形式に、識別可能な動画IDなどのパラメータ（&id=）を付加して生成します
                        video.thumbnail = `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxHBNB_KIOXvqaeqck-wz2IuJefwu8w8P8K4A9BppJhvfIOz7bYA&s&id=${videoId}`;
                    } else {
                        // 抽出できない場合のデフォルトフォールバック
                        video.thumbnail = `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxHBNB_KIOXvqaeqck-wz2IuJefwu8w8P8K4A9BppJhvfIOz7bYA&s`;
                    }
                }
                return video;
            });
        }
        
        res.json(data);
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
