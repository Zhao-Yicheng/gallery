(function () {
    'use strict';

    // ========== Configuration ==========
    const JSON_PATH = 'all_photos.json';
    const VISIBLE_SLOTS = 18;       // Number of visible photo slots in the carousel
    const ROTATION_DURATION = 40;    // Seconds for one full rotation
    const TILT_X = -8;               // X-axis tilt in degrees

    // ========== DOM Elements ==========
    const slider = document.getElementById('slider');
    const loader = document.getElementById('loader');
    const pauseBtn = document.getElementById('pauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const photoCount = document.getElementById('photoCount');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxInfo = document.getElementById('lightboxInfo');

    // ========== State ==========
    let photos = [];
    let currentAngle = 0;
    let isPaused = false;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartAngle = 0;
    let lastTime = 0;
    let rotationSpeed = -360 / ROTATION_DURATION;
    let animFrameId = null;
    let lightboxIndex = -1;

    // Virtual rendering: map slot index -> photo index
    let slotToPhoto = [];
    let slotElements = [];
    let photoOffset = 0; // Which photo is at slot 0

    // ========== Load Photos (from hardcoded data) ==========
    function loadPhotos() {
        // Use the photosData variable defined in index.html
        if (typeof photosData !== 'undefined' && photosData.length > 0) {
            photos = photosData;
            return Promise.resolve(photos);
        }
        console.error('photosData not found');
        return Promise.resolve([]);
    }

    // ========== Generate Low-Res URL ==========
    function getLowResUrl(originalUrl) {
        if (originalUrl.includes('pixcheese.com')) {
            return originalUrl.replace('/ori/', '/thumb/');
        }
        return null;
    }

    // ========== Get item dimensions based on screen ==========
    function getItemDimensions() {
        const w = window.innerWidth;
        if (w <= 480) return { width: 80, height: 110 };
        if (w <= 768) return { width: 100, height: 140 };
        return { width: 160, height: 220 };
    }

    // ========== Calculate translateZ for good spacing ==========
    function getTranslateZ() {
        const dim = getItemDimensions();
        const count = VISIBLE_SLOTS;
        // Circumference = 2 * PI * Z, each item takes dim.width + gap
        const itemSpacing = dim.width * 1.5;
        const idealZ = (count * itemSpacing) / (2 * Math.PI);
        return Math.max(dim.width * 1.8, Math.min(idealZ, 650));
    }

    // ========== Build Carousel (Virtualized) ==========
    function buildCarousel() {
        if (photos.length === 0) {
            loader.innerHTML = '<p style="color:#ff6b6b;">未找到照片，请确保 all_photos.json 存在</p>';
            return;
        }

        const count = photos.length;
        const slots = Math.min(VISIBLE_SLOTS, count);
        const angleStep = 360 / slots;
        const translateZ = getTranslateZ();
        const dim = getItemDimensions();

        // Update slider size
        slider.style.width = dim.width + 'px';
        slider.style.height = dim.height + 'px';

        // Create slot elements
        for (let i = 0; i < slots; i++) {
            const photoIndex = i % count;
            slotToPhoto[i] = photoIndex;

            const item = document.createElement('div');
            item.className = 'item';
            item.style.transform = `rotateY(${i * angleStep}deg) translateZ(${translateZ}px)`;

            const img = document.createElement('img');
            img.alt = photos[photoIndex].file_name || `Photo ${photoIndex + 1}`;
            img.className = 'loading';
            img.dataset.photoIndex = photoIndex;

            loadSlotImage(img, photoIndex);

            // Double-click to open lightbox
            item.addEventListener('dblclick', function (e) {
                e.preventDefault();
                openLightbox(parseInt(img.dataset.photoIndex));
            });

            // Single click on mobile
            let clickTimer = null;
            item.addEventListener('click', function () {
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    return;
                }
                clickTimer = setTimeout(function () {
                    openLightbox(parseInt(img.dataset.photoIndex));
                    clickTimer = null;
                }, 300);
            });

            item.appendChild(img);
            slider.appendChild(item);
            slotElements.push({ item, img });
        }

        photoOffset = 0;
        photoCount.textContent = `${count} photos`;
    }

    // ========== Load image for a slot ==========
    function loadSlotImage(img, photoIndex) {
        const photo = photos[photoIndex];
        if (!photo) return;

        img.className = 'loading';
        img.alt = photo.file_name || `Photo ${photoIndex + 1}`;
        img.dataset.photoIndex = photoIndex;

        // Set up load/error handlers before changing src
        img.onload = function () {
            this.classList.remove('loading');
            this.classList.add('loaded');
        };
        img.onerror = function () {
            // Try original URL as fallback if low-res failed
            if (this.dataset.highres && this.src !== this.dataset.highres) {
                this.src = this.dataset.highres;
            }
        };

        const lowResUrl = getLowResUrl(photo.file_uri);
        if (lowResUrl) {
            img.src = lowResUrl;
            img.dataset.highres = photo.file_uri;
        } else {
            img.loading = 'lazy';
            img.decoding = 'async';
            img.src = photo.file_uri;
        }
    }

    // ========== Update virtual slots during rotation ==========
    let lastUpdateAngle = 0;
    const UPDATE_THRESHOLD = 5; // degrees

    function updateVirtualSlots() {
        const count = photos.length;
        if (count <= VISIBLE_SLOTS) return; // No virtualization needed

        const slots = slotElements.length;
        const angleStep = 360 / slots;

        // Determine which photos should be visible based on current angle
        const normalizedAngle = ((-currentAngle % 360) + 360) % 360;
        const currentPhotoFloat = (normalizedAngle / 360) * count;
        const currentPhotoCenter = Math.round(currentPhotoFloat) % count;

        // Check if we need to shift slots
        const newOffset = currentPhotoCenter;
        if (newOffset === photoOffset) return;

        // Calculate which slots need updating
        const slotsToShift = Math.abs(newOffset - photoOffset);
        if (slotsToShift > count / 2) return; // Skip large jumps (drag)

        const direction = newOffset > photoOffset ? 1 : -1;

        for (let i = 0; i < slotsToShift; i++) {
            photoOffset = (photoOffset + direction + count) % count;

            // Update the slot that just went out of view on the opposite side
            const outSlot = direction > 0 ? 0 : slots - 1;
            const newPhotoIndex = (photoOffset + (direction > 0 ? slots : -1) + count) % count;

            slotToPhoto[outSlot] = newPhotoIndex;
            loadSlotImage(slotElements[outSlot].img, newPhotoIndex);
        }

        photoOffset = newOffset;
    }

    // ========== Animation Loop ==========
    function animate(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = Math.min((timestamp - lastTime) / 1000, 0.1); // Cap delta
        lastTime = timestamp;

        if (!isPaused && !isDragging) {
            currentAngle += rotationSpeed * delta;
        }

        slider.style.transform = `rotateX(${TILT_X}deg) rotateY(${currentAngle}deg)`;

        // Update virtual slots periodically
        if (!isDragging) {
            const angleDiff = Math.abs(currentAngle - lastUpdateAngle);
            if (angleDiff > UPDATE_THRESHOLD) {
                updateVirtualSlots();
                lastUpdateAngle = currentAngle;
            }
        }

        animFrameId = requestAnimationFrame(animate);
    }

    // ========== Lightbox ==========
    function openLightbox(photoIndex) {
        lightboxIndex = photoIndex;
        const photo = photos[photoIndex];
        if (!photo) return;

        lightboxImg.src = photo.file_uri;
        lightboxInfo.textContent = `${photo.file_name}  (${photoIndex + 1} / ${photos.length})`;
        lightbox.classList.add('active');
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightboxIndex = -1;
    }

    function lightboxNavigate(direction) {
        if (lightboxIndex < 0) return;
        lightboxIndex = (lightboxIndex + direction + photos.length) % photos.length;
        const photo = photos[lightboxIndex];
        lightboxImg.src = photo.file_uri;
        lightboxInfo.textContent = `${photo.file_name}  (${lightboxIndex + 1} / ${photos.length})`;
    }

    // ========== Controls ==========
    function initControls() {
        // Pause/Play
        pauseBtn.addEventListener('click', function () {
            isPaused = !isPaused;
            pauseBtn.innerHTML = isPaused ? '&#9654;' : '&#9208;';
        });

        // Prev/Next
        const angleStep = 360 / Math.min(VISIBLE_SLOTS, photos.length);
        prevBtn.addEventListener('click', function () {
            currentAngle += angleStep;
        });
        nextBtn.addEventListener('click', function () {
            currentAngle -= angleStep;
        });

        // Keyboard
        document.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'ArrowLeft':
                    currentAngle += angleStep;
                    break;
                case 'ArrowRight':
                    currentAngle -= angleStep;
                    break;
                case ' ':
                    e.preventDefault();
                    isPaused = !isPaused;
                    pauseBtn.innerHTML = isPaused ? '&#9654;' : '&#9208;';
                    break;
                case 'Escape':
                    closeLightbox();
                    break;
            }
        });

        // Mouse drag
        const scene = document.getElementById('scene');
        scene.addEventListener('mousedown', function (e) {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartAngle = currentAngle;
            scene.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            currentAngle = dragStartAngle + dx * 0.3;
        });

        document.addEventListener('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                document.getElementById('scene').style.cursor = '';
            }
        });

        // Touch drag
        scene.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                isDragging = true;
                dragStartX = e.touches[0].clientX;
                dragStartAngle = currentAngle;
            }
        }, { passive: true });

        scene.addEventListener('touchmove', function (e) {
            if (!isDragging || e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - dragStartX;
            currentAngle = dragStartAngle + dx * 0.3;
        }, { passive: true });

        scene.addEventListener('touchend', function () {
            isDragging = false;
        }, { passive: true });

        // Mouse wheel
        scene.addEventListener('wheel', function (e) {
            e.preventDefault();
            currentAngle -= Math.sign(e.deltaY) * angleStep;
        }, { passive: false });

        // Lightbox controls
        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox.querySelector('.lightbox-overlay')) {
                closeLightbox();
            }
        });
        lightboxPrev.addEventListener('click', function () { lightboxNavigate(-1); });
        lightboxNext.addEventListener('click', function () { lightboxNavigate(1); });

        // Lightbox keyboard
        document.addEventListener('keydown', function (e) {
            if (lightboxIndex < 0) return;
            if (e.key === 'ArrowLeft') lightboxNavigate(-1);
            if (e.key === 'ArrowRight') lightboxNavigate(1);
        });
    }

    // ========== Responsive ==========
    function updateLayout() {
        const dim = getItemDimensions();
        const translateZ = getTranslateZ();
        const slots = slotElements.length;
        const angleStep = 360 / slots;

        slider.style.width = dim.width + 'px';
        slider.style.height = dim.height + 'px';

        slotElements.forEach(function (slot, i) {
            slot.item.style.transform = `rotateY(${i * angleStep}deg) translateZ(${translateZ}px)`;
        });
    }

    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateLayout, 200);
    });

    // ========== Init ==========
    async function init() {
        await loadPhotos();
        buildCarousel();
        initControls();

        setTimeout(function () {
            loader.classList.add('hidden');
        }, 600);

        animFrameId = requestAnimationFrame(animate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
