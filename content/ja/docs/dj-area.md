---
title: DJ＆ライブパフォーマンスエリア
date: 2026-04-19
dateLabel: 2026.04.19
description: DJおよびライブイベントのために設計された専用エリアです。 映像入力に応じて変化するレイヤー状の投影システムと、映像・照明・音響を制御するためのアドミンルームが用意されています。
slug: dj-area
lang: ja
translationKey: dj-area
summary: DJおよびライブイベントのために設計された専用エリアです。 映像入力に応じて変化するレイヤー状の投影システムと、映像・照明・音響を制御するためのアドミンルームが用意されています。
image: /inc.github.io/assets/images/content/docs/dj-area/VRChat_2026-04-19_15-30-45.878_2560x1440.png/inc.github.io/assets/images/grouplink.png
category: documentation
---

# DJエリア

ワールドの一番奥（庭とは逆方向）に位置するエリアです。


![](/inc.github.io/assets/images/content/docs/dj-area/VRChat_2026-04-19_15-30-45.878_2560x1440.png)

---

## 壁シェーダー

DJエリアの壁に設置されたモニターで、再生中の映像が投影されます。

通常の長方形モニターとは異なり、曲線を帯びた帯状のレイヤーが何層も重なった独特の投影形式です。
テッセレーションが適用されており、映像のRGB値からRed要素を取得し、明度が高い部分のメッシュが飛び出す演出が行われます。

**向いているコンテンツ**
- 映像のビジュアライザー
- ライブ・クラブ系の演出映像

**向いていないコンテンツ**
- 文字や細かい描画を含む映像
- 講演・プレゼンテーション用のスライドなど

ビデオを再生していない場合、壁シェーダーは自動的にOFFになります。

---

## アドミンルーム


![](/inc.github.io/assets/images/content/docs/dj-area/dj-admin_jp.png)

### 1.AudioReverbFilterSettings

> 【VRChat】ワールド音響調整アセット / AudioReverbFilterSettings【UdonProps】
> https://booth.pm/ja/items/4941668

グローバル同期でDJの音声のリバーブ設定を変更できます。

ライブ・配信の運営に必要なギミックが集約されたルームです。
AdminGuestPanelでAdminに追加されたユーザーのみ操作できます。

### 2.UMHL VideoPlayerLighting

> UMHLさん制作のVRChatワールド用ビデオライトギミック
> https://umhl.booth.pm/items/6013645

ビデオ・ライブ再生中にのみライトがONになるギミックです。
ただし、映像非再生時にも常時起動しているため、グローバル（全プレイヤー同期）で強制ONにするスイッチが用意されています。

**デフォルト：OFF**
ライブを行う際は、このスイッチを手動でONにしてください。

### 3.AudioLink Controller

AudioLinkのコントローラーです。

### 4.VizVid ビデオプレイヤー プレイリスト

プレイリストです、現在は壁シェーダーテスト用の動画が入っています。

### 5.VizVid ビデオプレイヤー

動画・ライブ配信のURLを入力するプレイヤーです。

### 6.壁シェーダー操作パネル

現在操作不可です。
初期状態は軽量かつ適切なパラメーターに調整済みのため、そのままで問題ありません。

### 7.AdminGuestPanel

現在インスタンスに参加しているオンラインユーザーの確認、およびAdminの追加・削除が行えるパネルです。
Adminに追加されたユーザーはアドミンルームに入り、VizVid・リバーブ・壁シェーダーなどライブ専用ギミックの操作が可能になります。