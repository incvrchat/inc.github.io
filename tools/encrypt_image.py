#!/usr/bin/env python3
"""
encrypt_image.py — Gallery System XOR 暗号化スクリプト

使い方:
    python encrypt_image.py <入力画像> <出力ディレクトリ>

例（g01_A.jpg を暗号化して assets/images/world/ に書き出す）:
    python encrypt_image.py g01_A.jpg assets/images/world/g01_A/

出力ファイル:
    <出力ディレクトリ>/encrypted.png   — XOR 暗号化済み無劣化 PNG
    <出力ディレクトリ>/meta.json       — {"width":W, "height":H, "seed":S, "version":1}

ハッシュ関数仕様（HLSL 側 XorDecrypt.shader と完全一致）:
    v = x*374761393 + y*668265263 + seed*2147483647   (uint32 演算)
    v = (v ^ (v >> 13)) * 1274126177
    v = v ^ (v >> 16)
    R = v[7:0]  G = v[15:8]  B = v[23:16]

seed の制約:
    Unity の Material.SetFloat は float32 で値を渡す。
    float32 の仮数部は 23bit のため、seed は [1, 16777215 (0xFFFFFF)] の範囲で生成する。
    この範囲内の整数は float32 で正確に表現できる。
"""

import sys
import os
import json
import random
import numpy as np
from PIL import Image

# seed の最大値 = 2^24 - 1 = 16777215
# float32 (23bit 仮数) で正確に表現できる最大整数
SEED_MAX = 0xFFFFFF  # 16,777,215


def hash_rgb(x: np.ndarray, y: np.ndarray, seed: int):
    """
    ピクセル座標 (x, y) に対して R/G/B 用の 8bit ノイズを返す。
    HLSL 側 hashPixel() と完全に一致する演算（uint32、オーバーフロー切り捨て）。

    x, y: numpy array (dtype=uint32)
    seed: int [1, SEED_MAX]
    戻り値: (r, g, b) — 各 numpy array (dtype=uint32, 値域 0-255)
    """
    x = x.astype(np.uint32)
    y = y.astype(np.uint32)
    s = np.uint32(seed)

    v = (x * np.uint32(374761393)
         + y * np.uint32(668265263)
         + s * np.uint32(2147483647))
    v = (v ^ (v >> np.uint32(13))) * np.uint32(1274126177)
    v = v ^ (v >> np.uint32(16))

    r = (v        ) & np.uint32(0xFF)
    g = (v >> np.uint32(8) ) & np.uint32(0xFF)
    b = (v >> np.uint32(16)) & np.uint32(0xFF)
    return r, g, b


def encrypt(input_path: str, output_dir: str) -> None:
    """入力画像を XOR 暗号化して output_dir に encrypted.png と meta.json を書き出す。"""

    img = Image.open(input_path).convert("RGB")
    w, h = img.size
    arr = np.array(img, dtype=np.uint8)  # shape (h, w, 3)

    seed = random.randint(1, SEED_MAX)

    # ベクトル化 XOR ノイズ生成
    xs, ys = np.meshgrid(
        np.arange(w, dtype=np.uint32),
        np.arange(h, dtype=np.uint32),
    )
    r, g, b = hash_rgb(xs, ys, seed)
    noise = np.stack([r, g, b], axis=-1).astype(np.uint8)

    encrypted = arr ^ noise

    os.makedirs(output_dir, exist_ok=True)

    # 無劣化 PNG で書き出し（compress_level=0 は圧縮なし、PNG 自体は可逆）
    out_png = os.path.join(output_dir, "encrypted.png")
    Image.fromarray(encrypted, "RGB").save(out_png, "PNG", compress_level=0)

    meta = {
        "width":   w,
        "height":  h,
        "seed":    seed,
        "version": 1,
    }
    meta_path = os.path.join(output_dir, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f)

    print(f"[encrypt] {input_path}")
    print(f"  → {out_png}")
    print(f"  → {meta_path}")
    print(f"  size={w}x{h}  seed={seed}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使い方: python encrypt_image.py <入力画像> <出力ディレクトリ>")
        sys.exit(1)
    encrypt(sys.argv[1], sys.argv[2])
