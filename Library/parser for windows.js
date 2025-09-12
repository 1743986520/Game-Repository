// parser.js
// 支援格式：
// ###遊戲名稱###
// ##遊戲描述##
// #v1.0.8下載（https://...）#
// @  (遊戲間分隔)
// 使用方式：在 windows.html/android.html 引入 parser.js，然後 fetch("windows.txt").then(...).then(text => renderGames(text, "game-list"));

(function (global) {
  const DEBUG = false;

  function stripHashes(s) {
    return s.replace(/^#+|#+$/g, '').trim();
  }

  // 嘗試從一行中找出版本名稱與 URL（支援全形 / 半形括號）
  function parseVersionLine(line) {
    const clean = stripHashes(line);
    // 優先匹配形式：v...（https://...） 或 v...(https://...)
    let m = clean.match(/(v[^\s（(]+[^\（(]*)\s*[（(]\s*(https?:\/\/[^\s)）]+)\s*[)）]/i);
    if (!m) {
      // 次選：任何 v... 與行內的 URL
      m = clean.match(/(v[^\s#(（]+).*?(https?:\/\/[^\s)）]+)/i);
    }
    if (m) {
      return { ver: m[1].trim(), url: m[2] ? m[2].trim() : null };
    }
    // 若整行以 v 開頭但沒找到 URL，回傳 ver 但 url 為 null
    const verOnly = clean.match(/^(v[^\s#(（]+)/i);
    if (verOnly) return { ver: verOnly[1].trim(), url: null };

    return null;
  }

  function createTextNode(tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
  }

  function buildGameCard(parsed) {
    const card = document.createElement('div');
    card.className = 'game-item';

    const h3 = document.createElement('h3');
    h3.textContent = parsed.title || '未命名';
    card.appendChild(h3);

    if (parsed.desc) {
      card.appendChild(createTextNode('p', parsed.desc));
    }

    if (parsed.versions && parsed.versions.length) {
      parsed.versions.forEach(v => {
        const p = document.createElement('p');
        if (v.url) {
          p.textContent = '版本：';
          const a = document.createElement('a');
          a.href = v.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = `《${v.ver}》`;
          p.appendChild(a);
        } else {
          p.textContent = `版本：${v.ver}`;
        }
        card.appendChild(p);
      });
    } else if (parsed.extra && parsed.extra.length) {
      parsed.extra.forEach(e => card.appendChild(createTextNode('p', e)));
    }

    return card;
  }

  function renderGames(rawText, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      if (DEBUG) console.warn('renderGames: container not found', containerId);
      return;
    }
    container.innerHTML = '';

    if (!rawText || !rawText.trim()) return;

    // Normalize line endings and split blocks by @
    const blocks = rawText.replace(/\r/g, '').split('@').map(b => b.trim()).filter(Boolean);
    if (DEBUG) console.log('blocks count', blocks.length);

    blocks.forEach((block, idx) => {
      const rawLines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (rawLines.length === 0) return;

      // 解析 title (優先 ###...###)
      let title = '';
      for (const ln of rawLines) {
        if (/^#{3,}.*#{3,}$/.test(ln)) { title = stripHashes(ln); break; }
      }
      // fallback：找 ##...## 作為 title（若沒找到 triple）
      if (!title) {
        for (const ln of rawLines) {
          if (/^#{2}.*#{2}$/.test(ln)) { title = stripHashes(ln); break; }
        }
      }
      // 最後 fallback：第一個非版本行
      if (!title) {
        for (const ln of rawLines) {
          const s = stripHashes(ln);
          if (!/^v/i.test(s)) { title = s; break; }
        }
      }

      // 描述：優先取 ##...##（但不要跟 title 相同）
      let desc = '';
      for (const ln of rawLines) {
        if (/^#{2}.*#{2}$/.test(ln)) {
          const candidate = stripHashes(ln);
          if (candidate !== title) { desc = candidate; break; }
        }
      }
      // fallback：第二行（若存在且不是版本）
      if (!desc) {
        for (const ln of rawLines) {
          const s = stripHashes(ln);
          if (s && s !== title && !/^v/i.test(s)) { desc = s; break; }
        }
      }

      // 找版本列（辨識 #v...# 或行內含 v... 與 URL）
      const versions = [];
      const extra = [];
      for (const ln of rawLines) {
        const parsedVer = parseVersionLine(ln);
        if (parsedVer) {
          versions.push(parsedVer);
        } else {
          // 若是以 # 開頭但不是版本，或一般文字，存到 extra（避免遺漏）
          const s = stripHashes(ln);
          if (s && s !== title && s !== desc) extra.push(s);
        }
      }

      const parsed = { title: title || '未命名', desc: desc || '', versions, extra };
      if (DEBUG) console.log('parsed block', idx, parsed);

      container.appendChild(buildGameCard(parsed));
    });
  }

  // 將函式暴露出去（windows.html/android.html 會呼叫 renderGames）
  global.renderGames = renderGames;
})(window);
