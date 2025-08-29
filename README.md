鑑別・鑑定受付フォーム プロジェクトこれは、鑑別・鑑定の依頼を受け付けるためのウェブフォームです。顧客情報、商品情報、オプション、画像ファイルを一括で受け取り、AirtableとFirebase Storageにデータを保存します。主な機能マルチステップフォーム: ユーザーが入力しやすいように、プロセスを3つのステップに分割しています。動的な商品追加: 1つの依頼で複数の商品を追加・削除できます。料金の自動計算: 選択された証書やオプションに応じて、概算見積金額をリアルタイムで計算します。画像アップロード: ドラッグ＆ドロップまたはファイル選択で、商品画像をアップロードできます。データ連携:フォームの入力内容は Airtable のデータベースに記録されます。アップロードされた画像は Firebase Storage に保存され、そのURLがAirtableに記録されます。セットアップ手順1. ローカル環境の準備このリポジトリをクローンまたはダウンロードします。index.html ファイルをブラウザで開くと、フォームが表示されます。2. Firebase の設定このフォームの画像アップロード機能を利用するには、Firebaseプロジェクトの設定が必要です。Firebaseプロジェクトを作成: Firebaseコンソールで新しいプロジェクトを作成します。ウェブアプリを追加: プロジェクト設定からウェブアプリ（</>）を追加し、表示されるfirebaseConfigオブジェクトをコピーします。Firebase Storageを有効化: 左メニューの「ビルド」>「Storage」から有効化します。Storageのセキュリティルールを更新: Storageの「ルール」タブで、以下の内容に書き換えて公開します。rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow write: if request.auth != null; // 匿名認証を含む認証済みユーザーのみ書き込みを許可
      allow read; // 全員に読み取りを許可
    }
  }
}
script.jsを更新: script.jsファイル内のfirebaseConfigを、ステップ2でコピーしたものに置き換えます。3. Airtable の設定AirtableでBaseを準備: 以下のテーブル構成でBaseを作成します。受付情報: 顧客名, 連絡先, 受付日, 希望納期, 合計金額, ステータス 等商品情報: 受付ID (受付情報へのリンク), 商品種別, 備考, 写真 (添付ファイル) 等証書情報: 商品ID (商品情報へのリンク), 鑑定・鑑別, 証書サイズ, オプション 等APIキーとBase IDを取得: AirtableのアカウントページとAPIドキュメントから取得します。script.jsを更新: script.jsファイル内のAIRTABLE_API_KEYとAIRTABLE_BASE_IDを、取得したものに置き換えます。Git & GitHub での管理Gitリポジトリの初期化:git init
git add .
git commit -m "Initial commit"
GitHubリポジトリの作成: GitHubで新しい公開リポジトリを作成します。リモートリポジトリの追加とプッシュ:git remote add origin [GitHubリポジトリのURL]
git branch -M main
git push -u origin main
セキュリティに関する注意現在の構成では、APIキーがフロントエンドのJavaScriptに含まれており、公開リポジトリにプッシュすると誰でも閲覧できてしまいます。本番環境で運用する際は、必ずCloud Functionsなどを利用してAPIキーをサーバーサイドに移し、フロントエンドからは直接呼び出さない構成に変更してください。