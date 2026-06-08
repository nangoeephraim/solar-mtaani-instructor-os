const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/web-CPHx_Czv.js","assets/index-B40g6gKq.js"])))=>i.map(i=>d[i]);
import { _ as __vitePreload } from "./index-Dt5N_hgV.js";
import { registerPlugin } from "./index-B40g6gKq.js";
const App = registerPlugin("App", {
  web: () => __vitePreload(() => import("./web-CPHx_Czv.js"), true ? __vite__mapDeps([0,1]) : void 0).then((m) => new m.AppWeb())
});
export {
  App
};
