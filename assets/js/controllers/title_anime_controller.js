import { Controller } from "@hotwired/stimulus"
import { animate, stagger, splitText, createDraggable } from 'animejs';

export default class extends Controller {
  // This runs when the controller connects to the DOM
  connect() {
    // Wait for the next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      this.animateTitle()
    })
  }

  animateTitle() {
    // Find h2 elements inside this controller's element
    const elements = this.element.querySelectorAll('h1')
    
    if (elements.length === 0) {
      console.warn('No h1 elements found for title animation')
      return
    }

    // Split text into characters
    const { chars } = splitText(elements, { words: false, chars: true })

    // Animate!
    animate(chars, {
      y: [
        { to: '-2.75rem', ease: 'outExpo', duration: 600 },
        { to: 0, ease: 'outBounce', duration: 800, delay: 100 }
      ],
      rotate: {
        from: '-1turn',
        delay: 0
      },
      delay: stagger(50),
      ease: 'inOutCirc',
      loopDelay: 1000,
      loop: false
    })
  }
}
