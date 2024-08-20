import { initAutoReload } from "./content_script/autoReloader";
import { initPopup } from "./core/InspectView";

initAutoReload();

window.onload = () => {
	console.log("DOMContentLoaded");
	initPopup();
};
