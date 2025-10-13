# 🔒 セキュリティガイド

## API キーの安全な管理

このプロジェクトでは OpenAI API キーを使用します。API キーは重要な機密情報であり、適切に管理する必要があります。

---

## ⚠️ 絶対にやってはいけないこと

### ❌ API キーをGitにコミットしない

```bash
# 間違った例 - これは絶対にしないでください！
git add config/config.yaml
git commit -m "設定ファイルを追加"
git push
```

**なぜダメなのか？**
- GitHub などのリポジトリは公開されている可能性がある
- コミット履歴は削除しても復元できる
- 第三者があなたのAPIキーを不正利用できる
- 高額な請求が発生する可能性がある

---

## ✅ 正しいAPI キーの管理方法

### 1. `.gitignore` で除外する

本プロジェクトでは、`.gitignore` に以下が含まれています：

```
config/config.yaml
```

これにより、`config/config.yaml` は自動的に Git の追跡対象から除外されます。

### 2. 設定ファイルの構成

```
config/
├── config.yaml          # 実際の設定（.gitignoreに含む、Gitに含めない）
└── config.yaml.example  # サンプル設定（Gitに含める）
```

- ✅ `config.yaml.example` → リポジトリに含める（プレースホルダーのみ）
- ❌ `config.yaml` → リポジトリに含めない（実際のAPIキー）

### 3. セットアップ時の手順

1. リポジトリをクローン
2. `config.yaml.example` を `config.yaml` にコピー
3. `config.yaml` に実際の API キーを設定

```bash
# Windows
copy config\config.yaml.example config\config.yaml

# Mac / Linux
cp config/config.yaml.example config/config.yaml
```

---

## 🔍 API キーが漏洩していないか確認

### コミット前の確認

```bash
# config.yaml がコミット対象に含まれていないことを確認
git status

# .gitignore が正しく機能しているか確認
git check-ignore config/config.yaml
# 出力: config/config.yaml （正常）

# Git履歴にconfig.yamlが含まれていないか確認
git log --all --full-history -- config/config.yaml
# 出力なし（正常）
```

### GitHub にプッシュ済みの場合

もし誤って `config/config.yaml` を GitHub にプッシュしてしまった場合：

1. **すぐに API キーを無効化**
   - https://platform.openai.com/api-keys にアクセス
   - 該当するキーの「Revoke」をクリック

2. **新しい API キーを生成**
   - 「Create new secret key」をクリック
   - 新しいキーをコピー
   - `config/config.yaml` に設定

3. **Git履歴から削除（推奨）**
   ```bash
   # 履歴から完全に削除
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch config/config.yaml" \
     --prune-empty --tag-name-filter cat -- --all
   
   # 強制プッシュ（注意: 他の人と共同作業している場合は調整が必要）
   git push origin --force --all
   ```

⚠️ **注意**: Git履歴を書き換えるのは破壊的な操作です。必要に応じてバックアップを取ってください。

---

## 🛡️ API キー漏洩の影響

### もし API キーが漏洩すると...

1. **不正利用される可能性**
   - 第三者があなたのAPIキーを使用できる
   - あなたのアカウントで API を呼び出される

2. **高額請求のリスク**
   - OpenAI API は従量課金制
   - 不正利用された場合、高額な請求が発生する可能性

3. **アカウント停止の可能性**
   - 利用規約違反とみなされる場合がある
   - OpenAI アカウントが停止される可能性

### 対策

- ✅ API キーは必ず `.gitignore` で除外
- ✅ 定期的に API の使用状況を確認（https://platform.openai.com/usage）
- ✅ 使用制限（Usage limits）を設定する
- ✅ 不要になった API キーはすぐに無効化

---

## 📋 セキュリティチェックリスト

プッシュ前に以下を確認してください：

```
□ config/config.yaml が .gitignore に含まれている
□ git status で config/config.yaml が表示されない
□ git check-ignore config/config.yaml が正常に動作する
□ config.yaml.example にはプレースホルダーのみ含まれている
□ README に明確なセットアップ手順が記載されている
```

---

## 🔗 参考リンク

- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- [OpenAI Best Practices for API Key Safety](https://platform.openai.com/docs/guides/safety-best-practices)

---

## 💡 ベストプラクティス

1. **環境変数の使用（オプション）**
   ```bash
   # .env ファイルを作成（.gitignoreに追加）
   OPENAI_API_KEY=sk-proj-xxxxx
   ```

2. **定期的なキーのローテーション**
   - 3〜6ヶ月ごとに API キーを更新
   - 古いキーは無効化

3. **最小権限の原則**
   - プロジェクトごとに異なる API キーを使用
   - 必要最小限の権限のみ付与

4. **監視とアラート**
   - OpenAI のダッシュボードで使用量を定期的に確認
   - 異常な使用があればすぐに対処

---

**重要**: セキュリティは常に最優先事項です。不明な点があれば、必ず確認してから作業を進めてください。

