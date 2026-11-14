# 背景場景製作規則 · Backdrop design rules

這五條規則來自實際做過、被打回、再改好的經驗。新場景照著做，就不會擋到對話、不會畫得粗糙，也不會偏離參考圖。

These five rules came out of drafts that failed and the versions that fixed them. A new scene that follows them stays out of the conversation's way, reads as deliberate, and stays true to its reference.

---

## 1. 元素不碰對話欄 · Keep clear of the conversation

- 畫布：`viewBox="0 0 1600 1000"`、`preserveAspectRatio="xMidYMid slice"`。
- **禁區 x 432–1250**（寬度 27%–78%）：從上到下只放底色，頂多極淡的紋理。對話文字和輸入框都在這裡。
- **右區 x 1250–1600**：放主角，可以超出畫面右緣。
- **左區 x 210–432**：放配角。
- **側欄底下 x 0–210**：側欄是毛玻璃，只放大塊、簡單、低對比的形狀。
- 官方範例 Paper Garden 讓 x 432–1200 留空；在常見視窗寬度下，對話欄量起來大約到 78%，所以右界放寬到 1250。

- Canvas: `viewBox="0 0 1600 1000"`, `preserveAspectRatio="xMidYMid slice"`.
- **Clear band x 432–1250** (27%–78% of the width), full height: ground colour only, at most a ghost of texture. The conversation and the prompt box sit here.
- **Right strip x 1250–1600**: the subject. It may run off the right edge.
- **Left strip x 210–432**: supporting pieces.
- **Under the sidebar x 0–210**: the sidebar is frosted glass; only large, simple, low-contrast shapes.
- Anthropic's Paper Garden example keeps x 432–1200 clear; measured at common window sizes the conversation column runs to about 78%, hence 1250.

## 2. 一張只用一種受限媒材 · One constrained medium per scene

三選一，畫面上所有東西（連光暈、漸層）都用這種媒材表現：

- **方塊／馬賽克**：格子上的磚（20 單位一格、80×50 格）。漸層＝換磚色。
- **剪紙**：有稜角的剪痕輪廓，每片畫四層：遠陰影、近陰影、左上亮邊、紙本身。漸層＝疊好幾層紙。
- **點陣**：網格上的點，亮度靠點的大小或數量。

不做自由手繪的向量插畫，也不把 AI 產的圖直接點陣化當成品（會偏離參考圖）。

Pick one, and draw everything in it, glow and gradients included:

- **Tiles / mosaic**: tiles on a grid (20-unit cells, 80 × 50). A gradient is a change of tile colour.
- **Cut paper**: faceted, scissor-cut outlines, each piece drawn four times: far shadow, near shadow, a light lip up and left, the paper. A gradient is paper stacked in layers.
- **Dots**: dots on a grid; brightness is dot size or count.

No free-hand vector illustration, and no AI-generated picture pixelated into a scene: both drift from the reference.

## 3. 忠於參考圖 · Stay true to the reference

- 動手前先列出參考圖裡**認得出來的元素**和主要配色，每一項都要在成品裡找得到。
- 只為了遵守第 1 條而調整構圖，並說明搬了什麼。
- 不照描原作的角色、標誌；取元素與氛圍。

- Before drawing, list the reference's **recognisable elements** and main colours; every one of them must be findable in the scene.
- Change the composition only to satisfy rule 1, and say what moved.
- Never trace characters, logos or artwork: take the elements and the mood.

## 4. 動態 · Motion

- 慢、少、用媒材本身的方式動：紙片輕擺、磚一格一格移動、點的亮度起伏。
- 動態只在左右兩區。
- **要看得見**：淺色場景別用白色做動態（白上加白等於沒動），改用暖金、灰或媒材的深色；深色場景反之。每種動態都要在瀏覽器裡實際播放確認一次。
- 支援 `prefers-reduced-motion`，一律停住。

- Slow, few, and in the medium's own way: paper sways, tiles step a cell at a time, dots brighten and dim.
- Motion lives in the side strips only.
- **Make it visible**: on a light scene, never animate in white (white on white shows nothing); use warm gold, grey or the medium's dark. The reverse on a dark scene. Play every motion in a real browser at least once.
- Honour `prefers-reduced-motion`: everything stops.

## 5. 技術雷 · Pitfalls

- 不用 `<filter>`：桌面版會吃掉它，被它包住的整組圖直接消失（配色有換、圖不見）。也不用 mask；避免對動畫群組設透明度。
- `$.theme.set` 的 backdrop 同時寫 `scene` 和 `id`（新版讀 scene、舊版讀 id）。
- SVG 字串小於 131,072 字元。
- 在 app 裡實際看過才算完成。

- No `<filter>`: the desktop app drops it, and everything inside it vanishes (the colours change, the picture never shows). No masks either, and no opacity on animated groups.
- Give the backdrop both `scene` and `id` in `$.theme.set` (newer apps read `scene`, older ones `id`).
- Keep the SVG under 131,072 characters.
- It is done only once seen in the app.
