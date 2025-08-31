// Airtable APIと通信するための部品をインポートします。
const fetch = require('node-fetch');

// サーバーレス関数の本体
exports.handler = async (event) => {
  // 2つのBase IDを環境変数から安全に読み込みます。
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID_A, AIRTABLE_BASE_ID_B } = process.env;

  // Airtableのキーが設定されていない場合はエラーを返します。
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID_A || !AIRTABLE_BASE_ID_B) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AirtableのAPIキーまたはBase IDがNetlifyの環境変数に設定されていません。' }),
    };
  }

  // POSTリクエスト以外は受け付けません。
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // フロントエンドから送られてきたJSONデータを解析します。
    const data = JSON.parse(event.body);
    const { baseSelection, order, items } = data; // フロントからbaseSelectionを受け取ります。

    // フロントエンドからの指示に応じて、使用するBase IDを決定します。
    let targetBaseId;
    if (baseSelection === 'baseA') {
      targetBaseId = AIRTABLE_BASE_ID_A;
    } else if (baseSelection === 'baseB') {
      targetBaseId = AIRTABLE_BASE_ID_B;
    } else {
      // 'baseA'でも'baseB'でもない、予期せぬ値が来た場合はエラーにします。
      throw new Error(`無効なBaseが指定されました: ${baseSelection}`);
    }

    // --- 1. 受付情報をAirtableに記録 ---
    const orderTableUrl = `https://api.airtable.com/v0/${targetBaseId}/受付情報`;
    const orderResponse = await fetch(orderTableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: order }),
    });

    if (!orderResponse.ok) {
      throw new Error(`Airtable「受付情報」への記録に失敗しました: ${await orderResponse.text()}`);
    }
    const newOrder = await orderResponse.json();
    const orderId = newOrder.id; // 作成された受付情報のIDを取得します。

    // --- 2. 各商品と証書情報を、関連付けながら記録 ---
    for (const item of items) {
      // 商品情報に、先ほど作成した受付IDを紐付けます。
      item.itemDetails['受付ID'] = [orderId];
      
      const itemTableUrl = `https://api.airtable.com/v0/${targetBaseId}/商品情報`;
      const itemResponse = await fetch(itemTableUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: item.itemDetails }),
      });

      if (!itemResponse.ok) {
        throw new Error(`Airtable「商品情報」への記録に失敗しました: ${await itemResponse.text()}`);
      }
      const newItem = await itemResponse.json();
      const itemId = newItem.id; // 作成された商品情報のIDを取得します。

      // 証書情報に、先ほど作成した商品IDを紐付けます。
      item.certDetails['商品ID'] = [itemId];
      
      const certTableUrl = `https://api.airtable.com/v0/${targetBaseId}/証書情報`;
      const certResponse = await fetch(certTableUrl, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ fields: item.certDetails }),
      });

      if (!certResponse.ok) {
        throw new Error(`Airtable「証書情報」への記録に失敗しました: ${await certResponse.text()}`);
      }
    }

    // すべての処理が成功した場合、成功メッセージを返します。
    return {
      statusCode: 200,
      body: JSON.stringify({ message: '受付が正常に完了しました。', orderId: orderId }),
    };

  } catch (error) {
    console.error('サーバーレス関数でエラーが発生しました:', error);
    // エラーが発生した場合、エラーメッセージを返します。
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

