/**
 * BCI Brands Theme - Global JavaScript
 * Handles header scroll behavior, mobile menu, search modal, and general UI interactions
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER SCROLL BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════════
  
  const Header = {
    element: null,
    lastScrollY: 0,
    scrollThreshold: 100,
    
    init() {
      this.element = document.querySelector('[data-header]');
      if (!this.element) return;
      
      this.bindEvents();
    },
    
    bindEvents() {
      let ticking = false;
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.onScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },
    
    onScroll() {
      const currentScrollY = window.scrollY;
      
      // Add/remove scrolled class
      if (currentScrollY > 10) {
        this.element.classList.add('header--scrolled');
      } else {
        this.element.classList.remove('header--scrolled');
      }
      
      // Hide/show header on scroll direction
      if (currentScrollY > this.lastScrollY && currentScrollY > this.scrollThreshold) {
        this.element.classList.add('header--hidden');
      } else {
        this.element.classList.remove('header--hidden');
      }
      
      this.lastScrollY = currentScrollY;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE MENU
  // ═══════════════════════════════════════════════════════════════════════════
  
  const MobileMenu = {
    menu: null,
    toggle: null,
    overlay: null,
    isOpen: false,
    
    init() {
      this.menu = document.querySelector('[data-mobile-menu]');
      this.toggle = document.querySelector('[data-mobile-menu-toggle]');
      
      if (!this.menu || !this.toggle) return;
      
      this.createOverlay();
      this.bindEvents();
    },
    
    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'mobile-menu-overlay';
      this.overlay.setAttribute('data-mobile-menu-overlay', '');
      document.body.appendChild(this.overlay);
      
      // Add overlay styles
      Object.assign(this.overlay.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: '9998',
        opacity: '0',
        visibility: 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease'
      });
    },
    
    bindEvents() {
      this.toggle.addEventListener('click', () => this.toggleMenu());
      this.overlay.addEventListener('click', () => this.close());
      
      // Submenu toggles
      const expandButtons = this.menu.querySelectorAll('.mobile-menu__expand');
      expandButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const parent = e.currentTarget.closest('.mobile-menu__item');
          const submenu = parent.nextElementSibling;
          const isExpanded = btn.getAttribute('aria-expanded') === 'true';
          
          btn.setAttribute('aria-expanded', !isExpanded);
          submenu.classList.toggle('mobile-menu__submenu--open');
        });
      });
      
      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    },
    
    toggleMenu() {
      this.isOpen ? this.close() : this.open();
    },
    
    open() {
      this.isOpen = true;
      this.menu.classList.add('mobile-menu--open');
      this.toggle.setAttribute('aria-expanded', 'true');
      this.overlay.style.opacity = '1';
      this.overlay.style.visibility = 'visible';
      document.body.style.overflow = 'hidden';
    },
    
    close() {
      this.isOpen = false;
      this.menu.classList.remove('mobile-menu--open');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.overlay.style.opacity = '0';
      this.overlay.style.visibility = 'hidden';
      document.body.style.overflow = '';
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  
  const SearchModal = {
    modal: null,
    toggle: null,
    input: null,
    isOpen: false,
    
    init() {
      this.toggle = document.querySelector('[data-search-toggle]');
      this.modal = document.querySelector('[data-search-modal]');
      
      if (!this.toggle) return;
      
      if (!this.modal) {
        this.createModal();
      }
      
      this.input = this.modal.querySelector('input');
      this.bindEvents();
    },
    
    createModal() {
      this.modal = document.createElement('div');
      this.modal.className = 'search-modal';
      this.modal.setAttribute('data-search-modal', '');
      this.modal.innerHTML = `
        <div class="search-modal__overlay" data-search-close></div>
        <div class="search-modal__content">
          <form action="/search" method="get" class="search-modal__form">
            <input type="search" 
                   name="q" 
                   placeholder="Search products..." 
                   class="search-modal__input"
                   autocomplete="off"
                   autocorrect="off"
                   autocapitalize="off"
                   spellcheck="false">
            <button type="submit" class="search-modal__submit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <button type="button" class="search-modal__close" data-search-close>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </form>
        </div>
      `;
      
      document.body.appendChild(this.modal);
      this.addModalStyles();
    },
    
    addModalStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .search-modal {
          position: fixed;
          inset: 0;
          z-index: 10000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .search-modal--open {
          opacity: 1;
          visibility: visible;
        }
        .search-modal__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
        }
        .search-modal__content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: var(--color-background);
          padding: 1.5rem;
          transform: translateY(-100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .search-modal--open .search-modal__content {
          transform: translateY(0);
        }
        .search-modal__form {
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .search-modal__input {
          flex: 1;
          padding: 1rem 0;
          font-size: 1.25rem;
          font-family: var(--font-body);
          border: none;
          border-bottom: 1px solid var(--color-border);
          background: transparent;
          outline: none;
        }
        .search-modal__input:focus {
          border-bottom-color: var(--color-foreground);
        }
        .search-modal__submit,
        .search-modal__close {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
        }
        .search-modal__submit svg,
        .search-modal__close svg {
          width: 24px;
          height: 24px;
        }
      `;
      document.head.appendChild(style);
    },
    
    bindEvents() {
      this.toggle.addEventListener('click', () => this.open());
      
      this.modal.querySelectorAll('[data-search-close]').forEach(el => {
        el.addEventListener('click', () => this.close());
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    },
    
    open() {
      this.isOpen = true;
      this.modal.classList.add('search-modal--open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => this.input.focus(), 300);
    },
    
    close() {
      this.isOpen = false;
      this.modal.classList.remove('search-modal--open');
      document.body.style.overflow = '';
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK ADD TO CART
  // ═══════════════════════════════════════════════════════════════════════════
  
  const QuickAdd = {
    init() {
      this.bindEvents();
    },
    
    bindEvents() {
      document.addEventListener('click', (e) => {
        const quickAddBtn = e.target.closest('[data-quick-add]');
        if (!quickAddBtn) return;
        
        e.preventDefault();
        const variantId = quickAddBtn.dataset.variantId;
        
        if (variantId) {
          this.addToCart(variantId, quickAddBtn);
        }
      });
    },
    
    async addToCart(variantId, button) {
      const originalText = button.textContent;
      button.textContent = 'Adding...';
      button.disabled = true;
      
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              id: variantId,
              quantity: 1
            }]
          })
        });
        
        if (response.ok) {
          button.textContent = 'Added!';
          
          // Update cart count
          const cartResponse = await fetch('/cart.js');
          const cart = await cartResponse.json();
          const cartCount = document.querySelector('[data-cart-count]');
          if (cartCount) {
            cartCount.textContent = cart.item_count;
          }
          
          // Open cart drawer
          if (typeof CartDrawer !== 'undefined') {
            CartDrawer.open();
          }
          
          setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
          }, 1500);
        } else {
          throw new Error('Failed to add to cart');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        button.textContent = 'Error';
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 1500);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS ON SCROLL
  // ═══════════════════════════════════════════════════════════════════════════
  
  const ScrollAnimations = {
    init() {
      if (!('IntersectionObserver' in window)) return;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE
  // ═══════════════════════════════════════════════════════════════════════════
  
  document.addEventListener('DOMContentLoaded', () => {
    Header.init();
    MobileMenu.init();
    SearchModal.init();
    QuickAdd.init();
    ScrollAnimations.init();
  });

})();
