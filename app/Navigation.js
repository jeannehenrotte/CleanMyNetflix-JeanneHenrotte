
/**
 * Navigation.js
 * Este archivo gestiona la navegación entre las secciones de la aplicación.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation de Swiper pour la navigation tactile et par boutons
    const mySwiper = new Swiper('.swiper', {
        direction: 'horizontal',
        loop: false,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        }
    });

    // Synchronisation des liens de navigation HTML avec les slides Swiper
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            mySwiper.slideTo(index);
        });
    });

    // 2. Implémentation du Drag and Drop avec Interact.js pour les favoris
    interact('.draggable-item').draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        listeners: {
            move(event) {
                let target = event.target;
                // Récupération des positions cumulées xpos et ypos
                let x = (parseFloat(target.getAttribute('xpos')) || 0) + event.delta.x;
                let y = (parseFloat(target.getAttribute('ypos')) || 0) + event.delta.y;

                // Application de la transformation CSS transform translate
                target.style.transform = `translate(${x}px, ${y}px)`;

                // Mise à jour des attributs de position
                target.setAttribute('xpos', x);
                target.setAttribute('ypos', y);
            }
        }
    });

    // 3. Animation supplémentaire avec AnimeJS (Micro-interaction sur le titre)
    anime({
        targets: '.anim-title',
        translateY: [-30, 0],
        opacity: [0, 1],
        duration: 1200,
        easing: 'easeOutExpo',
        delay: 300
    });
});