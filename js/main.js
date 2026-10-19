/* GRACE AUTO WORKS デモサイト共通スクリプト
   ・スマートフォン用メニューの開閉
   ・画像の読み込みに失敗したときの代替表示
   ・フッターの年表示 */
(function () {
  "use strict";

  /* ---------- スマートフォン用メニュー ---------- */
  var body = document.body;
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("global-nav");

  function closeMenu() {
    body.classList.remove("menu-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "メニューを開く");
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });

    // メニュー内のリンクを押したら閉じる
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    // Escキーで閉じる
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    // PC幅に戻したら閉じる
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* ---------- 画像の代替表示 ---------- */
  function markFailed(img) {
    var box = img.parentElement;
    if (!box) return;
    box.classList.add("img-fallback");
    box.setAttribute("data-fallback", img.getAttribute("alt") || "IMAGE");
  }

  Array.prototype.forEach.call(document.querySelectorAll("img"), function (img) {
    if (img.complete && img.naturalWidth === 0) {
      markFailed(img);
    } else {
      img.addEventListener("error", function () { markFailed(img); });
    }
  });

  /* ---------- ページ遷移時の表示位置 ----------
     別ページへのリンクで移動したときは、移動先を必ずページの先頭から表示する。

     先頭に戻すのを読み込み直後の1回だけにすると、その後にブラウザやプレビュー画面が
     前のページのスクロール位置を復元したときに上書きされ、途中から表示されてしまう。
     そのため次のように処理する。
     1) 別ページへのリンクを押したときに「先頭から表示する」印を残す
        （sessionStorage。使えない環境では移動の種類で判断する）
     2) 移動先では、読み込み直後・DOM構築後・読み込み完了後・表示時に先頭へ戻し、
        読み込み完了から約1.5秒間は、後から位置を変えられても先頭へ戻す
        （利用者がスクロールやキー操作をした時点で止め、操作の邪魔はしない）
     ・ページ内リンク（#contact など）は対象外で、通常どおり移動する
     ・戻る／進む、再読み込みでは印が残らないため、ブラウザの位置復元はそのまま */
  (function () {
    var KEY = "ga-scroll-top";

    function storage(action, value) {
      try {
        if (action === "set") sessionStorage.setItem(KEY, value);
        else if (action === "get") return sessionStorage.getItem(KEY);
        else sessionStorage.removeItem(KEY);
      } catch (e) { /* 保存が使えない環境 */ }
      return null;
    }

    // 1) 別ページへのリンクを押したときに印を残す
    window.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;            // 外部サイト
      var samePage = url.pathname === location.pathname && url.search === location.search;
      if (samePage && url.hash) return;                        // ページ内リンク
      if (url.hash && url.hash !== "#top") return;             // 別ページの見出しへのリンク
      storage("set", String(Date.now()));
    }, true);

    // 2) 移動先で先頭から表示するかを判断する
    var mark = Number(storage("get"));
    var flagged = mark > 0 && Date.now() - mark < 10000;     // 押してから10秒以内の印のみ有効
    storage("remove");
    var entry = window.performance && performance.getEntriesByType
      ? performance.getEntriesByType("navigation")[0] : null;
    var type = entry ? entry.type : "navigate";
    var hasAnchor = location.hash && location.hash !== "#top";

    if (hasAnchor) return;                                     // 見出しへの移動を優先
    if (!flagged && (type === "back_forward" || type === "reload")) return;

    var root = document.documentElement;
    var active = true;
    var timer = null;

    function toTop() {
      if (!active) return;
      if (window.pageYOffset !== 0 || root.scrollTop !== 0) {
        var prev = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";                    // なめらかスクロールを一時停止
        window.scrollTo(0, 0);
        root.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        root.style.scrollBehavior = prev;
      }
    }
    function stop() {
      active = false;
      window.removeEventListener("scroll", toTop);
      ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
        window.removeEventListener(ev, stop, true);
      });
      if (timer) clearTimeout(timer);
    }

    toTop();
    window.addEventListener("scroll", toTop);
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
      window.addEventListener(ev, stop, true);
    });
    document.addEventListener("DOMContentLoaded", toTop);
    window.addEventListener("pageshow", toTop);
    function afterLoad() {
      toTop();
      requestAnimationFrame(toTop);
      timer = setTimeout(stop, 1500);
    }
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad);
  })();

  /* ---------- 年表示 ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
