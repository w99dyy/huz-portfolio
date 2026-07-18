import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["wrapper"]
  static values = {
    duration: { type: Number, default: 1500 }
  }

  connect() {
    this.show
  }

  show() {
    this.wrapperTarget.classList.remove('hidden')
  }

  hide() {
    this.wrapperTarget.classList.add('fade-out')
    setTimeout(() => {
      this.wrapperTarget.style.display = 'none'
    }, 100)
  }
}
