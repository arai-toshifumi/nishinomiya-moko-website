document.addEventListener('DOMContentLoaded', () => {
    // 公開予約: data-publish-at（ISO 8601, 例 2026-10-10T12:00:00+09:00）が現在時刻以前なら表示する。
    // 空欄・未来の日時のあいだは hidden のまま。内側の [data-auto-date] には公開日を YYYY.MM.DD で入れる。
    document.querySelectorAll('[data-publish-at]').forEach(el => {
        const at = Date.parse(el.dataset.publishAt || '');
        if (Number.isNaN(at) || at > Date.now()) return;
        el.querySelectorAll('[data-auto-date]').forEach(d => {
            d.textContent = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' })
                .format(new Date(at)).replace(/\//g, '.');
        });
        el.hidden = false;
    });

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
