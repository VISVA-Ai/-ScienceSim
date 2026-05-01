/**
 * ScienceSim - Main JavaScript
 * Common utilities and navigation handling
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initScrollEffects();
});

/**
 * Mobile Navigation Toggle
 */
function initMobileNav() {
    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            toggle.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
    }
}

/**
 * Scroll Effects for Navbar
 */
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            } else {
                navbar.style.background = 'rgba(10, 10, 15, 0.8)';
            }
        });
    }
}

/**
 * Smooth scroll for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
