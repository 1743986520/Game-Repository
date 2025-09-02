function renderGames(rawText, containerId) {
  const container = document.getElementById(containerId);
  const blocks = rawText.split("@").map(b => b.trim()).filter(b => b);

  blocks.forEach(block => {
    const lines = block.split("\n").map(l => l.trim()).filter(l => l);

    // 解析新格式
    const title = lines.find(l => l.startsWith("###"))?.replace(/###/g, "") || "未命名";
    const desc = lines.find(l => l.startsWith("##"))?.replace(/##/g, "") || "";
    const versions = lines.filter(l => l.startsWith("#v"));

    let html = `<div class="game-item"><h3>${title}</h3>`;
    if (desc) html += `<p>${desc}</p>`;
    versions.forEach(v => {
      // 去掉開頭和結尾的 "#"
      const clean = v.replace(/^#+|#+$/g, "");
      const match = clean.match(/(v[^（]+)（(.+)）/);
      if (match) {
        const ver = match[1];
        const link = match[2];
        html += `<p>版本：<a href="${link}" target="_blank">《${ver}》</a></p>`;
      }
    });
    html += `</div>`;

    container.innerHTML += html;
  });
}
