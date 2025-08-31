// Airtable APIと通信するための部品をインポートします。
const fetch = require('node-fetch');

// サーバーレス関数の本体
exports.handler = async (event) => {
  // 環境変数から秘密のキーとテーブル名を安全に読み込みます。
  const { 
    AIRTABLE_API_KEY, 
    AIRTABLE_BASE_ID_A, 
    AIRTABLE_BASE_ID_B,
    AIRTABLE_ORDERS_TABLE,
    AIRTABLE_ITEMS_TABLE,
    AIRTABLE_CERTS_TABLE
  } = process.env;

  // 必要な環境変数が設定されているかチェックします。
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID_A || !AIRTABLE_BASE_ID_B || !AIRTABLE_ORDERS_TABLE || !AIRTABLE_ITEMS_TABLE || !AIRTABLE_CERTS_TABLE) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '必要なAirtableの環境変数が設定されていません。' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { baseSelection, order, items } = data;

    let targetBaseId;
    if (baseSelection === 'baseA') {
      targetBaseId = AIRTABLE_BASE_ID_A;
    } else if (baseSelection === 'baseB') {
      targetBaseId = AIRTABLE_BASE_ID_B;
    } else {
      throw new Error(`無効なBaseが指定されました: ${baseSelection}`);
    }

    // --- 1. 'orders' テーブルに受付情報を記録 ---
    const orderTableUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_ORDERS_TABLE}`;
    const orderResponse = await fetch(orderTableUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: order }),
    });
    if (!orderResponse.ok) throw new Error(`Airtable「${AIRTABLE_ORDERS_TABLE}」への記録に失敗: ${await orderResponse.text()}`);
    const newOrder = await orderResponse.json();
    const orderRecordId = newOrder.id; // 作成されたレコードのIDを取得

    // --- 2. 各商品を'items'と'certificate_table'に記録 ---
    for (const item of items) {
      // itemsテーブルに、先ほど作成した注文レコードのIDをリンクとして追加
      item.itemDetails[AIRTABLE_ORDERS_TABLE] = [orderRecordId]; 
      
      const itemTableUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_ITEMS_TABLE}`;
      const itemResponse = await fetch(itemTableUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: item.itemDetails }),
      });
      if (!itemResponse.ok) throw new Error(`Airtable「${AIRTABLE_ITEMS_TABLE}」への記録に失敗: ${await itemResponse.text()}`);
      const newItem = await itemResponse.json();
      const itemRecordId = newItem.id;

      // certificate_tableに、先ほど作成した商品レコードのIDをリンクとして追加
      item.certDetails[AIRTABLE_ITEMS_TABLE] = [itemRecordId];
      
      const certTableUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_CERTS_TABLE}`;
      const certResponse = await fetch(certTableUrl, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ fields: item.certDetails }),
      });
      if (!certResponse.ok) throw new Error(`Airtable「${AIRTABLE_CERTS_TABLE}」への記録に失敗: ${await certResponse.text()}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '受付が正常に完了しました。', orderId: orderRecordId }),
    };

  } catch (error) {
    console.error('サーバーレス関数でエラーが発生しました:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

