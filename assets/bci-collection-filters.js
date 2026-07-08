class BciCollectionGrid {
  static selector = '[data-bci-collection-grid], .bci-collection-grid';
  static hasBoundGlobalEvents = false;

  static initAll(container = document) {
    const roots = container.matches?.(this.selector)
      ? [container]
      : Array.from(container.querySelectorAll(this.selector));

    roots.forEach((root) => {
      if (!root.bciCollectionGrid) {
        root.bciCollectionGrid = new BciCollectionGrid(root);
      }
    });

    if (!this.hasBoundGlobalEvents) {
      window.addEventListener('popstate', () => {
        document.querySelectorAll(this.selector).forEach((root) => {
          root.bciCollectionGrid?.syncToLocation();
        });
      });

      document.addEventListener('shopify:section:load', (event) => {
        this.initAll(event.target);
      });

      this.hasBoundGlobalEvents = true;
    }
  }

  constructor(root) {
    this.root = root;
    this.isDesignMode = Boolean(window.Shopify?.designMode);
    this.abortController = null;
    this.handleClick = this.handleClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.cacheDom();
    this.bindEvents();
    this.syncGridViewButtons();

    if (!this.hasCollectionContext()) {
      return;
    }

    this.normalizeDynamicState();

    if (!this.isDesignMode) {
      this.syncToLocation({ pushState: false, replaceState: true, onInit: true });
    }
  }

  cacheDom() {
    this.toggle = this.root.querySelector('[data-bci-filter-toggle]');
    this.panel = this.root.querySelector('[data-bci-filter-panel]');
    this.symbol = this.root.querySelector('[data-bci-filter-symbol]');
    this.filterForm = this.root.querySelector('[data-bci-filter-panel]');
    this.dynamicFilters = this.root.querySelector('[data-bci-dynamic-filters]');
    this.dynamicGrid = this.root.querySelector('[data-bci-dynamic-grid]');
  }

  bindEvents() {
    this.root.addEventListener('click', this.handleClick);
    this.filterForm?.addEventListener('submit', this.handleSubmit);
  }

  unbindDynamicEvents() {
    this.filterForm?.removeEventListener('submit', this.handleSubmit);
  }

  destroy() {
    this.root.removeEventListener('click', this.handleClick);
    this.unbindDynamicEvents();
    this.abortController?.abort();
    delete this.root.bciCollectionGrid;
  }

  get shellCollectionUrl() {
    return this.root.dataset.shellCollectionUrl || window.location.pathname;
  }

  get shellCollectionHandle() {
    return this.root.dataset.shellCollectionHandle || this.parseCollectionHandle(this.shellCollectionUrl);
  }

  get activeCollectionUrl() {
    return this.root.dataset.activeCollectionUrl || this.shellCollectionUrl;
  }

  get activeCollectionHandle() {
    return this.root.dataset.activeCollectionHandle || this.shellCollectionHandle;
  }

  hasCollectionContext() {
    return this.isValidCollectionUrl(this.shellCollectionUrl) && Boolean(this.shellCollectionHandle);
  }

  isValidCollectionUrl(url) {
    return typeof url === 'string' && url.trim() !== '' && url.trim() !== 'undefined';
  }

  getCollectionLinks() {
    return Array.from(
      this.root.querySelectorAll(
        '[data-bci-collection-link], [data-bci-ajax-link], .bci-collection-toolbar__menu-link, .bci-collection-toolbar__title[href]'
      )
    );
  }

  parseCollectionHandle(url) {
    if (!url) return '';

    try {
      const parsedUrl = new URL(url, window.location.origin);
      const match = parsedUrl.pathname.match(/^\/collections\/([^/?#]+)/);
      return match?.[1] || '';
    } catch (error) {
      return '';
    }
  }

  getCollectionLinkHandle(link) {
    return (
      link.dataset.bciCollectionHandle ||
      link.dataset.collectionHandle ||
      this.parseCollectionHandle(link.dataset.bciFetchUrl) ||
      this.parseCollectionHandle(link.href)
    );
  }

  handleClick(event) {
    const toggle = event.target.closest('[data-bci-filter-toggle]');

    if (toggle && this.root.contains(toggle)) {
      this.togglePanel();
      return;
    }

    const viewButton = event.target.closest('[data-bci-grid-view]');

    if (viewButton && this.root.contains(viewButton)) {
      this.setGridColumns(viewButton.dataset.bciGridView);
      return;
    }

    const viewStepButton = event.target.closest('[data-bci-grid-view-step]');

    if (viewStepButton && this.root.contains(viewStepButton)) {
      this.stepGridColumns(parseInt(viewStepButton.dataset.bciGridViewStep, 10));
      return;
    }

    if (!this.hasCollectionContext()) {
      return;
    }

    const collectionLink = event.target.closest(
      '[data-bci-collection-link], [data-bci-ajax-link], .bci-collection-toolbar__menu-link, .bci-collection-toolbar__title[href]'
    );

    if (collectionLink && this.root.contains(collectionLink) && this.shouldHandleLinkClick(event, collectionLink)) {
      const collectionHandle = this.getCollectionLinkHandle(collectionLink);

      if (!collectionHandle) {
        return;
      }

      event.preventDefault();
      this.loadCollection(collectionLink, collectionHandle);
      return;
    }

    const clearLink = event.target.closest('.bci-filter-actions__clear');

    if (clearLink && this.root.contains(clearLink) && this.shouldHandleLinkClick(event, clearLink)) {
      event.preventDefault();
      this.clearFilters();
      return;
    }

    const paginationLink = event.target.closest('[data-bci-pagination-link]');

    if (paginationLink && this.root.contains(paginationLink) && this.shouldHandleLinkClick(event, paginationLink)) {
      event.preventDefault();
      this.loadPagination(paginationLink);
    }
  }

  handleSubmit(event) {
    if (!this.hasCollectionContext()) {
      return;
    }

    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const shellParams = new URLSearchParams();
    const fetchParams = new URLSearchParams();

    formData.forEach((value, key) => {
      if (typeof value !== 'string' || value.trim() === '') return;

      if (key === 'view_collection') return;

      fetchParams.append(key, value);

      if (key !== 'page') {
        shellParams.append(key, value);
      }
    });

    this.navigate({
      fetchUrl: this.buildUrl(this.activeCollectionUrl, fetchParams),
      shellUrl: this.buildShellUrl(shellParams, this.activeCollectionHandle),
      activeCollectionHandle: this.activeCollectionHandle,
      activeCollectionUrl: this.activeCollectionUrl,
    });
  }

  shouldHandleLinkClick(event, link) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== '_self') return false;
    if (link.origin && link.origin !== window.location.origin) return false;

    return true;
  }

  syncGridViewButtons() {
    this.setGridColumns(this.root.dataset.bciColumns);
    this.syncFilterToggle();
  }

  syncFilterToggle() {
    if (!this.toggle) return;
    const isEmpty = Boolean(this.dynamicGrid?.querySelector('.bci-collection-empty'));
    this.toggle.disabled = isEmpty;
    if (isEmpty && this.panel && this.panel.classList.contains('is-open')) {
      this.togglePanel(false);
    }
  }

  setGridColumns(columns) {
    if (!columns) return;

    this.root.dataset.bciColumns = columns;

    this.root.querySelectorAll('[data-bci-grid-view]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.bciGridView === columns);
    });

    this.syncStepButtons(columns);
  }

  stepGridColumns(step) {
    const steps = [2, 4, 6];
    const current = parseInt(this.root.dataset.bciColumns, 10) || 4;
    const currentIndex = steps.indexOf(current);
    const nextIndex = Math.max(0, Math.min(steps.length - 1, currentIndex - step));
    this.setGridColumns(String(steps[nextIndex]));
  }

  syncStepButtons(columns) {
    const steps = [2, 4, 6];
    const current = parseInt(columns, 10);
    const currentIndex = steps.indexOf(current);
    const isEmpty = Boolean(this.dynamicGrid?.querySelector('.bci-collection-empty'));

    this.root.querySelectorAll('[data-bci-grid-view-step]').forEach((button) => {
      const step = parseInt(button.dataset.bciGridViewStep, 10);
      const nextIndex = currentIndex - step;
      button.disabled = isEmpty || nextIndex < 0 || nextIndex >= steps.length;
    });
  }

  togglePanel(forceOpen) {
    if (!this.panel) return;

    const isOpen = this.panel.classList.contains('is-open');
    const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;

    this.panel.classList.toggle('is-open', nextOpen);
    this.panel.removeAttribute('hidden');
    this.toggle?.setAttribute('aria-expanded', String(nextOpen));

    if (this.symbol) {
      this.symbol.textContent = nextOpen ? '(-)' : '(+)';
    }
  }

  normalizeDynamicState() {
    this.unbindDynamicEvents();
    this.cacheDom();

    if (!this.hasCollectionContext()) {
      return;
    }

    if (this.filterForm) {
      this.filterForm.action = this.shellCollectionUrl;
      this.ensureViewCollectionInput();
      this.filterForm.addEventListener('submit', this.handleSubmit);
    }

    this.getCollectionLinks().forEach((link) => {
      const handle = this.getCollectionLinkHandle(link);
      const fetchUrl = link.dataset.bciFetchUrl || link.href;

      if (!handle) return;

      const shellUrl = this.buildShellUrl(new URLSearchParams(), handle);

      link.dataset.bciFetchUrl = fetchUrl;
      link.href = shellUrl;
      link.dataset.bciCollectionHandle = handle;
    });

    this.root.querySelectorAll('.bci-filter-actions__clear').forEach((link) => {
      link.href = this.buildShellUrl(new URLSearchParams(), this.activeCollectionHandle);
    });

    this.root.querySelectorAll('[data-bci-pagination-link]').forEach((link) => {
      const fetchUrl = link.dataset.bciFetchUrl || link.href;
      const fetchParams = new URL(fetchUrl, window.location.origin).searchParams;
      link.href = this.buildShellUrl(fetchParams, this.activeCollectionHandle);
    });
  }

  ensureViewCollectionInput() {
    if (!this.filterForm) return;

    let input = this.filterForm.querySelector('[data-bci-view-collection-input]');

    if (this.activeCollectionHandle !== this.shellCollectionHandle) {
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'view_collection';
        input.setAttribute('data-bci-view-collection-input', '');
        this.filterForm.prepend(input);
      }

      input.value = this.activeCollectionHandle;
    } else if (input) {
      input.remove();
    }
  }

  setActiveCollectionState(handle, url) {
    const nextHandle = handle || this.shellCollectionHandle;
    const nextUrl = url || this.shellCollectionUrl;

    this.root.dataset.activeCollectionHandle = nextHandle;
    this.root.dataset.activeCollectionUrl = nextUrl;

    this.getCollectionLinks().forEach((link) => {
      const isActive = this.getCollectionLinkHandle(link) === nextHandle;

      link.classList.toggle('is-active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  buildShellUrl(params, activeHandle) {
    const url = new URL(this.shellCollectionUrl, window.location.origin);
    const nextParams = new URLSearchParams(params);

    nextParams.delete('view_collection');

    if (activeHandle && activeHandle !== this.shellCollectionHandle) {
      nextParams.set('view_collection', activeHandle);
    }

    url.search = nextParams.toString();
    return url.toString();
  }

  buildUrl(baseUrl, params) {
    const url = new URL(baseUrl, window.location.origin);
    const nextParams = new URLSearchParams(url.search);
    const incomingParams = new URLSearchParams(params);
    const keys = [...new Set(Array.from(incomingParams.keys()))];

    keys.forEach((key) => nextParams.delete(key));

    incomingParams.forEach((value, key) => {
      nextParams.append(key, value);
    });

    url.search = nextParams.toString();
    return url.toString();
  }

  getLocationCollectionHandle() {
    const params = new URLSearchParams(window.location.search);
    return params.get('view_collection') || this.shellCollectionHandle;
  }

  syncToLocation({ pushState = false, replaceState = false, onInit = false } = {}) {
    if (!this.hasCollectionContext() || this.isDesignMode) {
      return;
    }

    const locationParams = new URLSearchParams(window.location.search);
    const requestedHandle = this.getLocationCollectionHandle();
    const menuLink = this.getCollectionLinks().find((link) => this.getCollectionLinkHandle(link) === requestedHandle);

    if (!menuLink) {
      const shouldLoadShell =
        !onInit &&
        (locationParams.toString() !== '' || this.activeCollectionHandle !== this.shellCollectionHandle);

      this.setActiveCollectionState(this.shellCollectionHandle, this.shellCollectionUrl);
      this.normalizeDynamicState();

      if (shouldLoadShell) {
        const shellUrl = this.buildShellUrl(new URLSearchParams(), this.shellCollectionHandle);

        this.navigate({
          fetchUrl: shellUrl,
          shellUrl,
          activeCollectionHandle: this.shellCollectionHandle,
          activeCollectionUrl: this.shellCollectionUrl,
          pushState,
          replaceState,
        });
      }

      return;
    }

    const fetchParams = new URLSearchParams(locationParams);
    fetchParams.delete('view_collection');

    const fetchBaseUrl = menuLink.dataset.bciFetchUrl || this.shellCollectionUrl;
    const fetchUrl = this.buildUrl(fetchBaseUrl, fetchParams);
    const shellUrl = this.buildShellUrl(locationParams, requestedHandle);
    const shouldLoad =
      !onInit ||
      requestedHandle !== this.shellCollectionHandle ||
      fetchParams.toString() !== '' ||
      this.activeCollectionHandle !== requestedHandle;

    this.setActiveCollectionState(requestedHandle, fetchBaseUrl);
    this.normalizeDynamicState();

    if (!shouldLoad) {
      if (replaceState) {
        window.history.replaceState({ bciCollectionAjax: true }, '', shellUrl);
      }
      return;
    }

    this.navigate({
      fetchUrl,
      shellUrl,
      activeCollectionHandle: requestedHandle,
      activeCollectionUrl: fetchBaseUrl,
      pushState,
      replaceState,
      onInit,
    });
  }

  loadCollection(link, handle = this.getCollectionLinkHandle(link) || this.shellCollectionHandle) {
    const fetchBaseUrl = link.dataset.bciFetchUrl || link.href;
    const shellUrl = this.buildShellUrl(new URLSearchParams(), handle);

    this.navigate({
      fetchUrl: this.buildUrl(fetchBaseUrl, new URLSearchParams()),
      shellUrl,
      activeCollectionHandle: handle,
      activeCollectionUrl: fetchBaseUrl,
    });
  }

  clearFilters() {
    const shellUrl = this.buildShellUrl(new URLSearchParams(), this.activeCollectionHandle);

    this.navigate({
      fetchUrl: this.buildUrl(this.activeCollectionUrl, new URLSearchParams()),
      shellUrl,
      activeCollectionHandle: this.activeCollectionHandle,
      activeCollectionUrl: this.activeCollectionUrl,
    });
  }

  loadPagination(link) {
    const fetchUrl = link.dataset.bciFetchUrl || link.href;
    this.appendPagination(link, fetchUrl);
  }

  async appendPagination(trigger, fetchUrl) {
    if (!this.hasCollectionContext()) return;

    this.abortController?.abort();
    this.abortController = new AbortController();

    trigger.classList.add('is-loading');
    trigger.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(fetchUrl, {
        signal: this.abortController.signal,
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (!response.ok) throw new Error(`Pagination request failed with ${response.status}`);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newItems = doc.querySelectorAll('#product-grid > li');
      const currentGrid = this.dynamicGrid?.querySelector('#product-grid');

      if (currentGrid && newItems.length) {
        newItems.forEach((item) => currentGrid.appendChild(item));
      }

      const newPagination = doc.querySelector('.bci-pagination');
      const currentPagination = this.dynamicGrid?.querySelector('.bci-pagination');

      if (currentPagination) {
        if (newPagination) {
          currentPagination.replaceWith(newPagination);
        } else {
          currentPagination.remove();
        }
      }

      this.normalizeDynamicState();
    } catch (error) {
      if (error.name === 'AbortError') return;
      window.location.assign(fetchUrl);
    } finally {
      trigger.classList.remove('is-loading');
      trigger.removeAttribute('aria-busy');
    }
  }

  async navigate({
    fetchUrl,
    shellUrl,
    activeCollectionHandle,
    activeCollectionUrl,
    pushState = true,
    replaceState = false,
  }) {
    if (!this.hasCollectionContext()) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const nextShellUrl = new URL(shellUrl, window.location.origin);

    currentUrl.hash = '';
    nextShellUrl.hash = '';

    if (!replaceState && pushState && currentUrl.toString() === nextShellUrl.toString()) {
      return;
    }

    this.abortController?.abort();
    this.abortController = new AbortController();

    const currentColumns = this.root.dataset.bciColumns;
    const panelIsOpen = this.panel ? this.panel.classList.contains('is-open') : false;

    this.setActiveCollectionState(activeCollectionHandle, activeCollectionUrl);
    this.setLoading(true);

    try {
      const response = await fetch(fetchUrl, {
        signal: this.abortController.signal,
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`Collection request failed with ${response.status}`);
      }

      const html = await response.text();
      const documentFragment = new DOMParser().parseFromString(html, 'text/html');
      const replacements = this.findReplacementContent(documentFragment);

      if (!replacements?.grid || !this.dynamicGrid) {
        throw new Error('Replacement collection grid was not found in the response.');
      }

      if (replacements.filters && this.dynamicFilters) {
        this.dynamicFilters.replaceWith(replacements.filters);
        this.dynamicFilters = replacements.filters;
      }

      this.dynamicGrid.replaceWith(replacements.grid);
      this.dynamicGrid = replacements.grid;

      this.normalizeDynamicState();
      this.setGridColumns(currentColumns);
      this.syncFilterToggle();

      if (panelIsOpen) {
        this.togglePanel(true);
      }

      if (!this.isDesignMode && replaceState) {
        window.history.replaceState({ bciCollectionAjax: true }, '', nextShellUrl.toString());
      } else if (!this.isDesignMode && pushState) {
        window.history.pushState({ bciCollectionAjax: true }, '', nextShellUrl.toString());
      }
    } catch (error) {
      if (error.name === 'AbortError') return;

      if (this.isDesignMode) {
        console.error(error);
        return;
      }

      window.location.assign(nextShellUrl.toString());
    } finally {
      this.setLoading(false);
    }
  }

  findReplacementContent(documentFragment) {
    const responseRoot = documentFragment.querySelector(BciCollectionGrid.selector) || documentFragment;
    const genericGrid = documentFragment.querySelector('#ProductGridContainer');
    let grid = responseRoot.querySelector('[data-bci-dynamic-grid]');

    if (!grid && genericGrid) {
      grid = document.createElement('div');
      grid.setAttribute('data-bci-dynamic-grid', '');
      grid.appendChild(genericGrid.cloneNode(true));

      grid.querySelectorAll('a[href*="page="]').forEach((link) => {
        link.dataset.bciPaginationLink = '';
        link.dataset.bciFetchUrl = link.href;
      });
    }

    return {
      filters: responseRoot.querySelector('[data-bci-dynamic-filters]'),
      grid,
    };
  }

  setLoading(isLoading) {
    this.root.classList.toggle('is-loading', isLoading);
    this.root.setAttribute('aria-busy', String(isLoading));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BciCollectionGrid.initAll(), { once: true });
} else {
  BciCollectionGrid.initAll();
}
