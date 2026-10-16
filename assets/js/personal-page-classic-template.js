window.lotus = window.lotus || {};

window.lotus.personalPageClassic = {
    _instances: {},

    init: (rootId) => {
        const root = document.getElementById(rootId);
        if (!root) return;
        lotus.personalPageClassic.destroy(rootId);

        const header = root.querySelector('#header');
        const sections = root.querySelectorAll('section');
        const mobileToggle = root.querySelector('.mobile-nav-toggle');
        const mobileOverly = root.querySelector('.mobile-nav-overly');

        const setMobileIcon = (open) => {
            const icon = mobileToggle?.querySelector('i');
            if (!icon) return;
            icon.classList.toggle('bi-list', !open);
            icon.classList.toggle('bi-x-lg', open);
        };

        const openMobileNav = () => {
            root.classList.add('lotus-ppc--mobile-nav-active');
            document.body.classList.add('lotus-ppc-scroll-lock');
            setMobileIcon(true);
            if (mobileOverly) mobileOverly.style.display = 'block';
        };

        const closeMobileNav = () => {
            root.classList.remove('lotus-ppc--mobile-nav-active');
            document.body.classList.remove('lotus-ppc-scroll-lock');
            setMobileIcon(false);
            if (mobileOverly) mobileOverly.style.display = 'none';
        };

        const showTarget = (targetId) => {
            sections.forEach(s => s.classList.remove('section-show'));
            root.querySelector('#' + targetId)?.classList.add('section-show');
        };

        const activateNav = (targetId) => {
            root.querySelectorAll('.nav-menu li, .mobile-nav li').forEach(li => li.classList.remove('active'));
            root.querySelectorAll(`.nav-menu a[data-target="${targetId}"], .mobile-nav a[data-target="${targetId}"]`)
                .forEach(a => a.closest('li')?.classList.add('active'));
        };

        const navClickHandler = (e) => {
            const link = e.target.closest('.nav-menu a, .mobile-nav a, .brand-link');
            if (!link || !root.contains(link)) return;
            e.preventDefault();

            const targetId = link.getAttribute('data-target');
            if (!targetId) return;

            activateNav(targetId);

            if (targetId === 'header') {
                header.classList.remove('header-top');
                sections.forEach(s => s.classList.remove('section-show'));
            } else if (!header.classList.contains('header-top')) {
                header.classList.add('header-top');
                window.setTimeout(() => showTarget(targetId), 350);
            } else {
                showTarget(targetId);
            }

            if (root.classList.contains('lotus-ppc--mobile-nav-active')) {
                closeMobileNav();
            }
        };
        root.addEventListener('click', navClickHandler);

        const toggleHandler = () => {
            if (root.classList.contains('lotus-ppc--mobile-nav-active')) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        };
        mobileToggle?.addEventListener('click', toggleHandler);

        const overlyClickHandler = () => closeMobileNav();
        mobileOverly?.addEventListener('click', overlyClickHandler);

        const outsideClickHandler = (e) => {
            if (!root.classList.contains('lotus-ppc--mobile-nav-active')) return;
            const mobileNav = root.querySelector('.mobile-nav');
            if (mobileNav?.contains(e.target) || mobileToggle?.contains(e.target)) return;
            closeMobileNav();
        };
        document.addEventListener('click', outsideClickHandler);

        const initialHash = window.location.hash ? window.location.hash.substring(1) : null;
        if (initialHash && root.querySelector('#' + initialHash)) {
            header.classList.add('header-top');
            activateNav(initialHash);
            window.setTimeout(() => showTarget(initialHash), 350);
        }

        let skillsObserver = null;
        const skillsContent = root.querySelector('.skills-content');
        if (skillsContent && 'IntersectionObserver' in window) {
            skillsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    root.querySelectorAll('.progress .progress-bar').forEach(bar => {
                        bar.style.width = (bar.getAttribute('aria-valuenow') || '0') + '%';
                    });
                    skillsObserver.unobserve(entry.target);
                });
            }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
            skillsObserver.observe(skillsContent);
        }

        const portfolioItems = Array.from(root.querySelectorAll('.portfolio-item'));
        const portfolioContainer = root.querySelector('.portfolio-container');
        const filtersEl = root.querySelector('#portfolio-flters');

        const transitionEndHandlers = lotus.galleryFlip.bindTransitionEnd(
            portfolioItems, 'portfolio-item--filtered-out', 'portfolio-item--hidden');

        const filterClickHandler = (e) => {
            const btn = e.target.closest('#portfolio-flters li');
            if (!btn) return;
            filtersEl.querySelectorAll('li').forEach(b => b.classList.remove('filter-active'));
            btn.classList.add('filter-active');
            lotus.galleryFlip.applyFilter(portfolioContainer, portfolioItems, btn.getAttribute('data-filter'), {
                hiddenClass: 'portfolio-item--hidden',
                filteredOutClass: 'portfolio-item--filtered-out',
                matches: (item, filterValue) => filterValue === '*' || item.classList.contains(filterValue.substring(1))
            });
        };
        filtersEl?.addEventListener('click', filterClickHandler);

        const lightbox = root.querySelector('.lotus-ppc__lightbox');
        const lightboxTile = lightbox?.querySelector('.lotus-ppc__portfolio-lightbox-tile');
        const lightboxCaption = lightbox?.querySelector('.lotus-ppc__lightbox-caption');
        const lightboxCtrl = lotus.galleryLightbox.create(lightbox, lightboxTile, lightboxCaption, 'lotus-ppc__lightbox--open');

        const lightboxTriggerHandler = (e) => {
            const trigger = e.target.closest('.lotus-gallery-lightbox-trigger');
            if (!trigger || !root.contains(trigger)) return;
            e.preventDefault();
            lightboxCtrl.open({
                imageUrl: trigger.getAttribute('data-lightbox-image'),
                iconClass: trigger.getAttribute('data-lightbox-icon'),
                gradientClass: trigger.getAttribute('data-lightbox-gradient'),
                title: trigger.getAttribute('data-lightbox-title')
            });
        };
        root.addEventListener('click', lightboxTriggerHandler);

        const lightboxBackdropHandler = (e) => {
            if (e.target === lightbox) lightboxCtrl.close();
        };
        lightbox?.addEventListener('click', lightboxBackdropHandler);

        const lightboxCloseBtn = lightbox?.querySelector('.lotus-ppc__lightbox-close');
        lightboxCloseBtn?.addEventListener('click', lightboxCtrl.close);

        const keydownHandler = (e) => {
            if (e.key !== 'Escape') return;
            if (lightbox?.classList.contains('lotus-ppc__lightbox--open')) {
                lightboxCtrl.close();
                return;
            }
            if (root.classList.contains('lotus-ppc--mobile-nav-active')) {
                closeMobileNav();
            }
        };
        document.addEventListener('keydown', keydownHandler);

        lotus.personalPageClassic._instances[rootId] = {
            root, header, mobileToggle, mobileOverly, filtersEl,
            navClickHandler, toggleHandler, overlyClickHandler, outsideClickHandler,
            filterClickHandler, transitionEndHandlers,
            lightbox, lightboxTriggerHandler, lightboxBackdropHandler, lightboxCloseBtn,
            closeLightbox: lightboxCtrl.close,
            keydownHandler, skillsObserver
        };
    },

    destroy: (rootId) => {
        const inst = lotus.personalPageClassic._instances[rootId];
        if (!inst) return;

        inst.root.removeEventListener('click', inst.navClickHandler);
        inst.mobileToggle?.removeEventListener('click', inst.toggleHandler);
        inst.mobileOverly?.removeEventListener('click', inst.overlyClickHandler);
        document.removeEventListener('click', inst.outsideClickHandler);
        document.removeEventListener('keydown', inst.keydownHandler);
        inst.filtersEl?.removeEventListener('click', inst.filterClickHandler);
        lotus.galleryFlip.unbindTransitionEnd(inst.transitionEndHandlers);
        inst.root.removeEventListener('click', inst.lightboxTriggerHandler);
        inst.lightbox?.removeEventListener('click', inst.lightboxBackdropHandler);
        inst.lightboxCloseBtn?.removeEventListener('click', inst.closeLightbox);
        inst.skillsObserver?.disconnect();
        document.body.classList.remove('lotus-ppc-scroll-lock');

        delete lotus.personalPageClassic._instances[rootId];
    }
};
