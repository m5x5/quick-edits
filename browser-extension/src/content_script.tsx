import { initAutoReload } from "./content_script/autoReloader";
import { initPopup } from "./core/InspectPopup";

initAutoReload();

window.onload = () => {
  console.log('DOMContentLoaded');
  initPopup();
};
