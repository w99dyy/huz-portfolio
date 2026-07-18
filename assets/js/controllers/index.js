import { Application } from "@hotwired/stimulus"
import TitleAnimeController from "./title_anime_controller"
import TextAnimController from "./text_anim_controller"
import WrapTextController from "./wrap_text_controller"
import LoaderController from "./loader_controller"

// Create the Stimulus application
const application = Application.start()
application.debug = false
window.Stimulus = application

// Register your controllers
application.register("title-anime", TitleAnimeController)
application.register("text-anim", TextAnimController)
application.register("wrap-text", WrapTextController)
application.register("loader", LoaderController)

// Export the application if needed elsewhere
export { application }
