const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Render環境の動的ポートに対応（ローカル環境では3000番を使用）
const PORT = process.env.PORT || 3000;

// POSTリクエストのBody（JSONやURLエンコード）を解析するためのミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

/**
 * サムネイルURLリストを取得するAPIエンドポイント
 * POST /api/thumbnails
 */
app.post('/api/thumbnails', async (req, res) => {
    // リクエストからurlを取得（PHPの $_POST['url'] に相当）
    const url = req.body.url;

    // URLが指定されていない場合のエラーハンドリング
    if (!url) {
        return res.status(400).json({
            status: "error",
            message: "xvideos動画のURLを貼り付けてください。"
        });
    }

    try {
        // 外部APIへリクエストを送信
        const apiUrl = `http://api.erodouga-rin.net/thumbnails?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API response status: ${response.status}`);
        }

        // JSONとしてパース
        const obj = await response.json();

        // PHPのロジックと同様に、statusとthumbnailsの存在・値を確認
        if (obj && obj.status === "success" && Array.isArray(obj.thumbnails)) {
            // 成功時は取得したサムネイルのURL配列をそのままJSONで返す
            return res.json({
                status: "success",
                thumbnails: obj.thumbnails
            });
        } else {
            // API側のステータスがsuccessではない、またはデータ構造が不正な場合
            return res.status(500).json({
                status: "error",
                message: "取得に失敗しました。外部APIからの応答が不正です。"
            });
        }

    } catch (error) {
        // 通信エラーやその他の例外処理
        console.error("Error fetching thumbnails:", error);
        return res.status(500).json({
            status: "error",
            message: "取得に失敗しました。サーバー内部でエラーが発生しました。"
        });
    }
});

// メイン画面のHTMLを返す
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
