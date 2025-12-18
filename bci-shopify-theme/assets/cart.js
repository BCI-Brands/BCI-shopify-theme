/**
 * BCI Brands Theme - Cart JavaScript
 * Handles cart drawer, cart updates, and cart interactions
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CART DRAWER
  // ═══════════════════════════════════════════════════════════════════════════
  
  window.CartDrawer = {
    drawer: null,
    overlay: null,
    isOpen: false,
    
    init() {
      this.drawer = document.querySelector('[data-cart-drawer]');
      this.overlay = document.querySelector('[data-cart-overlay]');
      
      if (!this.drawer) return;
      
      this.bindEvents();
    },
    
    bindEvents() {
      // Toggle buttons
      document.querySelectorAll('[data-cart-toggle]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggle();
        });
      });
      
      // Close buttons
      document.querySelectorAll('[data-cart-close]').forEach(btn => {
        btn.addEventListener('click', () => this.close());
      });
      
      // Overlay click
      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.close());
      }
      
      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
      
      // Quantity changes
      this.drawer.addEventListener('click', (e) => {
        const quantityBtn = e.target.closest('[data-quantity-change]');
        if (quantityBtn) {
          e.preventDefault();
          this.handleQuantityChange(quantityBtn);
        }
        
        const removeBtn = e.target.closest('[data-remove-item]');
        if (removeBtn) {
          e.preventDefault();
          this.handleRemoveItem(removeBtn);
        }
      });
    },
    
    toggle() {
      this.isOpen ? this.close() : this.open();
    },
    
    open() {
      this.isOpen = true;
      this.drawer.classList.add('cart-drawer--open');
      if (this.overlay) {
        this.overlay.classList.add('cart-drawer__overlay--visible');
      }
      document.body.style.overflow = 'hidden';
      this.refresh();
    },
    
    close() {
      this.isOpen = false;
      this.drawer.classList.remove('cart-drawer--open');
      if (this.overlay) {
        this.overlay.classList.remove('cart-drawer__overlay--visible');
      }
      document.body.style.overflow = '';
    },
    
    async refresh() {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        this.render(cart);
        this.updateCartCount(cart.item_count);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    },
    
    render(cart) {
      const itemsContainer = this.drawer.querySelector('[data-cart-items]');
      const subtotalElement = this.drawer.querySelector('[data-cart-subtotal]');
      const emptyMessage = this.drawer.querySelector('[data-cart-empty]');
      const cartFooter = this.drawer.querySelector('[data-cart-footer]');
      
      if (cart.item_count === 0) {
        if (itemsContainer) itemsContainer.innerHTML = '';
        if (emptyMessage) emptyMessage.style.display = 'block';
        if (cartFooter) cartFooter.style.display = 'none';
        return;
      }
      
      if (emptyMessage) emptyMessage.style.display = 'none';
      if (cartFooter) cartFooter.style.display = 'block';
      
      if (itemsContainer) {
        itemsContainer.innerHTML = cart.items.map(item => this.renderItem(item)).join('');
      }
      
      if (subtotalElement) {
        subtotalElement.textContent = this.formatMoney(cart.total_price);
      }
    },
    
    renderItem(item) {
      const variantTitle = item.variant_title && item.variant_title !== 'Default Title' 
        ? item.variant_title 
        : '';
      
      return `
        <div class="cart-item" data-cart-item data-line-key="${item.key}">
          <div class="cart-item__media">
            <a href="${item.url}">
              <img src="${item.image ? this.getSizedImage(item.image, '200x') : ''}" 
                   alt="${item.title}"
                   loading="lazy">
            </a>
          </div>
          <div class="cart-item__details">
            <span class="cart-item__brand">${item.vendor}</span>
            <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
            ${variantTitle ? `<span class="cart-item__variant">${variantTitle}</span>` : ''}
            <div class="cart-item__quantity">
              <button class="cart-item__quantity-btn" data-quantity-change="-1" data-line-key="${item.key}">−</button>
              <span class="cart-item__quantity-value">${item.quantity}</span>
              <button class="cart-item__quantity-btn" data-quantity-change="1" data-line-key="${item.key}">+</button>
            </div>
            <span class="cart-item__price">${this.formatMoney(item.final_line_price)}</span>
            <button class="cart-item__remove" data-remove-item data-line-key="${item.key}">Remove</button>
          </div>
        </div>
      `;
    },
    
    async handleQuantityChange(button) {
      const lineKey = button.dataset.lineKey;
      const change = parseInt(button.dataset.quantityChange);
      const item = this.drawer.querySelector(`[data-cart-item][data-line-key="${lineKey}"]`);
      const quantityElement = item.querySelector('.cart-item__quantity-value');
      const currentQuantity = parseInt(quantityElement.textContent);
      const newQuantity = Math.max(0, currentQuantity + change);
      
      await this.updateItem(lineKey, newQuantity);
    },
    
    async handleRemoveItem(button) {
      const lineKey = button.dataset.lineKey;
      await this.updateItem(lineKey, 0);
    },
    
    async updateItem(lineKey, quantity) {
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: lineKey,
            quantity: quantity
          })
        });
        
        const cart = await response.json();
        this.render(cart);
        this.updateCartCount(cart.item_count);
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    },
    
    updateCartCount(count) {
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? '' : 'none';
      });
    },
    
    formatMoney(cents) {
      return '$' + (cents / 100).toFixed(2);
    },
    
    getSizedImage(src, size) {
      if (!src) return '';
      return src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048|master)+\./g, '.')
                .replace(/\.([^.]*)$/, `_${size}.$1`);
    }
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    CartDrawer.init();
  });

})();
