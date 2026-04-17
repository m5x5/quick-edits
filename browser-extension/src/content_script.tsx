import { initAutoReload } from "./content_script/autoReloader";
import { initPopup } from "./core/InspectView";
import { initDevToolbar } from "./core/DevToolbar/init";
import { initWebMCP } from "./content_script/webmcp";

initAutoReload();
initPopup();
initDevToolbar();
initWebMCP();
