const path = require('path'); // 在檔案最上方加入這一行
// 引入我們剛裝好的零件
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const app = express();

// 這裡加入新程式碼：讓電腦知道首頁在哪裡
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 新增路徑
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

// 在 app.get 之外定義一個標準價目表 (單位是分)
const PRODUCTS = {
    'pearl_milk_tea': { name: '珍珠奶茶', price: 10000 },
    'latte_coffee': { name: '拿鐵咖啡', price: 15000 }
};

app.get('/checkout', async (req, res) => {
    try {
        // 1. 前端只傳送「商品 ID」(id)，不再傳送名稱和價格
        const productId = req.query.id; 
        
        // 2. 從我們自己的價目表找出該商品
        const product = PRODUCTS[productId];

        // 3. 安全檢查：如果 ID 不存在，就報錯
        if (!product) {
            return res.status(400).send('找不到該商品，請重新選擇！');
        }

        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price_data: {
                    currency: 'twd',
                    product_data: { name: product.name }, // 使用後端的正確名稱
                    unit_amount: product.price,           // 使用後端的正確價格（防竄改！）
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'http://localhost:3000/success', // 改成連到自己的成功頁面
            cancel_url: 'http://localhost:3000/',        // 取消則回首頁
        });

        res.redirect(303, session.url);
    } catch (error) {
        res.status(500).send(`發生錯誤：${error.message}`);
    }
});

app.listen(3000, () => console.log('伺服器啟動成功！請打開瀏覽器輸入 localhost:3000/checkout'));