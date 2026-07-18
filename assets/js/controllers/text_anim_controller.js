import { Controller } from "@hotwired/stimulus"
import { animate, scrambleText } from 'animejs';

export default class extends Controller {
  static targets = ["text"]
  originalText = ""

  connect() {
    this.originalText = this.textTarget.textContent.trim()

    setTimeout(() => {
      this.animateText()
    }, 200)
  }

  animateText() {
    const element = this.textTarget

    animate(element, {
      innerHTML: scrambleText({
        text: this.originalText,
        duration: 1800,
        easing: 'easeOutQuad'
      }),      
      complete: () => {
        element.textContent = this.originalText
      }
    });
  }
}
