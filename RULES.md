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
- **看得到的範圍**：常見視窗比例下，畫面左右各被裁掉約 30，側欄的毛玻璃蓋到 x≈233。會動的東西放在 233–432 和 1250–1570，放在側欄底下的動態幾乎看不到。
- 官方範例 Paper Garden 讓 x 432–1200 留空；在常見視窗寬度下，對話欄量起來大約到 78%，所以右界放寬到 1250。

- Canvas: `viewBox="0 0 1600 1000"`, `preserveAspectRatio="xMidYMid slice"`.
- **Clear band x 432–1250** (27%–78% of the width), full height: ground colour only, at most a ghost of texture. The conversation and the prompt box sit here.
- **Right strip x 1250–1600**: the subject. It may run off the right edge.
- **Left strip x 210–432**: supporting pieces.
- **Under the sidebar x 0–210**: the sidebar is frosted glass; only large, simple, low-contrast shapes.
- **What is actually seen**: at common window sizes about 30 is cropped off each side and the sidebar's glass reaches x ≈ 233. Put motion within 233–432 and 1250–1570; motion under the sidebar is all but invisible.
- Anthropic's Paper Garden example keeps x 432–1200 clear; measured at common window sizes the conversation column runs to about 78%, hence 1250.

## 2. 一張只用一種受限媒材 · One constrained medium per scene

四選一，畫面上所有東西（連光暈、漸層）都用這種媒材表現：

- **方塊／馬賽克**：格子上的磚（20 單位一格、80×50 格）。漸層＝換磚色。
- **剪紙**：有稜角的剪痕輪廓，每片畫四層：遠陰影、近陰影、左上亮邊、紙本身。漸層＝疊好幾層紙。
- **點陣**：網格上的點，亮度靠點的大小或數量。
- **色塊（平塗）**：十幾種顏色的平塗色塊，像動畫原本的上色。漸層＝換一塊顏色。動態用向量疊在色塊上（灰塵、光點），不改動色塊本身。

做法有兩種：

- **重新畫**：照參考圖的元素和氛圍，用所選的媒材自己畫。四種媒材都可以。
- **描圖**：用 `tools/trace.py` 把一張圖描成色塊，最像原圖。只用在色塊這種媒材；人物這類需要像原圖的畫面，方塊、點陣太粗、剪紙手畫不像，描圖是唯一畫得像的方法。描圖在動畫、插畫、海報這類本來就是平塗的圖效果最好；照片會變成色調分離的海報感。

不做沒有受限媒材的自由手繪向量插畫，也不拿 AI 另外產的圖代替參考圖來描（會偏離參考圖）。

Pick one, and draw everything in it, glow and gradients included:

- **Tiles / mosaic**: tiles on a grid (20-unit cells, 80 × 50). A gradient is a change of tile colour.
- **Cut paper**: faceted, scissor-cut outlines, each piece drawn four times: far shadow, near shadow, a light lip up and left, the paper. A gradient is paper stacked in layers.
- **Dots**: dots on a grid; brightness is dot size or count.
- **Flat colour**: a dozen or so flat colour regions, like an animation cel. A gradient is a change of region. Motion is vector drawn over the regions (dust, specks of light); the regions themselves stay still.

Two ways to make a scene:

- **Redraw**: draw the reference's elements and mood yourself in the chosen medium. Any of the four media.
- **Trace**: trace a picture into colour regions with `tools/trace.py`, the closest you can get to the picture. Flat colour only; for a figure that has to look like the picture, tiles and dots are too coarse and hand-drawn paper never looks right, so tracing is the way. It works best on art that is flat to begin with (animation, illustration, posters); a photo comes out posterised.

No free-hand vector illustration outside a medium, and never an AI-generated stand-in traced in place of the reference: it drifts from the reference.

## 3. 忠於參考圖 · Stay true to the reference

- 動手前先列出參考圖裡**認得出來的元素**和主要配色，每一項都要在成品裡找得到。
- 只為了遵守第 1 條而調整構圖，並說明搬了什麼。
- **公開或私人看來源，不看風格。** 重新畫：取元素與氛圍，不照描原作的角色、標誌，成品可以公開。描圖：先問圖從哪裡來。自己拍的照片、自己畫的圖、可以自由使用的素材，描出來可以公開；別人的作品（例如動畫截圖），描出來只能放 `private/`，不放進公開的 repository。
- 參考圖本身的框不算元素：電影黑邊、字幕、浮水印都不畫。黑邊畫進背景，圖會只剩中間一條。

- Before drawing, list the reference's **recognisable elements** and main colours; every one of them must be findable in the scene.
- Change the composition only to satisfy rule 1, and say what moved.
- **Public or private depends on the source, not the style.** Redrawing: take the elements and the mood, never trace characters or logos; the result can be shared. Tracing: ask where the picture comes from first. Your own photo or drawing, or material free to use, may be traced and shared; someone else's artwork (a frame from an anime) may be traced for your own use only, kept in `private/` and out of any public repository.
- The reference's own frame is not an element: leave out letterbox bars, subtitles and watermarks. Bars drawn into a backdrop cut the picture down to a band across the middle.

## 4. 動態 · Motion

- 慢、少、用媒材本身的方式動：紙片輕擺、磚一格一格移動、點的亮度起伏、色塊上飄的灰塵。少比多好：大片掃過的光或影子容易顯得突兀。
- 動態只在左右兩區。
- **要看得見**：淺色場景別用白色做動態（白上加白等於沒動），改用暖金、灰或媒材的深色；深色場景反之。每種動態都要在瀏覽器裡實際播放確認一次。
- 支援 `prefers-reduced-motion`，一律停住。

- Slow, few, and in the medium's own way: paper sways, tiles step a cell at a time, dots brighten and dim, dust drifts over flat colour. Less is more: a large sweep of light or shadow easily jars.
- Motion lives in the side strips only.
- **Make it visible**: on a light scene, never animate in white (white on white shows nothing); use warm gold, grey or the medium's dark. The reverse on a dark scene. Play every motion in a real browser at least once.
- Honour `prefers-reduced-motion`: everything stops.

## 5. 技術雷 · Pitfalls

- 不用 `<filter>`：桌面版會吃掉它，被它包住的整組圖直接消失（配色有換、圖不見）。也不用 mask；避免對動畫群組設透明度。
- `$.theme.set` 的 backdrop 同時寫 `scene` 和 `id`（新版讀 scene、舊版讀 id）。
- SVG 字串小於 131,072 字元。
- 不嵌入點陣圖（`<image>` 放 JPEG／PNG）：圖會畫出來，但整張背景的動畫會全部停住。要用照片就做成靜態背景（`$.theme.set` 的 `{ image }`）。
- 在 app 裡實際看過才算完成。

- No `<filter>`: the desktop app drops it, and everything inside it vanishes (the colours change, the picture never shows). No masks either, and no opacity on animated groups.
- Give the backdrop both `scene` and `id` in `$.theme.set` (newer apps read `scene`, older ones `id`).
- Keep the SVG under 131,072 characters.
- No embedded raster (`<image>` with a JPEG or PNG): the picture draws, but every animation in the scene stops. For a photo, use a still backdrop (`{ image }` in `$.theme.set`).
- It is done only once seen in the app.
