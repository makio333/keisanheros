# レイド・画面改善の引き継ぎ（2026-11-26）

採用済み: 赤いピクセル幽霊王、月末ターボ攻撃2倍、Cサイズ（画面高75%、UI背面）、浮遊/攻撃/被弾反応。10秒円形ゲージC、時間切れは最大HP5%の弱攻撃・問題/入力維持、正解リセット。古代装備経験値通知Bはステータス直上、既存UI位置維持。横画面の施設ボタンは街中配置、スマホ縦はドック/その他を維持。装備比較Aと先行のスマホ・問題品質修正も含む。

本番: ailandgames / legend-heroes2.web.app。ユーザーの明示OK後、Hostingのみ公開。テストはailandgames-test / legend-heroes-test.web.app。Cloud Run・Firestoreルールは今回未更新。実セーブをテスト・コミットしていない。

月別ランキングの共有バックエンド変更は未公開。game_cloud_apis.js/raid_monthly_rules.js等に候補があるが、server/internal-raid-api.mjs の履歴月許可とボス固定参照なども合わせて確認する必要がある。handoff/raid-monthly-backend-pending-20261126.patch は当時の作業差分（latest-gameパスを含むため、そのまま適用しない）。12月以降のボス継続・歴代ランキングの本番完了をこのHosting公開から推定しない。別途、正確なAPI対象の承認・readiness確認が必要。

検証: PC1440×900/スマホ390×844で実回答、連続時間切れ、同一問題/入力保持、正解リセット、浮遊transform、reduced-motion、期間外復帰、通知位置とUI矩形維持。横844×390とPC/縦スマホで武器屋を開く。古代経験値キュー/連続加算/終了破棄/最大Lvのブラウザテスト、公開ビルド成功。比較用画像と実スクショはローカルartifactsに保管し、Gitにはコード/採用素材/合成テストだけを保存。
