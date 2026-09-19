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

  // タブごとに 1 回。例外時は「再生しない」側に倒す。再生を決めた時点で書く
  function claimIntro() {
    try {
      var ss = win.sessionStorage;
      if (ss.getItem(INTRO_KEY)) return false;
      ss.setItem(INTRO_KEY, '1');
      return true;
    } catch (e) {
      return false;
    }
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

  /* ---------- 起動 ---------- */

  try {
    if (isDisabled()) return;
    // reduced-motion では JS の仕事は無い(現在地の下線は CSS だけで出る)
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
