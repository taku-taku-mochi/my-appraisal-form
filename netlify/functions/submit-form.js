const fetch = require('node-fetch');

const getAirtableHeaders = () => ({
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
});

exports.handler = async (event) => {
  const { 
    AIRTABLE_BASE_ID_A, 
    AIRTABLE_ORDERS_TABLE,
    AIRTABLE_ITEMS_TABLE,
    AIRTABLE_CERTS_TABLE,
    AIRTABLE_CUSTOMERS_TABLE
  } = process.env;

  if (!process.env.AIRTABLE_API_KEY || !AIRTABLE_BASE_ID_A || !AIRTABLE_ORDERS_TABLE || !AIRTABLE_ITEMS_TABLE || !AIRTABLE_CERTS_TABLE || !AIRTABLE_CUSTOMERS_TABLE) {
    return { statusCode: 500, body: JSON.stringify({ error: '必要なAirtableの環境変数が設定されていません。' })};
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { order, items } = data;
    const targetBaseId = AIRTABLE_BASE_ID_A;

    // --- 1. 顧客の検索または新規作成 ---
    const { customer_name, email, contact_info, netlify_user_id } = order;
    let customerRecordId;

    // Eメールをキーに既存の顧客を検索
    const searchCustomerUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_CUSTOMERS_TABLE}?filterByFormula=({email}="${encodeURIComponent(email)}")`;
    const searchResponse = await fetch(searchCustomerUrl, { headers: getAirtableHeaders() });
    if (!searchResponse.ok) throw new Error(`Airtableでの顧客検索に失敗: ${await searchResponse.text()}`);
    
    const searchResult = await searchResponse.json();

    if (searchResult.records.length > 0) {
      // 顧客が見つかった場合
      customerRecordId = searchResult.records[0].id;
      const existingRecord = searchResult.records[0].fields;

      // ★追加：もしNetlify IDが未登録なら、既存の顧客情報に紐付ける
      if (netlify_user_id && !existingRecord.netlify_user_id) {
        const updateUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_CUSTOMERS_TABLE}/${customerRecordId}`;
        await fetch(updateUrl, {
          method: 'PATCH',
          headers: getAirtableHeaders(),
          body: JSON.stringify({ fields: { netlify_user_id } }),
        });
      }
    } else {
      // 顧客が見つからない場合：新規作成 (Netlify IDも一緒に保存)
      const createCustomerUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_CUSTOMERS_TABLE}`;
      const createResponse = await fetch(createCustomerUrl, {
        method: 'POST',
        headers: getAirtableHeaders(),
        body: JSON.stringify({ fields: { customer_name, email, contact_info, netlify_user_id } }),
      });
      if (!createResponse.ok) throw new Error(`Airtableでの顧客作成に失敗: ${await createResponse.text()}`);
      const newCustomer = await createResponse.json();
      customerRecordId = newCustomer.id;
    }

    // --- 2. 'orders' テーブルに受付情報を記録 ---
    const orderForAirtable = { ...order };
    delete orderForAirtable.customer_name;
    delete orderForAirtable.contact_info;
    delete orderForAirtable.email;
    delete orderForAirtable.netlify_user_id; // ordersテーブルには不要
    orderForAirtable.customer = [customerRecordId];

    const orderTableUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_ORDERS_TABLE}`;
    const orderResponse = await fetch(orderTableUrl, {
      method: 'POST',
      headers: getAirtableHeaders(),
      body: JSON.stringify({ fields: orderForAirtable }),
    });
    if (!orderResponse.ok) throw new Error(`Airtable「${AIRTABLE_ORDERS_TABLE}」への記録に失敗: ${await orderResponse.text()}`);
    const newOrder = await orderResponse.json();
    const orderRecordId = newOrder.id;

    // --- 3. 各商品を'items'と'certificate_table'に記録 ---
    for (const item of items) {
      item.itemDetails.orders = [orderRecordId];
      
      const itemTableUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_ITEMS_TABLE}`;
      const itemResponse = await fetch(itemTableUrl, {
        method: 'POST',
        headers: getAirtableHeaders(),
        body: JSON.stringify({ fields: item.itemDetails }),
      });
      if (!itemResponse.ok) throw new Error(`Airtable「${AIRTABLE_ITEMS_TABLE}」への記録に失敗: ${await itemResponse.text()}`);
      const newItem = await itemResponse.json();
      const itemRecordId = newItem.id;

      item.certDetails.items = [itemRecordId];
      
      const certTableUrl = `https://api.airtable.com/v0/${targetBaseId}/${AIRTABLE_CERTS_TABLE}`;
      const certResponse = await fetch(certTableUrl, {
         method: 'POST',
         headers: getAirtableHeaders(),
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

