import { Controller } from "@hotwired/stimulus"
import { animate, stagger, splitText } from 'animejs';

export default class extends Controller {
  static targets = ["wrapText"]
  
  connect() {
    
    setTimeout(() => {
      this.wrapText()
    }, 50)

  }

  wrapText() {
  const element = this.wrapTextTarget
    
  const { chars } = splitText(element, {
    chars: { wrap: true },
  });

  animate(chars, {
    y: ['75%', '0%'],
    duration: 150,
    ease: 'out(3)',
    delay: stagger(50),
    loop: false,
    alternate: true,
  });    
  }
}
