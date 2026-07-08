(function () {
  // handle → Map(variantId → sizedImageSrc)
  const productCache = new Map();

  function addShopifySize(url, size) {
    // image.jpg?v=123 → image_720x.jpg?v=123
    return url.replace(/(\.(jpg|jpeg|png|gif|webp))(\?|$)/i, '_' + size + '$1$3');
  }

  function preloadImages(variantMap) {
    for (const src of variantMap.values()) {
      const el = new Image();
      el.src = src;
    }
  }

  async function fetchProductImages(handle) {
    if (productCache.has(handle)) return;

    // Mark in-flight immediately so parallel mouseovers don't duplicate the request
    productCache.set(handle, new Map());

    try {
      const res = await fetch('/products/' + handle + '.js');
      const data = await res.json();
      const variantMap = new Map();

      for (const variant of data.variants) {
        if (variant.featured_image && variant.featured_image.src) {
          const src = addShopifySize(variant.featured_image.src, '720x');
          variantMap.set(String(variant.id), src);
        }
      }

      productCache.set(handle, variantMap);
      preloadImages(variantMap);
    } catch (_) {
      // leave the empty Map in cache so we don't retry on every hover
    }
  }

  function getCardImage(card) {
    // bci-product-showcase cards: secondary image is visible on hover
    if (card.classList.contains('bci-product-card')) {
      return (
        card.querySelector('.bci-product-card__image--secondary') ||
        card.querySelector('.bci-product-card__image--primary')
      );
    }
    // Standard card-product (Dawn): media--hover-effect shows second img on hover
    const media = card.querySelector('.card__media .media');
    if (!media) return null;
    const imgs = media.querySelectorAll('img');
    if (imgs.length >= 2) return imgs[1];
    return imgs[0] || null;
  }

  function swapImage(img, newSrc) {
    if (!img.dataset.originalSrc) {
      img.dataset.originalSrc = img.src;
      img.dataset.originalSrcset = img.srcset || '';
    }
    img.removeAttribute('srcset');
    img.src = newSrc;
  }

  function restoreImage(img) {
    if (!img.dataset.originalSrc) return;
    img.src = img.dataset.originalSrc;
    if (img.dataset.originalSrcset) {
      img.setAttribute('srcset', img.dataset.originalSrcset);
    }
    delete img.dataset.originalSrc;
    delete img.dataset.originalSrcset;
  }

  // Prefetch + preload the moment the mouse enters a card
  document.addEventListener('mouseenter', function (e) {
    const card = e.target.closest('.card-wrapper, .bci-product-card');
    if (!card) return;
    const container = card.querySelector('.card__color-swatches[data-handle]');
    if (!container) return;
    fetchProductImages(container.dataset.handle);
  }, true);

  // Synchronous cache lookup — no await, no race condition
  document.addEventListener('mouseover', function (e) {
    const swatch = e.target.closest('.card__color-swatch[data-variant-id]');
    if (!swatch) return;

    const card = swatch.closest('.card-wrapper, .bci-product-card');
    if (!card) return;
    const container = card.querySelector('.card__color-swatches[data-handle]');
    if (!container) return;

    const variantMap = productCache.get(container.dataset.handle);
    if (!variantMap) return; // prefetch not done yet — very brief window

    const imageSrc = variantMap.get(swatch.dataset.variantId);
    if (!imageSrc) return; // variant has no assigned image

    const img = getCardImage(card);
    if (img) swapImage(img, imageSrc);
  });

  // Restore original image when leaving a swatch — skip if cursor moves to another swatch
  document.addEventListener('mouseout', function (e) {
    const swatch = e.target.closest('.card__color-swatch[data-variant-id]');
    if (!swatch) return;
    if (swatch.contains(e.relatedTarget)) return;
    if (e.relatedTarget && e.relatedTarget.closest('.card__color-swatch[data-variant-id]')) return;

    const card = swatch.closest('.card-wrapper, .bci-product-card');
    if (!card) return;
    const img = getCardImage(card);
    if (img) restoreImage(img);
  });

  // Swatch link click — prevent the card cover-link from also firing
  document.addEventListener('click', function (e) {
    const swatch = e.target.closest('.card__color-swatch');
    if (swatch) e.stopPropagation();
  });
})();
