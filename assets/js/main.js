document.addEventListener('DOMContentLoaded', () => {
    // ---- 公開予約 ----
    // 日時（ISO 8601。日本時間は末尾 +09:00、例 '2026-10-10T12:00:00+09:00'）をここで一括管理する。
    // 空文字のあいだは該当要素（hidden data-publish="キー"）を非表示のまま、日時以降に自動で表示する。
    // 内側の [data-auto-date] には公開日を YYYY.MM.DD で入れる。
    const PUBLISH_SCHEDULE = {
        x500: '2026-09-28T20:30:00+09:00'   // Xフォロワー500人達成のお知らせ（記事・一覧の行）・ヘッダーのXボタン
    };
    const applyPublishGate = (root) => {
        root.querySelectorAll('[data-publish], [data-publish-at]').forEach(el => {
            const key = el.dataset.publish;
            const at = Date.parse((key ? PUBLISH_SCHEDULE[key] : el.dataset.publishAt) || '');
            if (Number.isNaN(at) || at > Date.now()) { el.hidden = true; return; }
            el.querySelectorAll('[data-auto-date]').forEach(d => {
                d.textContent = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' })
                    .format(new Date(at)).replace(/\//g, '.');
            });
            el.hidden = false;
        });
    };
    applyPublishGate(document);

    // ---- トップページ: お知らせページ（/news/）から最新情報を取り込む ----
    // お知らせの編集は news/index.html だけで行えばよい。
    //   #news-board   … ヒーロー上の新着（一覧の先頭3件。スマホはCSSで1件だけ表示）
    //   #news-latest  … Purpose 上の最新1件（本文付きの記事 .news-feature があればそれを複製、なければ簡易カード）
    //   [data-news-sync] … 下部の News 欄（一覧の先頭3件）
    // 公開予約は取り込んだ内容にも同じ判定を適用する。読み込みに失敗した場合は各枠を非表示のままにする。
    const newsBoard = document.getElementById('news-board');
    const newsLatest = document.getElementById('news-latest');
    const newsBottom = document.querySelector('.news-list[data-news-sync]');
    if (newsBoard || newsLatest || newsBottom) {
        const toSiteLink = (a) => {
            const href = a.getAttribute('href') || '/news/';
            return href.startsWith('#') ? '/news/' + href : href;
        };
        fetch('/news/', { credentials: 'same-origin' })
            .then(r => (r.ok ? r.text() : Promise.reject(new Error('news fetch ' + r.status))))
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                applyPublishGate(doc);
                const rows = Array.from(doc.querySelectorAll('.news-list .news-item')).filter(el => !el.hidden);
                if (!rows.length) return;
                const textOf = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };

                if (newsBoard) {
                    const list = newsBoard.querySelector('.news-board-list');
                    rows.slice(0, 3).forEach(row => {
                        const link = row.querySelector('a');
                        const a = document.createElement('a');
                        a.className = 'news-board-item';
                        a.href = link ? toSiteLink(link) : '/news/';
                        if (link && link.target) { a.target = link.target; a.rel = link.rel; }
                        const date = document.createElement('span'); date.className = 'news-board-date'; date.textContent = textOf(row, '.news-date');
                        const title = document.createElement('span'); title.className = 'news-board-title'; title.textContent = textOf(row, '.news-title');
                        a.append(date, title);
                        list.appendChild(a);
                    });
                    newsBoard.hidden = false;
                }

                if (newsLatest) {
                    const row = rows[0];
                    const link = row.querySelector('a');
                    const href = link ? (link.getAttribute('href') || '') : '';
                    const feature = href.startsWith('#') ? doc.getElementById(href.slice(1)) : null;
                    const container = newsLatest.querySelector('.container');
                    if (feature && feature.classList.contains('news-feature') && !feature.hidden) {
                        const clone = feature.cloneNode(true);
                        clone.id = 'top-' + feature.id;
                        clone.hidden = false;
                        clone.removeAttribute('data-publish');
                        clone.removeAttribute('data-publish-at');
                        clone.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', '/news/' + a.getAttribute('href')));
                        container.appendChild(clone);
                    } else {
                        const card = document.createElement('article');
                        card.className = 'news-feature news-feature--compact';
                        const head = document.createElement('div'); head.className = 'news-feature-head';
                        const date = document.createElement('span'); date.className = 'news-date'; date.textContent = textOf(row, '.news-date');
                        const tag = row.querySelector('.news-tag') ? row.querySelector('.news-tag').cloneNode(true) : null;
                        head.appendChild(date); if (tag) head.appendChild(tag);
                        const h = document.createElement('h2'); h.className = 'news-feature-title';
                        if (link) {
                            const a = document.createElement('a'); a.href = toSiteLink(link); a.textContent = textOf(row, '.news-title');
                            if (link.target) { a.target = link.target; a.rel = link.rel; }
                            h.appendChild(a);
                        } else {
                            h.textContent = textOf(row, '.news-title');
                        }
                        const more = document.createElement('p'); more.className = 'news-feature-cta';
                        const moreLink = document.createElement('a'); moreLink.className = 'btn-map'; moreLink.href = '/news/'; moreLink.textContent = 'お知らせ一覧へ';
                        more.appendChild(moreLink);
                        card.append(head, h, more);
                        container.appendChild(card);
                    }
                    newsLatest.hidden = false;
                }

                if (newsBottom) {
                    rows.slice(0, 3).forEach(row => {
                        const c = row.cloneNode(true);
                        c.hidden = false;
                        c.removeAttribute('data-publish');
                        c.removeAttribute('data-publish-at');
                        c.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', '/news/' + a.getAttribute('href')));
                        newsBottom.appendChild(c);
                    });
                }
            })
            .catch(() => { /* 取り込めない場合は枠を非表示のままにする */ });
    }

    // Hamburger Menu
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const header = document.querySelector('.header');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // Close mobile menu when a link is clicked
        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }

    // Sticky Header Background
    if (header) {
        const applyHeaderStyle = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', applyHeaderStyle);
        applyHeaderStyle();
    }

    // Smooth Scrolling with Offset (in-page anchors only)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Fade-in Animation on Scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            question.parentNode.classList.toggle('active');
        });
    });

    // Current page highlight in global nav
    const path = window.location.pathname;
    document.querySelectorAll('.nav-list a, .mobile-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href !== '/' && path.startsWith(href)) {
            link.classList.add('current');
        } else if (href === '/' && (path === '/' || path === '/index.html')) {
            link.classList.add('current');
        }
    });
});

// ---- GA4 イベント計測（gtag が読み込めない環境では何もしない） ----
// 主要な導線のクリックと動画の再生を、GA4 のイベントとして送る。
//   x_link_click      … X（@mokosuzurandai）へのリンク。placement: header / mobile_menu / news_article / other
//   news_click        … 新着ボード・お知らせ一覧・注目記事内のリンク。placement: news_board / news_list / news_feature
//   form_click        … Google フォームへのボタン。form_type: recruit / contact
//   contact_cta_click … 「お問い合わせ」ボタン（ヘッダー・CTA帯）
//   tel_click         … 電話番号のタップ
//   video_play        … PR動画の再生開始（1回のみ）
(function () {
    const track = (name, params) => {
        if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    };
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a, button');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        const text = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        const base = { link_url: href, link_text: text, page_path: location.pathname };
        if (a.classList.contains('x-link') || /^https?:\/\/(x|twitter)\.com\//.test(href)) {
            const placement = a.classList.contains('x-link') ? 'header'
                : a.closest('.mobile-menu') ? 'mobile_menu'
                : a.closest('.news-feature') ? 'news_article' : 'other';
            track('x_link_click', Object.assign({ placement }, base));
        } else if (a.closest('.news-board')) {
            track('news_click', Object.assign({ placement: 'news_board' }, base));
        } else if (a.closest('.news-feature')) {
            track('news_click', Object.assign({ placement: 'news_feature' }, base));
        } else if (a.closest('.news-list')) {
            track('news_click', Object.assign({ placement: 'news_list' }, base));
        } else if (/docs\.google\.com\/forms/.test(href)) {
            const form_type = (a.classList.contains('btn-entry') || /採用|エントリー/.test(text) || location.pathname.startsWith('/recruit/')) ? 'recruit' : 'contact';
            track('form_click', Object.assign({ form_type }, base));
        } else if (href.startsWith('tel:')) {
            track('tel_click', base);
        } else if (a.classList.contains('nav-contact') || a.classList.contains('btn-contact')) {
            track('contact_cta_click', base);
        }
    }, true);
    const hookVideo = (v) => {
        if (v.dataset.gaHooked) return;
        v.dataset.gaHooked = '1';
        v.addEventListener('play', () => {
            const src = v.currentSrc || (v.querySelector('source') || {}).src || '';
            track('video_play', { video_url: src, page_path: location.pathname });
        }, { once: true });
    };
    document.querySelectorAll('video').forEach(hookVideo);
    // お知らせの自動取り込みなどで後から追加される動画にも対応
    new MutationObserver(() => document.querySelectorAll('video').forEach(hookVideo))
        .observe(document.body, { childList: true, subtree: true });
})();
