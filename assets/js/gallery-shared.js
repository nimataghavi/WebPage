window.lotus = window.lotus || {};

window.lotus.galleryFlip = {
    bindTransitionEnd: (items, filteredOutClass, hiddenClass) => items.map(item => {
        const handler = (e) => {
            if (e.propertyName !== 'opacity') return;
            if (!item.classList.contains(filteredOutClass)) return;
            item.classList.add(hiddenClass);
            item.style.position = '';
            item.style.top = '';
            item.style.left = '';
            item.style.width = '';
        };
        item.addEventListener('transitionend', handler);
        return { item, handler };
    }),

    unbindTransitionEnd: (handlers) => {
        handlers.forEach(({ item, handler }) => item.removeEventListener('transitionend', handler));
    },

    applyFilter: (container, items, filterValue, { hiddenClass, filteredOutClass, matches }) => {
        if (!container) return;
        const containerRect = container.getBoundingClientRect();

        const records = items.map(item => {
            const wasVisible = !item.classList.contains(hiddenClass);
            const firstRect = wasVisible ? item.getBoundingClientRect() : null;
            const nextVisible = matches(item, filterValue);
            return { item, wasVisible, nextVisible, firstRect };
        });

        records.forEach(({ item, wasVisible, nextVisible, firstRect }) => {
            if (wasVisible && !nextVisible) {
                item.style.position = 'absolute';
                item.style.top = `${firstRect.top - containerRect.top}px`;
                item.style.left = `${firstRect.left - containerRect.left}px`;
                item.style.width = `${firstRect.width}px`;
                item.classList.add(filteredOutClass);
            }
        });

        records.forEach(({ item, wasVisible, nextVisible }) => {
            if (!wasVisible && nextVisible) {
                item.classList.remove(hiddenClass);
            }
        });

        void container.offsetHeight;

        const inverted = [];
        records.forEach(({ item, wasVisible, nextVisible, firstRect }) => {
            if (!(wasVisible && nextVisible)) return;
            const lastRect = item.getBoundingClientRect();
            const dx = firstRect.left - lastRect.left;
            const dy = firstRect.top - lastRect.top;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                item.style.transition = 'none';
                item.style.transform = `translate(${dx}px, ${dy}px)`;
                inverted.push(item);
            }
        });

        void container.offsetHeight;

        requestAnimationFrame(() => {
            inverted.forEach(item => {
                item.style.transition = '';
                item.style.transform = '';
            });
            records.forEach(({ item, wasVisible, nextVisible }) => {
                if (!wasVisible && nextVisible) {
                    item.classList.remove(filteredOutClass);
                }
            });
        });
    }
};

window.lotus.galleryLightbox = {
    create: (lightboxEl, tileEl, captionEl, openClass) => {
        let currentGradientClass = null;

        const open = ({ imageUrl, iconClass, gradientClass, title, description }) => {
            if (!lightboxEl || !tileEl) return;

            if (currentGradientClass) {
                tileEl.classList.remove(currentGradientClass);
                currentGradientClass = null;
            }

            if (imageUrl) {
                tileEl.style.backgroundImage = '';
                const img = document.createElement('img');
                img.className = 'lotus-gallery-lightbox-img';
                img.src = imageUrl;
                img.alt = title || '';
                tileEl.replaceChildren(img);
            } else {
                tileEl.style.backgroundImage = '';
                if (gradientClass) {
                    tileEl.classList.add(gradientClass);
                    currentGradientClass = gradientClass;
                }
                tileEl.innerHTML = iconClass ? `<i class="bi ${iconClass}" aria-hidden="true"></i>` : '';
            }

            if (captionEl) {
                captionEl.textContent = [title, description].filter(Boolean).join(' — ');
            }

            lightboxEl.classList.add(openClass);
            document.body.classList.add('lotus-ppc-scroll-lock');
        };

        const close = () => {
            if (!lightboxEl) return;
            lightboxEl.classList.remove(openClass);
            document.body.classList.remove('lotus-ppc-scroll-lock');
        };

        return { open, close };
    }
};
