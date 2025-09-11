// Airtable APIと通信するための部品をインポートします。
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // 1. Netlifyによって認証されたユーザー情報を取得します。
  // この関数は、ログインしていないユーザーからは呼び出せません。
  const { user } = context.clientContext;
  if (!user) {
    return {
      statusCode: 401, // Unauthorized
      body: JSON.stringify({ error: '認証されていません。ログインが必要です。' }),
    };
  }

  // 2. Airtableの秘密情報を環境変数から安全に読み込みます。
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID_A, AIRTABLE_CUSTOMERS_TABLE } = process.env;

  try {
    // 3. ログインしているユーザーのIDを使い、Airtableの顧客台帳を検索します。
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_A}/${AIRTABLE_CUSTOMERS_TABLE}?filterByFormula={netlify_user_id}="${user.sub}"`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtableからの顧客データの取得に失敗しました: ${await response.text()}`);
    }

    const data = await response.json();

    if (data.records.length > 0) {
      // 4. お客様が見つかった場合、その情報をブラウザに返します。
      return {
        statusCode: 200,
        body: JSON.stringify({ customer: data.records[0].fields }),
      };
    } else {
      // 5. もし何らかの理由でAirtableに顧客情報が見つからなかった場合
      return {
        statusCode: 404,
        body: JSON.stringify({ customer: null, message: '顧客情報が見つかりませんでした。' }),
      };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
