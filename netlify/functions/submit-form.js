// このファイルがサーバーサイドで動作するプロキシ（代理人）となります。
// AirtableとFirebaseへのAPIリクエストは、ここから安全に行われます。

// 'node-fetch' をインポートします。Netlifyの関数では必要です。
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // フロントエンドから送られてきたデータを受け取る
    const { orderData, items } = JSON.parse(event.body);

    // 環境変数から安全にAPIキーを読み込む
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

    const AIRTABLE_ORDERS_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/受付情報`;
    const AIRTABLE_ITEMS_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/商品情報`;
    const AIRTABLE_CERTIFICATES_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/証書情報`;

    try {
        // Step 1: 受付情報をAirtableに送信
        const orderResponse = await fetch(AIRTABLE_ORDERS_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: orderData })
        });
        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            throw new Error(`Airtable Order Error: ${errorText}`);
        }
        const newOrder = await orderResponse.json();
        const orderId = newOrder.id;

        // Step 2 & 3: 各商品情報と証書情報をAirtableに送信
        for (const item of items) {
            const { itemData, certData } = item;
            itemData['受付ID'] = [orderId]; // 受付IDを紐付ける

            const itemResponse = await fetch(AIRTABLE_ITEMS_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: itemData })
            });
            if (!itemResponse.ok) {
                const errorText = await itemResponse.text();
                throw new Error(`Airtable Item Error: ${errorText}`);
            }
            const newItem = await itemResponse.json();
            const itemId = newItem.id;

            certData['商品ID'] = [itemId]; // 商品IDを紐付ける
            const certResponse = await fetch(AIRTABLE_CERTIFICATES_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: certData })
            });
            if (!certResponse.ok) {
                const errorText = await certResponse.text();
                throw new Error(`Airtable Certificate Error: ${errorText}`);
            }
        }

        // 成功した場合は、成功メッセージを返す
        return {
            statusCode: 200,
            body: JSON.stringify({ message: '受付が正常に完了しました。' })
        };

    } catch (error) {
        console.error('Submission Error:', error);
        // エラーが発生した場合は、エラーメッセージを返す
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

