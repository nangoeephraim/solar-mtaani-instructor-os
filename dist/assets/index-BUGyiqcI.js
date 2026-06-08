const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/web-C7y8pA3b.js","assets/index-B40g6gKq.js","assets/index-l2RTGEA9.js","assets/index-CbivJHeu.css"])))=>i.map(i=>d[i]);
import { _ as __vitePreload } from "./index-l2RTGEA9.js";
import { registerPlugin } from "./index-B40g6gKq.js";
var ImpactStyle;
(function(ImpactStyle2) {
  ImpactStyle2["Heavy"] = "HEAVY";
  ImpactStyle2["Medium"] = "MEDIUM";
  ImpactStyle2["Light"] = "LIGHT";
})(ImpactStyle || (ImpactStyle = {}));
var NotificationType;
(function(NotificationType2) {
  NotificationType2["Success"] = "SUCCESS";
  NotificationType2["Warning"] = "WARNING";
  NotificationType2["Error"] = "ERROR";
})(NotificationType || (NotificationType = {}));
const Haptics = registerPlugin("Haptics", {
  web: () => __vitePreload(() => import("./web-C7y8pA3b.js"), true ? __vite__mapDeps([0,1,2,3]) : void 0).then((m) => new m.HapticsWeb())
});
export {
  Haptics,
  ImpactStyle,
  NotificationType
};
