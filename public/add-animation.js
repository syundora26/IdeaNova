/*!
 * add-animation.js — IdeaNova 後付けアニメーション(add-animation.css と対)
 * 設置: <body> 先頭(<div id="root"> の直前)に defer なしの <script src>。
 * 方針: React 管理下の DOM には data 属性の付与しかしない。イントロは #root の外に置く。
 *       navigator.webdriver / ?nomotion では何もしない。例外は全て握り、本体を妨げない。
 */
(function () {
  'use strict';

  var win = window;
  var doc = document;
  var html = doc.documentElement;

  var INTRO_KEY = 'ideanova:intro';
  var IMPACT_EVENT = 'ideanova:intro-impact';
  var IMPACT_MS = 550; // しずくの着水(CSS の落下時間と一致)
  var END_MS = 3800; // 通常終了のタイムアウト(CSS 側フェイルセーフと同時刻)
  var HARD_MS = 4600; // CSS 未ロードでも必ず消す
  var SKIP_MS = 200; // スキップ時のフェード(CSS の .inv-intro--skip と一致)
  var SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  var PASSIVE = { passive: true };

  /* ---------- 共通の判定 ---------- */

  // 既存サイトと同じ全停止条件(自動テスト用)
  function isDisabled() {
    if (win.navigator && win.navigator.webdriver) return true;
    return /[?&]nomotion(?:[=&]|$)/.test(win.location.search || '');
  }

  function prefersReducedMotion() {
    try {
      return !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  /* ---------- A. しずく→波紋イントロ ---------- */

  function isTopPage() {
    var loc = win.location;
    var path = loc.pathname || '/';
    if (!/\/(?:index\.html)?$/.test(path)) return false;
    if (/^#\/.+/.test(loc.hash || '')) return false;
    if ((loc.hostname + path).indexOf('cosmetics') !== -1) return false;
    if (loc.port === '5179') return false;
    return true;
  }

  // トップページを読み込むたびに毎回再生する(再読み込みでも出る)。
  // サイト内のページ移動(ハッシュ遷移)でトップに戻った時は、ページの読み込みではないので出ない。
  // 以前の「タブごとに 1 回」用の記録が残っていれば掃除しておく
  function claimIntro() {
    try {
      win.sessionStorage.removeItem(INTRO_KEY);
    } catch (e) {}
    return true;
  }

  // スマホ・タブレット(タッチ操作)と、極端に非力な PC はフェード版にする。
  // 円形に開く版は毎フレームの再描画がメインスレッドで走るため、React 初期化の重い処理と重なると
  // 「穴だけ止まって最後に一気に開く」になりやすい。フェード(opacity)は合成スレッドで動くので滑らか
  function preferFade() {
    try {
      var nav = win.navigator || {};
      if (win.matchMedia && win.matchMedia('(pointer: coarse)').matches) return true;
      return (nav.hardwareConcurrency || 8) <= 2 || (nav.deviceMemory || 8) <= 2;
    } catch (e) {
      return true;
    }
  }

  // 円形に開く版が使えるか。使えるなら --inv-r を補間可能な <length> として登録する
  function canMaskReveal() {
    try {
      var css = win.CSS;
      if (!css || typeof css.registerProperty !== 'function') return false;
      try {
        css.registerProperty({ name: '--inv-r', syntax: '<length>', inherits: false, initialValue: '0px' });
      } catch (e) {
        // 二重登録は登録済みなので続行。それ以外はフェード版へ
        if (!e || e.name !== 'InvalidModificationError') return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function make(tag, className) {
    var node = doc.createElement(tag);
    node.className = className;
    return node;
  }

  function playIntro() {
    var body = doc.body;
    if (!body || !isTopPage() || !claimIntro()) return;

    var el = make('div', 'inv-intro ' + (!preferFade() && canMaskReveal() ? 'inv-intro--mask' : 'inv-intro--fade'));
    el.setAttribute('aria-hidden', 'true');
    el.appendChild(make('div', 'inv-intro__veil'));
    var drop = el.appendChild(make('span', 'inv-intro__drop'));
    el.appendChild(make('span', 'inv-intro__ring'));
    el.appendChild(make('span', 'inv-intro__ring inv-intro__ring--2'));
    var lastRing = el.appendChild(make('span', 'inv-intro__ring inv-intro__ring--3'));

    // 最終フェイルセーフ。以降の処理が失敗しても必ず消えるよう、挿入より先に仕掛ける
    var hardTimer = win.setTimeout(function () {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch (e) {}
    }, HARD_MS);

    // 同期挿入: 初回ペイントから覆う(覆いの見た目は CSS 側のみ。inline style は付けない)
    body.insertBefore(el, body.firstChild);

    var done = false;
    var impacted = false;
    var timers = [hardTimer];
    var plannedImpact = win.performance.now() + IMPACT_MS;

    // 既存 GSAP と同期したい人向けの公開値(公開するのはこれだけ)
    win.__ideanovaIntroImpactAt = plannedImpact;

    // 着水イベントは必ず 1 回だけ発火(スキップ・異常終了時も待ち手を取り残さない)
    function fireImpact() {
      if (impacted) return;
      impacted = true;
      try {
        el.classList.add('inv-intro--open'); // ここから下のページを操作可能にする(CSS 側で pointer-events: none)
      } catch (e) {}
      try {
        // 早期発火(スキップ)時に公開値が未来を指したままにならないよう補正
        win.__ideanovaIntroImpactAt = Math.min(plannedImpact, win.performance.now());
        win.dispatchEvent(new Event(IMPACT_EVENT));
      } catch (e) {}
    }

    function unbindSkip() {
      for (var i = 0; i < SKIP_EVENTS.length; i++) {
        win.removeEventListener(SKIP_EVENTS[i], onSkip, PASSIVE);
      }
    }

    function finish() {
      if (done) return;
      done = true;
      unbindSkip();
      for (var i = 0; i < timers.length; i++) win.clearTimeout(timers[i]);
      drop.removeEventListener('animationend', fireImpact);
      lastRing.removeEventListener('animationend', finish);
      fireImpact();
      if (el.parentNode) el.parentNode.removeChild(el);
    }

    function onSkip(ev) {
      unbindSkip();
      if (done) return;
      // キー操作(Tab など)は即座に消す。フォーカス先が半透明の覆いの下に入る時間を作らない
      if (ev && ev.type === 'keydown') {
        finish();
        return;
      }
      fireImpact();
      el.classList.add('inv-intro--skip');
      timers.push(win.setTimeout(finish, SKIP_MS + 40));
    }

    // 着水 = しずくの animationend(実描画に同期)。CSS 未ロード時はタイマーで代替
    drop.addEventListener('animationend', fireImpact);
    timers.push(win.setTimeout(fireImpact, IMPACT_MS + 250));

    // 終了 = 最後の波紋の animationend、または 2.4s
    lastRing.addEventListener('animationend', finish);
    timers.push(win.setTimeout(finish, END_MS));

    for (var i = 0; i < SKIP_EVENTS.length; i++) {
      win.addEventListener(SKIP_EVENTS[i], onSkip, PASSIVE);
    }
  }

  /* ---------- C / D. 常駐処理(data 属性の付与だけ) ---------- */

  function initEnhancements(canFade) {
    if (!('MutationObserver' in win)) return;

    var mo = null;
    var io = null;
    var watched = canFade ? new WeakSet() : null; // 二重登録防止
    var scheduled = false;

    // 失敗時はフッターが隠れたままにならないよう inv-anim を外して撤収
    function fail() {
      try {
        html.classList.remove('inv-anim');
      } catch (e) {}
      try {
        if (mo) mo.disconnect();
      } catch (e) {}
      try {
        if (io) io.disconnect();
      } catch (e) {}
    }

    function markSeen(footer) {
      io.unobserve(footer);
      footer.setAttribute('data-inv-seen', '');
    }

    var scanTimer = 0;

    // C. 一行送り用: label のテキストを親の a[data-inv-label] に写す(a::after が同じ文言を描く)。
    //    テキスト分割や要素追加はしない
    function labelPills() {
      var pills = doc.querySelectorAll('.corporate-layout .ref-pill');
      for (var i = 0; i < pills.length; i++) {
        var pill = pills[i];
        var label = pill.querySelector('.corporate-action-label');
        var text = label ? (label.textContent || '').trim() : '';
        if (!text) {
          if (pill.hasAttribute('data-inv-label')) pill.removeAttribute('data-inv-label');
        } else if (pill.getAttribute('data-inv-label') !== text) {
          pill.setAttribute('data-inv-label', text);
        }
      }
    }

    // D. フッター: 未監視のものを登録。IO は observe 直後に必ず初回コールバックを返すので、
    //    既に画面内・通過済みかどうかの判定もコールバック側に任せる(ここで強制レイアウトしない)
    function watchFooters() {
      var footers = doc.querySelectorAll('.corporate-layout .reference-footer');
      for (var i = 0; i < footers.length; i++) {
        var footer = footers[i];
        if (watched.has(footer)) continue;
        watched.add(footer);
        if (!footer.hasAttribute('data-inv-seen')) io.observe(footer);
      }
    }

    function scan() {
      if (!scheduled) return; // rAF とタイマーの二重実行を防ぐ
      scheduled = false;
      win.clearTimeout(scanTimer);
      try {
        labelPills();
        if (io) watchFooters();
      } catch (e) {
        fail();
      }
    }

    // MutationObserver のコールバックは rAF で 1 フレーム 1 回に間引く。
    // 非表示タブでは rAF が止まるので、タイマーでも拾う(先に来た方だけが実行される)
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      try {
        win.requestAnimationFrame(scan);
        scanTimer = win.setTimeout(scan, 300);
      } catch (e) {
        scheduled = false;
        fail();
      }
    }

    function start() {
      try {
        var target = doc.getElementById('root') || doc.body; // #root が無ければ body で代替
        if (!target) {
          fail();
          return;
        }
        if (canFade) {
          io = new win.IntersectionObserver(
            function (entries) {
              try {
                for (var i = 0; i < entries.length; i++) {
                  var entry = entries[i];
                  // 画面内、または既に上へ通過済み(アンカー移動など)なら表示
                  if (entry.isIntersecting || entry.boundingClientRect.top < 0) markSeen(entry.target);
                }
              } catch (e) {
                fail();
              }
            },
            { threshold: 0, rootMargin: '0px' }
          );
        }
        mo = new win.MutationObserver(schedule);
        // characterData: テキストだけ差し替わった時も data-inv-label を追従させる
        mo.observe(target, { childList: true, subtree: true, characterData: true });
        scheduled = true; // 初回は予約なしで直接実行する
        scan();
      } catch (e) {
        fail();
      }
    }

    // この時点では #root は未生成(スクリプトが #root より前にあるため)
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  /* ---------- E. 水滴(企業サイトの全ページ・静止した装飾) ---------- */

  // 1行 = 水滴1つ。
  // [グループ, 大きさpx, 横位置vw(正=左端から / 負=右端から), 縦のずれpx, 縦位置(本文の高さに対する割合), 傾きdeg, 1=スマホでは省く]
  // 各グループの先頭が「主役の大きい水滴」。主役が出せない場所(文字と重なる等)ではグループごと出さない
  var DEW = [
    [1, 22, -1.2, 210, 0, -8], [1, 7, -2.7, 256, 0, 12], [1, 5, -0.7, 274, 0, 0, 1],
    [2, 16, 1.7, 0, 0.13, 6], [2, 6, 3.3, 34, 0.13, -10],
    [3, 18, -1.0, 0, 0.24, 4], [3, 6, -2.5, 30, 0.24, 0],
    [4, 24, 2.0, 0, 0.4, -6], [4, 8, 0.9, 44, 0.4, 10], [4, 5, 3.9, 20, 0.4, 0, 1],
    [5, 14, -1.2, 0, 0.57, 8], [5, 6, -2.6, 26, 0.57, -6],
    [6, 20, 1.5, 0, 0.73, 5], [6, 7, 3.4, 36, 0.73, -12],
    [7, 16, -1.1, 0, 0.88, -5], [7, 5, -2.8, 14, 0.88, 0, 1], [7, 8, -0.5, 40, 0.88, 9]
  ];
  // グループごとの「本文がこの高さ(px)以上のページでだけ出す」。短いページほど数を減らす
  var DEW_MIN_H = { 1: 0, 4: 0, 7: 1400, 2: 2000, 5: 2000, 3: 3200, 6: 3200 };
  var DEW_MOBILE_K = 0.62; // スマホ幅での縮小率(CSS の @media (max-width: 767px) と一致)
  // 文字と重なる時に試す上下のずらし量(px)。先頭から順に試し、最初に空いていた位置を使う
  var DEW_SHIFTS = [0, 70, -70, 140, -140, 210, -210, 280, -280];

  function isCosmeticsSite() {
    var loc = win.location;
    return (loc.hostname + (loc.pathname || '')).indexOf('cosmetics') !== -1 || loc.port === '5179';
  }

  // 左右の余白付近にある文字・操作部品の矩形(ページ座標)。水滴が重ならないようにするための材料
  function edgeRects(scope, vw) {
    var out = [];
    var sx = win.pageXOffset;
    var sy = win.pageYOffset;
    var band = vw * 0.06 + 40; // 水滴は両端の約6vw以内にしか置かないので、その帯だけ調べる
    function push(r) {
      if (r.width < 1 || r.height < 1) return;
      if (r.left > band && r.right < vw - band) return;
      out.push([r.left + sx, r.top + sy, r.right + sx, r.bottom + sy]);
    }
    var walker = doc.createTreeWalker(scope, 4 /* NodeFilter.SHOW_TEXT */, null);
    var range = doc.createRange();
    var node;
    while ((node = walker.nextNode())) {
      if (!/\S/.test(node.nodeValue)) continue;
      range.selectNodeContents(node);
      var rs = range.getClientRects();
      for (var i = 0; i < rs.length; i++) push(rs[i]);
    }
    var ctrls = scope.querySelectorAll('button, input, textarea, select, a.ref-pill, a.ref-footer-contact, a.corporate-header-shop');
    for (var j = 0; j < ctrls.length; j++) push(ctrls[j].getBoundingClientRect());
    return out;
  }

  function initDew() {
    var body = doc.body;
    if (!body || !('ResizeObserver' in win) || isCosmeticsSite()) return;

    var box = make('div', 'inv-dew');
    box.setAttribute('aria-hidden', 'true');
    var drops = [];
    for (var i = 0; i < DEW.length; i++) {
      var d = DEW[i];
      var el = make('i', '');
      // 見た目は CSS 側。ここで渡すのは大きさ・横位置・傾きだけ(CSS 未ロード時は何も表示されない)
      el.style.cssText =
        '--s:' + d[1] + 'px;' + (d[2] >= 0 ? '--l:' + d[2] + 'vw;' : '--r:' + -d[2] + 'vw;') + '--rot:' + d[5] + 'deg';
      el.hidden = true;
      box.appendChild(el);
      drops.push(el);
    }
    body.appendChild(box); // #root の外(React 管理外)

    var timer = 0;
    var settled = false;

    function layout() {
      timer = 0;
      try {
        var scope = doc.querySelector('.corporate-layout'); // ショップ・管理画面には無い = 出さない
        var main = scope && scope.querySelector('main');
        if (!main) {
          box.removeAttribute('data-on');
          return;
        }
        var vw = html.clientWidth;
        var k = vw <= 767 ? DEW_MOBILE_K : 1;
        var H = main.getBoundingClientRect().bottom + win.pageYOffset; // 本文の下端。フッターには置かない
        var rects = edgeRects(scope, vw);

        // PC では既存のフェードインが文字を横に最大30px動かす(飾り文字・お知らせ行)ので、その分も空ける
        var shiftX = k < 1 ? 0 : 30;

        // その位置が空いているか。文字との余白: 横8px・縦26px
        // (既存のフェードアップで文字が最大24px動くため縦は広め)。ヘッダー付近と本文の外も不可
        var isFree = function (d, top) {
          var s = d[1] * k;
          var left = d[2] >= 0 ? (vw * d[2]) / 100 : vw - (vw * -d[2]) / 100 - s;
          if (top < 96 || top + s * 1.1 > H) return false;
          for (var m = 0; m < rects.length; m++) {
            var r = rects[m];
            // 大きな筆記体の飾り文字は字形が枠の外まではみ出すので、文字の高さに応じて横の余白を広げる
            var mx = Math.max(8, Math.min(60, (r[3] - r[1]) * 0.2)) + shiftX;
            if (left - mx < r[2] && left + s + mx > r[0] && top - 26 < r[3] && top + s * 1.08 + 26 > r[1]) return false;
          }
          return true;
        };

        for (var n = 0; n < DEW.length; ) {
          // 同じグループの範囲 [n, end)
          var g = DEW[n][0];
          var end = n;
          while (end < DEW.length && DEW[end][0] === g) end++;

          // 主役(先頭)の水滴が文字に当たるなら、グループごと上下にずらして空いている余白を探す
          var lead = DEW[n];
          var shift = null;
          if (H >= DEW_MIN_H[g]) {
            for (var t = 0; t < DEW_SHIFTS.length; t++) {
              if (isFree(lead, lead[3] + H * lead[4] + DEW_SHIFTS[t])) {
                shift = DEW_SHIFTS[t];
                break;
              }
            }
          }

          for (var q = n; q < end; q++) {
            var d = DEW[q];
            var top = d[3] + H * d[4] + (shift || 0);
            var show = shift !== null && !(k < 1 && d[6]) && isFree(d, top);
            drops[q].style.top = Math.round(top) + 'px';
            drops[q].hidden = !show;
          }
          n = end;
        }
        box.setAttribute('data-on', '');
      } catch (e) {
        box.removeAttribute('data-on');
      }
      // 既存のフェードインで文字が動き終わった頃に、もう一度だけ置き直す
      if (!settled) {
        settled = true;
        win.setTimeout(function () {
          schedule();
          win.setTimeout(function () {
            settled = false;
          }, 400);
        }, 3200);
      }
    }

    // 画像・フォントの読み込みやページ移動で高さが変わるたびに、少し待ってから1回だけ置き直す
    function schedule() {
      if (!timer) timer = win.setTimeout(layout, 160);
    }

    function start() {
      try {
        var root = doc.getElementById('root');
        if (!root) return;
        new win.ResizeObserver(schedule).observe(root);
        win.addEventListener('resize', schedule, PASSIVE);
        win.addEventListener('hashchange', schedule, PASSIVE); // 高さが同じページ同士の移動でも置き直す
        win.addEventListener('popstate', schedule, PASSIVE);
        win.addEventListener('load', schedule, { once: true });
        if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(schedule, function () {});
        schedule();
      } catch (e) {}
    }

    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  /* ---------- 起動 ---------- */

  try {
    if (isDisabled()) return;

    // 水滴は動きのない装飾なので reduced-motion でも出す(フェードインだけ CSS 側で止まる)
    try {
      initDew();
    } catch (e) {}

    // reduced-motion では以降の JS の仕事は無い(現在地の下線は CSS だけで出る)
    if (prefersReducedMotion()) return;

    var canFade = 'IntersectionObserver' in win && 'MutationObserver' in win && 'WeakSet' in win;
    if (canFade) html.classList.add('inv-anim'); // 同期的に付ける(フッター初期非表示の CSS を有効化)

    try {
      playIntro();
    } catch (e) {}

    initEnhancements(canFade);
  } catch (e) {
    try {
      html.classList.remove('inv-anim');
    } catch (e2) {}
  }
})();
