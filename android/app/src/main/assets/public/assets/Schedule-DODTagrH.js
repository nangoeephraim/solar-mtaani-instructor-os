import { r as requireReactDom, a as reactExports, R as React, j as jsxRuntimeExports, c as clsx, u as useTheme, b as useAuth, d as useGoogleLogin, e as useToast, P as PageTransition, C as Calendar, S as Settings, f as RefreshCw, Z as Zap, g as ChevronRight, h as CircleCheck, U as Users, i as Sparkles, A as AnimatePresence, m as motion, k as CircleX, l as ArrowRight, M as Monitor, B as BookOpen } from "./index-CWZOk6sM.js";
import { u as useLocalStorage } from "./useLocalStorage-BEUeXsSo.js";
import { g as getStudentGroups, a as getDefaultLevel, b as getLevelShortLabel, c as getLevelsForGroup } from "./educationLevels-CWONNkiO.js";
import { notificationService } from "./notificationService-DzXbje6V.js";
import { P as Plus } from "./plus-CAiaV-Kd.js";
import { P as Printer } from "./printer-ZeAReXBq.js";
import { P as PenLine } from "./pen-line-wkvB9D2Z.js";
import { C as ChevronLeft } from "./chevron-left-DE9PL_6z.js";
import { T as Trash2 } from "./trash-2-BMugAsIw.js";
import { C as Check } from "./check-BbC8ELKL.js";
import { B as Bell } from "./bell-DPngBihw.js";
import { C as Copy } from "./copy-CRVhMwhJ.js";
var reactDomExports = requireReactDom();
const canUseDOM = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
function isWindow(element) {
  const elementString = Object.prototype.toString.call(element);
  return elementString === "[object Window]" || // In Electron context the Window object serializes to [object global]
  elementString === "[object global]";
}
function isNode(node) {
  return "nodeType" in node;
}
function getWindow(target) {
  var _target$ownerDocument, _target$ownerDocument2;
  if (!target) {
    return window;
  }
  if (isWindow(target)) {
    return target;
  }
  if (!isNode(target)) {
    return window;
  }
  return (_target$ownerDocument = (_target$ownerDocument2 = target.ownerDocument) == null ? void 0 : _target$ownerDocument2.defaultView) != null ? _target$ownerDocument : window;
}
function isDocument(node) {
  const {
    Document
  } = getWindow(node);
  return node instanceof Document;
}
function isHTMLElement(node) {
  if (isWindow(node)) {
    return false;
  }
  return node instanceof getWindow(node).HTMLElement;
}
function isSVGElement(node) {
  return node instanceof getWindow(node).SVGElement;
}
function getOwnerDocument(target) {
  if (!target) {
    return document;
  }
  if (isWindow(target)) {
    return target.document;
  }
  if (!isNode(target)) {
    return document;
  }
  if (isDocument(target)) {
    return target;
  }
  if (isHTMLElement(target) || isSVGElement(target)) {
    return target.ownerDocument;
  }
  return document;
}
const useIsomorphicLayoutEffect = canUseDOM ? reactExports.useLayoutEffect : reactExports.useEffect;
function useEvent(handler) {
  const handlerRef = reactExports.useRef(handler);
  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });
  return reactExports.useCallback(function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return handlerRef.current == null ? void 0 : handlerRef.current(...args);
  }, []);
}
function useInterval() {
  const intervalRef = reactExports.useRef(null);
  const set = reactExports.useCallback((listener, duration) => {
    intervalRef.current = setInterval(listener, duration);
  }, []);
  const clear = reactExports.useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  return [set, clear];
}
function useLatestValue(value, dependencies) {
  if (dependencies === void 0) {
    dependencies = [value];
  }
  const valueRef = reactExports.useRef(value);
  useIsomorphicLayoutEffect(() => {
    if (valueRef.current !== value) {
      valueRef.current = value;
    }
  }, dependencies);
  return valueRef;
}
function useLazyMemo(callback, dependencies) {
  const valueRef = reactExports.useRef();
  return reactExports.useMemo(
    () => {
      const newValue = callback(valueRef.current);
      valueRef.current = newValue;
      return newValue;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...dependencies]
  );
}
function useNodeRef(onChange) {
  const onChangeHandler = useEvent(onChange);
  const node = reactExports.useRef(null);
  const setNodeRef = reactExports.useCallback(
    (element) => {
      if (element !== node.current) {
        onChangeHandler == null ? void 0 : onChangeHandler(element, node.current);
      }
      node.current = element;
    },
    //eslint-disable-next-line
    []
  );
  return [node, setNodeRef];
}
function usePrevious(value) {
  const ref = reactExports.useRef();
  reactExports.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
let ids = {};
function useUniqueId(prefix, value) {
  return reactExports.useMemo(() => {
    if (value) {
      return value;
    }
    const id = ids[prefix] == null ? 0 : ids[prefix] + 1;
    ids[prefix] = id;
    return prefix + "-" + id;
  }, [prefix, value]);
}
function createAdjustmentFn(modifier) {
  return function(object) {
    for (var _len = arguments.length, adjustments = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      adjustments[_key - 1] = arguments[_key];
    }
    return adjustments.reduce((accumulator, adjustment) => {
      const entries = Object.entries(adjustment);
      for (const [key, valueAdjustment] of entries) {
        const value = accumulator[key];
        if (value != null) {
          accumulator[key] = value + modifier * valueAdjustment;
        }
      }
      return accumulator;
    }, {
      ...object
    });
  };
}
const add = /* @__PURE__ */ createAdjustmentFn(1);
const subtract = /* @__PURE__ */ createAdjustmentFn(-1);
function hasViewportRelativeCoordinates(event) {
  return "clientX" in event && "clientY" in event;
}
function isKeyboardEvent(event) {
  if (!event) {
    return false;
  }
  const {
    KeyboardEvent
  } = getWindow(event.target);
  return KeyboardEvent && event instanceof KeyboardEvent;
}
function isTouchEvent(event) {
  if (!event) {
    return false;
  }
  const {
    TouchEvent
  } = getWindow(event.target);
  return TouchEvent && event instanceof TouchEvent;
}
function getEventCoordinates(event) {
  if (isTouchEvent(event)) {
    if (event.touches && event.touches.length) {
      const {
        clientX: x,
        clientY: y
      } = event.touches[0];
      return {
        x,
        y
      };
    } else if (event.changedTouches && event.changedTouches.length) {
      const {
        clientX: x,
        clientY: y
      } = event.changedTouches[0];
      return {
        x,
        y
      };
    }
  }
  if (hasViewportRelativeCoordinates(event)) {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }
  return null;
}
const CSS = /* @__PURE__ */ Object.freeze({
  Translate: {
    toString(transform) {
      if (!transform) {
        return;
      }
      const {
        x,
        y
      } = transform;
      return "translate3d(" + (x ? Math.round(x) : 0) + "px, " + (y ? Math.round(y) : 0) + "px, 0)";
    }
  },
  Scale: {
    toString(transform) {
      if (!transform) {
        return;
      }
      const {
        scaleX,
        scaleY
      } = transform;
      return "scaleX(" + scaleX + ") scaleY(" + scaleY + ")";
    }
  },
  Transform: {
    toString(transform) {
      if (!transform) {
        return;
      }
      return [CSS.Translate.toString(transform), CSS.Scale.toString(transform)].join(" ");
    }
  },
  Transition: {
    toString(_ref) {
      let {
        property,
        duration,
        easing
      } = _ref;
      return property + " " + duration + "ms " + easing;
    }
  }
});
const SELECTOR = "a,frame,iframe,input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),*[tabindex]";
function findFirstFocusableNode(element) {
  if (element.matches(SELECTOR)) {
    return element;
  }
  return element.querySelector(SELECTOR);
}
const hiddenStyles = {
  display: "none"
};
function HiddenText(_ref) {
  let {
    id,
    value
  } = _ref;
  return React.createElement("div", {
    id,
    style: hiddenStyles
  }, value);
}
function LiveRegion(_ref) {
  let {
    id,
    announcement,
    ariaLiveType = "assertive"
  } = _ref;
  const visuallyHidden = {
    position: "fixed",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    margin: -1,
    border: 0,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(100%)",
    whiteSpace: "nowrap"
  };
  return React.createElement("div", {
    id,
    style: visuallyHidden,
    role: "status",
    "aria-live": ariaLiveType,
    "aria-atomic": true
  }, announcement);
}
function useAnnouncement() {
  const [announcement, setAnnouncement] = reactExports.useState("");
  const announce = reactExports.useCallback((value) => {
    if (value != null) {
      setAnnouncement(value);
    }
  }, []);
  return {
    announce,
    announcement
  };
}
const DndMonitorContext = /* @__PURE__ */ reactExports.createContext(null);
function useDndMonitor(listener) {
  const registerListener = reactExports.useContext(DndMonitorContext);
  reactExports.useEffect(() => {
    if (!registerListener) {
      throw new Error("useDndMonitor must be used within a children of <DndContext>");
    }
    const unsubscribe = registerListener(listener);
    return unsubscribe;
  }, [listener, registerListener]);
}
function useDndMonitorProvider() {
  const [listeners] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const registerListener = reactExports.useCallback((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [listeners]);
  const dispatch = reactExports.useCallback((_ref) => {
    let {
      type,
      event
    } = _ref;
    listeners.forEach((listener) => {
      var _listener$type;
      return (_listener$type = listener[type]) == null ? void 0 : _listener$type.call(listener, event);
    });
  }, [listeners]);
  return [dispatch, registerListener];
}
const defaultScreenReaderInstructions = {
  draggable: "\n    To pick up a draggable item, press the space bar.\n    While dragging, use the arrow keys to move the item.\n    Press space again to drop the item in its new position, or press escape to cancel.\n  "
};
const defaultAnnouncements = {
  onDragStart(_ref) {
    let {
      active
    } = _ref;
    return "Picked up draggable item " + active.id + ".";
  },
  onDragOver(_ref2) {
    let {
      active,
      over
    } = _ref2;
    if (over) {
      return "Draggable item " + active.id + " was moved over droppable area " + over.id + ".";
    }
    return "Draggable item " + active.id + " is no longer over a droppable area.";
  },
  onDragEnd(_ref3) {
    let {
      active,
      over
    } = _ref3;
    if (over) {
      return "Draggable item " + active.id + " was dropped over droppable area " + over.id;
    }
    return "Draggable item " + active.id + " was dropped.";
  },
  onDragCancel(_ref4) {
    let {
      active
    } = _ref4;
    return "Dragging was cancelled. Draggable item " + active.id + " was dropped.";
  }
};
function Accessibility(_ref) {
  let {
    announcements = defaultAnnouncements,
    container,
    hiddenTextDescribedById,
    screenReaderInstructions = defaultScreenReaderInstructions
  } = _ref;
  const {
    announce,
    announcement
  } = useAnnouncement();
  const liveRegionId = useUniqueId("DndLiveRegion");
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setMounted(true);
  }, []);
  useDndMonitor(reactExports.useMemo(() => ({
    onDragStart(_ref2) {
      let {
        active
      } = _ref2;
      announce(announcements.onDragStart({
        active
      }));
    },
    onDragMove(_ref3) {
      let {
        active,
        over
      } = _ref3;
      if (announcements.onDragMove) {
        announce(announcements.onDragMove({
          active,
          over
        }));
      }
    },
    onDragOver(_ref4) {
      let {
        active,
        over
      } = _ref4;
      announce(announcements.onDragOver({
        active,
        over
      }));
    },
    onDragEnd(_ref5) {
      let {
        active,
        over
      } = _ref5;
      announce(announcements.onDragEnd({
        active,
        over
      }));
    },
    onDragCancel(_ref6) {
      let {
        active,
        over
      } = _ref6;
      announce(announcements.onDragCancel({
        active,
        over
      }));
    }
  }), [announce, announcements]));
  if (!mounted) {
    return null;
  }
  const markup = React.createElement(React.Fragment, null, React.createElement(HiddenText, {
    id: hiddenTextDescribedById,
    value: screenReaderInstructions.draggable
  }), React.createElement(LiveRegion, {
    id: liveRegionId,
    announcement
  }));
  return container ? reactDomExports.createPortal(markup, container) : markup;
}
var Action;
(function(Action2) {
  Action2["DragStart"] = "dragStart";
  Action2["DragMove"] = "dragMove";
  Action2["DragEnd"] = "dragEnd";
  Action2["DragCancel"] = "dragCancel";
  Action2["DragOver"] = "dragOver";
  Action2["RegisterDroppable"] = "registerDroppable";
  Action2["SetDroppableDisabled"] = "setDroppableDisabled";
  Action2["UnregisterDroppable"] = "unregisterDroppable";
})(Action || (Action = {}));
function noop() {
}
function useSensor(sensor, options) {
  return reactExports.useMemo(
    () => ({
      sensor,
      options: options != null ? options : {}
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sensor, options]
  );
}
function useSensors() {
  for (var _len = arguments.length, sensors = new Array(_len), _key = 0; _key < _len; _key++) {
    sensors[_key] = arguments[_key];
  }
  return reactExports.useMemo(
    () => [...sensors].filter((sensor) => sensor != null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...sensors]
  );
}
const defaultCoordinates = /* @__PURE__ */ Object.freeze({
  x: 0,
  y: 0
});
function sortCollisionsDesc(_ref3, _ref4) {
  let {
    data: {
      value: a
    }
  } = _ref3;
  let {
    data: {
      value: b
    }
  } = _ref4;
  return b - a;
}
function getFirstCollision(collisions, property) {
  if (!collisions || collisions.length === 0) {
    return null;
  }
  const [firstCollision] = collisions;
  return firstCollision[property];
}
function getIntersectionRatio(entry, target) {
  const top = Math.max(target.top, entry.top);
  const left = Math.max(target.left, entry.left);
  const right = Math.min(target.left + target.width, entry.left + entry.width);
  const bottom = Math.min(target.top + target.height, entry.top + entry.height);
  const width = right - left;
  const height = bottom - top;
  if (left < right && top < bottom) {
    const targetArea = target.width * target.height;
    const entryArea = entry.width * entry.height;
    const intersectionArea = width * height;
    const intersectionRatio = intersectionArea / (targetArea + entryArea - intersectionArea);
    return Number(intersectionRatio.toFixed(4));
  }
  return 0;
}
const rectIntersection = (_ref) => {
  let {
    collisionRect,
    droppableRects,
    droppableContainers
  } = _ref;
  const collisions = [];
  for (const droppableContainer of droppableContainers) {
    const {
      id
    } = droppableContainer;
    const rect = droppableRects.get(id);
    if (rect) {
      const intersectionRatio = getIntersectionRatio(rect, collisionRect);
      if (intersectionRatio > 0) {
        collisions.push({
          id,
          data: {
            droppableContainer,
            value: intersectionRatio
          }
        });
      }
    }
  }
  return collisions.sort(sortCollisionsDesc);
};
function adjustScale(transform, rect1, rect2) {
  return {
    ...transform,
    scaleX: rect1 && rect2 ? rect1.width / rect2.width : 1,
    scaleY: rect1 && rect2 ? rect1.height / rect2.height : 1
  };
}
function getRectDelta(rect1, rect2) {
  return rect1 && rect2 ? {
    x: rect1.left - rect2.left,
    y: rect1.top - rect2.top
  } : defaultCoordinates;
}
function createRectAdjustmentFn(modifier) {
  return function adjustClientRect(rect) {
    for (var _len = arguments.length, adjustments = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      adjustments[_key - 1] = arguments[_key];
    }
    return adjustments.reduce((acc, adjustment) => ({
      ...acc,
      top: acc.top + modifier * adjustment.y,
      bottom: acc.bottom + modifier * adjustment.y,
      left: acc.left + modifier * adjustment.x,
      right: acc.right + modifier * adjustment.x
    }), {
      ...rect
    });
  };
}
const getAdjustedRect = /* @__PURE__ */ createRectAdjustmentFn(1);
function parseTransform(transform) {
  if (transform.startsWith("matrix3d(")) {
    const transformArray = transform.slice(9, -1).split(/, /);
    return {
      x: +transformArray[12],
      y: +transformArray[13],
      scaleX: +transformArray[0],
      scaleY: +transformArray[5]
    };
  } else if (transform.startsWith("matrix(")) {
    const transformArray = transform.slice(7, -1).split(/, /);
    return {
      x: +transformArray[4],
      y: +transformArray[5],
      scaleX: +transformArray[0],
      scaleY: +transformArray[3]
    };
  }
  return null;
}
function inverseTransform(rect, transform, transformOrigin) {
  const parsedTransform = parseTransform(transform);
  if (!parsedTransform) {
    return rect;
  }
  const {
    scaleX,
    scaleY,
    x: translateX,
    y: translateY
  } = parsedTransform;
  const x = rect.left - translateX - (1 - scaleX) * parseFloat(transformOrigin);
  const y = rect.top - translateY - (1 - scaleY) * parseFloat(transformOrigin.slice(transformOrigin.indexOf(" ") + 1));
  const w = scaleX ? rect.width / scaleX : rect.width;
  const h = scaleY ? rect.height / scaleY : rect.height;
  return {
    width: w,
    height: h,
    top: y,
    right: x + w,
    bottom: y + h,
    left: x
  };
}
const defaultOptions = {
  ignoreTransform: false
};
function getClientRect(element, options) {
  if (options === void 0) {
    options = defaultOptions;
  }
  let rect = element.getBoundingClientRect();
  if (options.ignoreTransform) {
    const {
      transform,
      transformOrigin
    } = getWindow(element).getComputedStyle(element);
    if (transform) {
      rect = inverseTransform(rect, transform, transformOrigin);
    }
  }
  const {
    top,
    left,
    width,
    height,
    bottom,
    right
  } = rect;
  return {
    top,
    left,
    width,
    height,
    bottom,
    right
  };
}
function getTransformAgnosticClientRect(element) {
  return getClientRect(element, {
    ignoreTransform: true
  });
}
function getWindowClientRect(element) {
  const width = element.innerWidth;
  const height = element.innerHeight;
  return {
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height
  };
}
function isFixed(node, computedStyle) {
  if (computedStyle === void 0) {
    computedStyle = getWindow(node).getComputedStyle(node);
  }
  return computedStyle.position === "fixed";
}
function isScrollable(element, computedStyle) {
  if (computedStyle === void 0) {
    computedStyle = getWindow(element).getComputedStyle(element);
  }
  const overflowRegex = /(auto|scroll|overlay)/;
  const properties2 = ["overflow", "overflowX", "overflowY"];
  return properties2.some((property) => {
    const value = computedStyle[property];
    return typeof value === "string" ? overflowRegex.test(value) : false;
  });
}
function getScrollableAncestors(element, limit) {
  const scrollParents = [];
  function findScrollableAncestors(node) {
    if (limit != null && scrollParents.length >= limit) {
      return scrollParents;
    }
    if (!node) {
      return scrollParents;
    }
    if (isDocument(node) && node.scrollingElement != null && !scrollParents.includes(node.scrollingElement)) {
      scrollParents.push(node.scrollingElement);
      return scrollParents;
    }
    if (!isHTMLElement(node) || isSVGElement(node)) {
      return scrollParents;
    }
    if (scrollParents.includes(node)) {
      return scrollParents;
    }
    const computedStyle = getWindow(element).getComputedStyle(node);
    if (node !== element) {
      if (isScrollable(node, computedStyle)) {
        scrollParents.push(node);
      }
    }
    if (isFixed(node, computedStyle)) {
      return scrollParents;
    }
    return findScrollableAncestors(node.parentNode);
  }
  if (!element) {
    return scrollParents;
  }
  return findScrollableAncestors(element);
}
function getFirstScrollableAncestor(node) {
  const [firstScrollableAncestor] = getScrollableAncestors(node, 1);
  return firstScrollableAncestor != null ? firstScrollableAncestor : null;
}
function getScrollableElement(element) {
  if (!canUseDOM || !element) {
    return null;
  }
  if (isWindow(element)) {
    return element;
  }
  if (!isNode(element)) {
    return null;
  }
  if (isDocument(element) || element === getOwnerDocument(element).scrollingElement) {
    return window;
  }
  if (isHTMLElement(element)) {
    return element;
  }
  return null;
}
function getScrollXCoordinate(element) {
  if (isWindow(element)) {
    return element.scrollX;
  }
  return element.scrollLeft;
}
function getScrollYCoordinate(element) {
  if (isWindow(element)) {
    return element.scrollY;
  }
  return element.scrollTop;
}
function getScrollCoordinates(element) {
  return {
    x: getScrollXCoordinate(element),
    y: getScrollYCoordinate(element)
  };
}
var Direction;
(function(Direction2) {
  Direction2[Direction2["Forward"] = 1] = "Forward";
  Direction2[Direction2["Backward"] = -1] = "Backward";
})(Direction || (Direction = {}));
function isDocumentScrollingElement(element) {
  if (!canUseDOM || !element) {
    return false;
  }
  return element === document.scrollingElement;
}
function getScrollPosition(scrollingContainer) {
  const minScroll = {
    x: 0,
    y: 0
  };
  const dimensions = isDocumentScrollingElement(scrollingContainer) ? {
    height: window.innerHeight,
    width: window.innerWidth
  } : {
    height: scrollingContainer.clientHeight,
    width: scrollingContainer.clientWidth
  };
  const maxScroll = {
    x: scrollingContainer.scrollWidth - dimensions.width,
    y: scrollingContainer.scrollHeight - dimensions.height
  };
  const isTop = scrollingContainer.scrollTop <= minScroll.y;
  const isLeft = scrollingContainer.scrollLeft <= minScroll.x;
  const isBottom = scrollingContainer.scrollTop >= maxScroll.y;
  const isRight = scrollingContainer.scrollLeft >= maxScroll.x;
  return {
    isTop,
    isLeft,
    isBottom,
    isRight,
    maxScroll,
    minScroll
  };
}
const defaultThreshold = {
  x: 0.2,
  y: 0.2
};
function getScrollDirectionAndSpeed(scrollContainer, scrollContainerRect, _ref, acceleration, thresholdPercentage) {
  let {
    top,
    left,
    right,
    bottom
  } = _ref;
  if (acceleration === void 0) {
    acceleration = 10;
  }
  if (thresholdPercentage === void 0) {
    thresholdPercentage = defaultThreshold;
  }
  const {
    isTop,
    isBottom,
    isLeft,
    isRight
  } = getScrollPosition(scrollContainer);
  const direction = {
    x: 0,
    y: 0
  };
  const speed = {
    x: 0,
    y: 0
  };
  const threshold = {
    height: scrollContainerRect.height * thresholdPercentage.y,
    width: scrollContainerRect.width * thresholdPercentage.x
  };
  if (!isTop && top <= scrollContainerRect.top + threshold.height) {
    direction.y = Direction.Backward;
    speed.y = acceleration * Math.abs((scrollContainerRect.top + threshold.height - top) / threshold.height);
  } else if (!isBottom && bottom >= scrollContainerRect.bottom - threshold.height) {
    direction.y = Direction.Forward;
    speed.y = acceleration * Math.abs((scrollContainerRect.bottom - threshold.height - bottom) / threshold.height);
  }
  if (!isRight && right >= scrollContainerRect.right - threshold.width) {
    direction.x = Direction.Forward;
    speed.x = acceleration * Math.abs((scrollContainerRect.right - threshold.width - right) / threshold.width);
  } else if (!isLeft && left <= scrollContainerRect.left + threshold.width) {
    direction.x = Direction.Backward;
    speed.x = acceleration * Math.abs((scrollContainerRect.left + threshold.width - left) / threshold.width);
  }
  return {
    direction,
    speed
  };
}
function getScrollElementRect(element) {
  if (element === document.scrollingElement) {
    const {
      innerWidth,
      innerHeight
    } = window;
    return {
      top: 0,
      left: 0,
      right: innerWidth,
      bottom: innerHeight,
      width: innerWidth,
      height: innerHeight
    };
  }
  const {
    top,
    left,
    right,
    bottom
  } = element.getBoundingClientRect();
  return {
    top,
    left,
    right,
    bottom,
    width: element.clientWidth,
    height: element.clientHeight
  };
}
function getScrollOffsets(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return add(acc, getScrollCoordinates(node));
  }, defaultCoordinates);
}
function getScrollXOffset(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return acc + getScrollXCoordinate(node);
  }, 0);
}
function getScrollYOffset(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return acc + getScrollYCoordinate(node);
  }, 0);
}
function scrollIntoViewIfNeeded(element, measure) {
  if (measure === void 0) {
    measure = getClientRect;
  }
  if (!element) {
    return;
  }
  const {
    top,
    left,
    bottom,
    right
  } = measure(element);
  const firstScrollableAncestor = getFirstScrollableAncestor(element);
  if (!firstScrollableAncestor) {
    return;
  }
  if (bottom <= 0 || right <= 0 || top >= window.innerHeight || left >= window.innerWidth) {
    element.scrollIntoView({
      block: "center",
      inline: "center"
    });
  }
}
const properties = [["x", ["left", "right"], getScrollXOffset], ["y", ["top", "bottom"], getScrollYOffset]];
class Rect {
  constructor(rect, element) {
    this.rect = void 0;
    this.width = void 0;
    this.height = void 0;
    this.top = void 0;
    this.bottom = void 0;
    this.right = void 0;
    this.left = void 0;
    const scrollableAncestors = getScrollableAncestors(element);
    const scrollOffsets = getScrollOffsets(scrollableAncestors);
    this.rect = {
      ...rect
    };
    this.width = rect.width;
    this.height = rect.height;
    for (const [axis, keys, getScrollOffset] of properties) {
      for (const key of keys) {
        Object.defineProperty(this, key, {
          get: () => {
            const currentOffsets = getScrollOffset(scrollableAncestors);
            const scrollOffsetsDeltla = scrollOffsets[axis] - currentOffsets;
            return this.rect[key] + scrollOffsetsDeltla;
          },
          enumerable: true
        });
      }
    }
    Object.defineProperty(this, "rect", {
      enumerable: false
    });
  }
}
class Listeners {
  constructor(target) {
    this.target = void 0;
    this.listeners = [];
    this.removeAll = () => {
      this.listeners.forEach((listener) => {
        var _this$target;
        return (_this$target = this.target) == null ? void 0 : _this$target.removeEventListener(...listener);
      });
    };
    this.target = target;
  }
  add(eventName, handler, options) {
    var _this$target2;
    (_this$target2 = this.target) == null ? void 0 : _this$target2.addEventListener(eventName, handler, options);
    this.listeners.push([eventName, handler, options]);
  }
}
function getEventListenerTarget(target) {
  const {
    EventTarget
  } = getWindow(target);
  return target instanceof EventTarget ? target : getOwnerDocument(target);
}
function hasExceededDistance(delta, measurement) {
  const dx = Math.abs(delta.x);
  const dy = Math.abs(delta.y);
  if (typeof measurement === "number") {
    return Math.sqrt(dx ** 2 + dy ** 2) > measurement;
  }
  if ("x" in measurement && "y" in measurement) {
    return dx > measurement.x && dy > measurement.y;
  }
  if ("x" in measurement) {
    return dx > measurement.x;
  }
  if ("y" in measurement) {
    return dy > measurement.y;
  }
  return false;
}
var EventName;
(function(EventName2) {
  EventName2["Click"] = "click";
  EventName2["DragStart"] = "dragstart";
  EventName2["Keydown"] = "keydown";
  EventName2["ContextMenu"] = "contextmenu";
  EventName2["Resize"] = "resize";
  EventName2["SelectionChange"] = "selectionchange";
  EventName2["VisibilityChange"] = "visibilitychange";
})(EventName || (EventName = {}));
function preventDefault(event) {
  event.preventDefault();
}
function stopPropagation(event) {
  event.stopPropagation();
}
var KeyboardCode;
(function(KeyboardCode2) {
  KeyboardCode2["Space"] = "Space";
  KeyboardCode2["Down"] = "ArrowDown";
  KeyboardCode2["Right"] = "ArrowRight";
  KeyboardCode2["Left"] = "ArrowLeft";
  KeyboardCode2["Up"] = "ArrowUp";
  KeyboardCode2["Esc"] = "Escape";
  KeyboardCode2["Enter"] = "Enter";
  KeyboardCode2["Tab"] = "Tab";
})(KeyboardCode || (KeyboardCode = {}));
const defaultKeyboardCodes = {
  start: [KeyboardCode.Space, KeyboardCode.Enter],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab]
};
const defaultKeyboardCoordinateGetter = (event, _ref) => {
  let {
    currentCoordinates
  } = _ref;
  switch (event.code) {
    case KeyboardCode.Right:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x + 25
      };
    case KeyboardCode.Left:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x - 25
      };
    case KeyboardCode.Down:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y + 25
      };
    case KeyboardCode.Up:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y - 25
      };
  }
  return void 0;
};
class KeyboardSensor {
  constructor(props) {
    this.props = void 0;
    this.autoScrollEnabled = false;
    this.referenceCoordinates = void 0;
    this.listeners = void 0;
    this.windowListeners = void 0;
    this.props = props;
    const {
      event: {
        target
      }
    } = props;
    this.props = props;
    this.listeners = new Listeners(getOwnerDocument(target));
    this.windowListeners = new Listeners(getWindow(target));
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.attach();
  }
  attach() {
    this.handleStart();
    this.windowListeners.add(EventName.Resize, this.handleCancel);
    this.windowListeners.add(EventName.VisibilityChange, this.handleCancel);
    setTimeout(() => this.listeners.add(EventName.Keydown, this.handleKeyDown));
  }
  handleStart() {
    const {
      activeNode,
      onStart
    } = this.props;
    const node = activeNode.node.current;
    if (node) {
      scrollIntoViewIfNeeded(node);
    }
    onStart(defaultCoordinates);
  }
  handleKeyDown(event) {
    if (isKeyboardEvent(event)) {
      const {
        active,
        context,
        options
      } = this.props;
      const {
        keyboardCodes = defaultKeyboardCodes,
        coordinateGetter = defaultKeyboardCoordinateGetter,
        scrollBehavior = "smooth"
      } = options;
      const {
        code
      } = event;
      if (keyboardCodes.end.includes(code)) {
        this.handleEnd(event);
        return;
      }
      if (keyboardCodes.cancel.includes(code)) {
        this.handleCancel(event);
        return;
      }
      const {
        collisionRect
      } = context.current;
      const currentCoordinates = collisionRect ? {
        x: collisionRect.left,
        y: collisionRect.top
      } : defaultCoordinates;
      if (!this.referenceCoordinates) {
        this.referenceCoordinates = currentCoordinates;
      }
      const newCoordinates = coordinateGetter(event, {
        active,
        context: context.current,
        currentCoordinates
      });
      if (newCoordinates) {
        const coordinatesDelta = subtract(newCoordinates, currentCoordinates);
        const scrollDelta = {
          x: 0,
          y: 0
        };
        const {
          scrollableAncestors
        } = context.current;
        for (const scrollContainer of scrollableAncestors) {
          const direction = event.code;
          const {
            isTop,
            isRight,
            isLeft,
            isBottom,
            maxScroll,
            minScroll
          } = getScrollPosition(scrollContainer);
          const scrollElementRect = getScrollElementRect(scrollContainer);
          const clampedCoordinates = {
            x: Math.min(direction === KeyboardCode.Right ? scrollElementRect.right - scrollElementRect.width / 2 : scrollElementRect.right, Math.max(direction === KeyboardCode.Right ? scrollElementRect.left : scrollElementRect.left + scrollElementRect.width / 2, newCoordinates.x)),
            y: Math.min(direction === KeyboardCode.Down ? scrollElementRect.bottom - scrollElementRect.height / 2 : scrollElementRect.bottom, Math.max(direction === KeyboardCode.Down ? scrollElementRect.top : scrollElementRect.top + scrollElementRect.height / 2, newCoordinates.y))
          };
          const canScrollX = direction === KeyboardCode.Right && !isRight || direction === KeyboardCode.Left && !isLeft;
          const canScrollY = direction === KeyboardCode.Down && !isBottom || direction === KeyboardCode.Up && !isTop;
          if (canScrollX && clampedCoordinates.x !== newCoordinates.x) {
            const newScrollCoordinates = scrollContainer.scrollLeft + coordinatesDelta.x;
            const canScrollToNewCoordinates = direction === KeyboardCode.Right && newScrollCoordinates <= maxScroll.x || direction === KeyboardCode.Left && newScrollCoordinates >= minScroll.x;
            if (canScrollToNewCoordinates && !coordinatesDelta.y) {
              scrollContainer.scrollTo({
                left: newScrollCoordinates,
                behavior: scrollBehavior
              });
              return;
            }
            if (canScrollToNewCoordinates) {
              scrollDelta.x = scrollContainer.scrollLeft - newScrollCoordinates;
            } else {
              scrollDelta.x = direction === KeyboardCode.Right ? scrollContainer.scrollLeft - maxScroll.x : scrollContainer.scrollLeft - minScroll.x;
            }
            if (scrollDelta.x) {
              scrollContainer.scrollBy({
                left: -scrollDelta.x,
                behavior: scrollBehavior
              });
            }
            break;
          } else if (canScrollY && clampedCoordinates.y !== newCoordinates.y) {
            const newScrollCoordinates = scrollContainer.scrollTop + coordinatesDelta.y;
            const canScrollToNewCoordinates = direction === KeyboardCode.Down && newScrollCoordinates <= maxScroll.y || direction === KeyboardCode.Up && newScrollCoordinates >= minScroll.y;
            if (canScrollToNewCoordinates && !coordinatesDelta.x) {
              scrollContainer.scrollTo({
                top: newScrollCoordinates,
                behavior: scrollBehavior
              });
              return;
            }
            if (canScrollToNewCoordinates) {
              scrollDelta.y = scrollContainer.scrollTop - newScrollCoordinates;
            } else {
              scrollDelta.y = direction === KeyboardCode.Down ? scrollContainer.scrollTop - maxScroll.y : scrollContainer.scrollTop - minScroll.y;
            }
            if (scrollDelta.y) {
              scrollContainer.scrollBy({
                top: -scrollDelta.y,
                behavior: scrollBehavior
              });
            }
            break;
          }
        }
        this.handleMove(event, add(subtract(newCoordinates, this.referenceCoordinates), scrollDelta));
      }
    }
  }
  handleMove(event, coordinates) {
    const {
      onMove
    } = this.props;
    event.preventDefault();
    onMove(coordinates);
  }
  handleEnd(event) {
    const {
      onEnd
    } = this.props;
    event.preventDefault();
    this.detach();
    onEnd();
  }
  handleCancel(event) {
    const {
      onCancel
    } = this.props;
    event.preventDefault();
    this.detach();
    onCancel();
  }
  detach() {
    this.listeners.removeAll();
    this.windowListeners.removeAll();
  }
}
KeyboardSensor.activators = [{
  eventName: "onKeyDown",
  handler: (event, _ref, _ref2) => {
    let {
      keyboardCodes = defaultKeyboardCodes,
      onActivation
    } = _ref;
    let {
      active
    } = _ref2;
    const {
      code
    } = event.nativeEvent;
    if (keyboardCodes.start.includes(code)) {
      const activator = active.activatorNode.current;
      if (activator && event.target !== activator) {
        return false;
      }
      event.preventDefault();
      onActivation == null ? void 0 : onActivation({
        event: event.nativeEvent
      });
      return true;
    }
    return false;
  }
}];
function isDistanceConstraint(constraint) {
  return Boolean(constraint && "distance" in constraint);
}
function isDelayConstraint(constraint) {
  return Boolean(constraint && "delay" in constraint);
}
class AbstractPointerSensor {
  constructor(props, events2, listenerTarget) {
    var _getEventCoordinates;
    if (listenerTarget === void 0) {
      listenerTarget = getEventListenerTarget(props.event.target);
    }
    this.props = void 0;
    this.events = void 0;
    this.autoScrollEnabled = true;
    this.document = void 0;
    this.activated = false;
    this.initialCoordinates = void 0;
    this.timeoutId = null;
    this.listeners = void 0;
    this.documentListeners = void 0;
    this.windowListeners = void 0;
    this.props = props;
    this.events = events2;
    const {
      event
    } = props;
    const {
      target
    } = event;
    this.props = props;
    this.events = events2;
    this.document = getOwnerDocument(target);
    this.documentListeners = new Listeners(this.document);
    this.listeners = new Listeners(listenerTarget);
    this.windowListeners = new Listeners(getWindow(target));
    this.initialCoordinates = (_getEventCoordinates = getEventCoordinates(event)) != null ? _getEventCoordinates : defaultCoordinates;
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.removeTextSelection = this.removeTextSelection.bind(this);
    this.attach();
  }
  attach() {
    const {
      events: events2,
      props: {
        options: {
          activationConstraint,
          bypassActivationConstraint
        }
      }
    } = this;
    this.listeners.add(events2.move.name, this.handleMove, {
      passive: false
    });
    this.listeners.add(events2.end.name, this.handleEnd);
    if (events2.cancel) {
      this.listeners.add(events2.cancel.name, this.handleCancel);
    }
    this.windowListeners.add(EventName.Resize, this.handleCancel);
    this.windowListeners.add(EventName.DragStart, preventDefault);
    this.windowListeners.add(EventName.VisibilityChange, this.handleCancel);
    this.windowListeners.add(EventName.ContextMenu, preventDefault);
    this.documentListeners.add(EventName.Keydown, this.handleKeydown);
    if (activationConstraint) {
      if (bypassActivationConstraint != null && bypassActivationConstraint({
        event: this.props.event,
        activeNode: this.props.activeNode,
        options: this.props.options
      })) {
        return this.handleStart();
      }
      if (isDelayConstraint(activationConstraint)) {
        this.timeoutId = setTimeout(this.handleStart, activationConstraint.delay);
        this.handlePending(activationConstraint);
        return;
      }
      if (isDistanceConstraint(activationConstraint)) {
        this.handlePending(activationConstraint);
        return;
      }
    }
    this.handleStart();
  }
  detach() {
    this.listeners.removeAll();
    this.windowListeners.removeAll();
    setTimeout(this.documentListeners.removeAll, 50);
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  handlePending(constraint, offset) {
    const {
      active,
      onPending
    } = this.props;
    onPending(active, constraint, this.initialCoordinates, offset);
  }
  handleStart() {
    const {
      initialCoordinates
    } = this;
    const {
      onStart
    } = this.props;
    if (initialCoordinates) {
      this.activated = true;
      this.documentListeners.add(EventName.Click, stopPropagation, {
        capture: true
      });
      this.removeTextSelection();
      this.documentListeners.add(EventName.SelectionChange, this.removeTextSelection);
      onStart(initialCoordinates);
    }
  }
  handleMove(event) {
    var _getEventCoordinates2;
    const {
      activated,
      initialCoordinates,
      props
    } = this;
    const {
      onMove,
      options: {
        activationConstraint
      }
    } = props;
    if (!initialCoordinates) {
      return;
    }
    const coordinates = (_getEventCoordinates2 = getEventCoordinates(event)) != null ? _getEventCoordinates2 : defaultCoordinates;
    const delta = subtract(initialCoordinates, coordinates);
    if (!activated && activationConstraint) {
      if (isDistanceConstraint(activationConstraint)) {
        if (activationConstraint.tolerance != null && hasExceededDistance(delta, activationConstraint.tolerance)) {
          return this.handleCancel();
        }
        if (hasExceededDistance(delta, activationConstraint.distance)) {
          return this.handleStart();
        }
      }
      if (isDelayConstraint(activationConstraint)) {
        if (hasExceededDistance(delta, activationConstraint.tolerance)) {
          return this.handleCancel();
        }
      }
      this.handlePending(activationConstraint, delta);
      return;
    }
    if (event.cancelable) {
      event.preventDefault();
    }
    onMove(coordinates);
  }
  handleEnd() {
    const {
      onAbort,
      onEnd
    } = this.props;
    this.detach();
    if (!this.activated) {
      onAbort(this.props.active);
    }
    onEnd();
  }
  handleCancel() {
    const {
      onAbort,
      onCancel
    } = this.props;
    this.detach();
    if (!this.activated) {
      onAbort(this.props.active);
    }
    onCancel();
  }
  handleKeydown(event) {
    if (event.code === KeyboardCode.Esc) {
      this.handleCancel();
    }
  }
  removeTextSelection() {
    var _this$document$getSel;
    (_this$document$getSel = this.document.getSelection()) == null ? void 0 : _this$document$getSel.removeAllRanges();
  }
}
const events = {
  cancel: {
    name: "pointercancel"
  },
  move: {
    name: "pointermove"
  },
  end: {
    name: "pointerup"
  }
};
class PointerSensor extends AbstractPointerSensor {
  constructor(props) {
    const {
      event
    } = props;
    const listenerTarget = getOwnerDocument(event.target);
    super(props, events, listenerTarget);
  }
}
PointerSensor.activators = [{
  eventName: "onPointerDown",
  handler: (_ref, _ref2) => {
    let {
      nativeEvent: event
    } = _ref;
    let {
      onActivation
    } = _ref2;
    if (!event.isPrimary || event.button !== 0) {
      return false;
    }
    onActivation == null ? void 0 : onActivation({
      event
    });
    return true;
  }
}];
const events$1 = {
  move: {
    name: "mousemove"
  },
  end: {
    name: "mouseup"
  }
};
var MouseButton;
(function(MouseButton2) {
  MouseButton2[MouseButton2["RightClick"] = 2] = "RightClick";
})(MouseButton || (MouseButton = {}));
class MouseSensor extends AbstractPointerSensor {
  constructor(props) {
    super(props, events$1, getOwnerDocument(props.event.target));
  }
}
MouseSensor.activators = [{
  eventName: "onMouseDown",
  handler: (_ref, _ref2) => {
    let {
      nativeEvent: event
    } = _ref;
    let {
      onActivation
    } = _ref2;
    if (event.button === MouseButton.RightClick) {
      return false;
    }
    onActivation == null ? void 0 : onActivation({
      event
    });
    return true;
  }
}];
const events$2 = {
  cancel: {
    name: "touchcancel"
  },
  move: {
    name: "touchmove"
  },
  end: {
    name: "touchend"
  }
};
class TouchSensor extends AbstractPointerSensor {
  constructor(props) {
    super(props, events$2);
  }
  static setup() {
    window.addEventListener(events$2.move.name, noop2, {
      capture: false,
      passive: false
    });
    return function teardown() {
      window.removeEventListener(events$2.move.name, noop2);
    };
    function noop2() {
    }
  }
}
TouchSensor.activators = [{
  eventName: "onTouchStart",
  handler: (_ref, _ref2) => {
    let {
      nativeEvent: event
    } = _ref;
    let {
      onActivation
    } = _ref2;
    const {
      touches
    } = event;
    if (touches.length > 1) {
      return false;
    }
    onActivation == null ? void 0 : onActivation({
      event
    });
    return true;
  }
}];
var AutoScrollActivator;
(function(AutoScrollActivator2) {
  AutoScrollActivator2[AutoScrollActivator2["Pointer"] = 0] = "Pointer";
  AutoScrollActivator2[AutoScrollActivator2["DraggableRect"] = 1] = "DraggableRect";
})(AutoScrollActivator || (AutoScrollActivator = {}));
var TraversalOrder;
(function(TraversalOrder2) {
  TraversalOrder2[TraversalOrder2["TreeOrder"] = 0] = "TreeOrder";
  TraversalOrder2[TraversalOrder2["ReversedTreeOrder"] = 1] = "ReversedTreeOrder";
})(TraversalOrder || (TraversalOrder = {}));
function useAutoScroller(_ref) {
  let {
    acceleration,
    activator = AutoScrollActivator.Pointer,
    canScroll,
    draggingRect,
    enabled,
    interval = 5,
    order = TraversalOrder.TreeOrder,
    pointerCoordinates,
    scrollableAncestors,
    scrollableAncestorRects,
    delta,
    threshold
  } = _ref;
  const scrollIntent = useScrollIntent({
    delta,
    disabled: !enabled
  });
  const [setAutoScrollInterval, clearAutoScrollInterval] = useInterval();
  const scrollSpeed = reactExports.useRef({
    x: 0,
    y: 0
  });
  const scrollDirection = reactExports.useRef({
    x: 0,
    y: 0
  });
  const rect = reactExports.useMemo(() => {
    switch (activator) {
      case AutoScrollActivator.Pointer:
        return pointerCoordinates ? {
          top: pointerCoordinates.y,
          bottom: pointerCoordinates.y,
          left: pointerCoordinates.x,
          right: pointerCoordinates.x
        } : null;
      case AutoScrollActivator.DraggableRect:
        return draggingRect;
    }
  }, [activator, draggingRect, pointerCoordinates]);
  const scrollContainerRef = reactExports.useRef(null);
  const autoScroll = reactExports.useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }
    const scrollLeft = scrollSpeed.current.x * scrollDirection.current.x;
    const scrollTop = scrollSpeed.current.y * scrollDirection.current.y;
    scrollContainer.scrollBy(scrollLeft, scrollTop);
  }, []);
  const sortedScrollableAncestors = reactExports.useMemo(() => order === TraversalOrder.TreeOrder ? [...scrollableAncestors].reverse() : scrollableAncestors, [order, scrollableAncestors]);
  reactExports.useEffect(
    () => {
      if (!enabled || !scrollableAncestors.length || !rect) {
        clearAutoScrollInterval();
        return;
      }
      for (const scrollContainer of sortedScrollableAncestors) {
        if ((canScroll == null ? void 0 : canScroll(scrollContainer)) === false) {
          continue;
        }
        const index = scrollableAncestors.indexOf(scrollContainer);
        const scrollContainerRect = scrollableAncestorRects[index];
        if (!scrollContainerRect) {
          continue;
        }
        const {
          direction,
          speed
        } = getScrollDirectionAndSpeed(scrollContainer, scrollContainerRect, rect, acceleration, threshold);
        for (const axis of ["x", "y"]) {
          if (!scrollIntent[axis][direction[axis]]) {
            speed[axis] = 0;
            direction[axis] = 0;
          }
        }
        if (speed.x > 0 || speed.y > 0) {
          clearAutoScrollInterval();
          scrollContainerRef.current = scrollContainer;
          setAutoScrollInterval(autoScroll, interval);
          scrollSpeed.current = speed;
          scrollDirection.current = direction;
          return;
        }
      }
      scrollSpeed.current = {
        x: 0,
        y: 0
      };
      scrollDirection.current = {
        x: 0,
        y: 0
      };
      clearAutoScrollInterval();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      acceleration,
      autoScroll,
      canScroll,
      clearAutoScrollInterval,
      enabled,
      interval,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(rect),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(scrollIntent),
      setAutoScrollInterval,
      scrollableAncestors,
      sortedScrollableAncestors,
      scrollableAncestorRects,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(threshold)
    ]
  );
}
const defaultScrollIntent = {
  x: {
    [Direction.Backward]: false,
    [Direction.Forward]: false
  },
  y: {
    [Direction.Backward]: false,
    [Direction.Forward]: false
  }
};
function useScrollIntent(_ref2) {
  let {
    delta,
    disabled
  } = _ref2;
  const previousDelta = usePrevious(delta);
  return useLazyMemo((previousIntent) => {
    if (disabled || !previousDelta || !previousIntent) {
      return defaultScrollIntent;
    }
    const direction = {
      x: Math.sign(delta.x - previousDelta.x),
      y: Math.sign(delta.y - previousDelta.y)
    };
    return {
      x: {
        [Direction.Backward]: previousIntent.x[Direction.Backward] || direction.x === -1,
        [Direction.Forward]: previousIntent.x[Direction.Forward] || direction.x === 1
      },
      y: {
        [Direction.Backward]: previousIntent.y[Direction.Backward] || direction.y === -1,
        [Direction.Forward]: previousIntent.y[Direction.Forward] || direction.y === 1
      }
    };
  }, [disabled, delta, previousDelta]);
}
function useCachedNode(draggableNodes, id) {
  const draggableNode = id != null ? draggableNodes.get(id) : void 0;
  const node = draggableNode ? draggableNode.node.current : null;
  return useLazyMemo((cachedNode) => {
    var _ref;
    if (id == null) {
      return null;
    }
    return (_ref = node != null ? node : cachedNode) != null ? _ref : null;
  }, [node, id]);
}
function useCombineActivators(sensors, getSyntheticHandler) {
  return reactExports.useMemo(() => sensors.reduce((accumulator, sensor) => {
    const {
      sensor: Sensor
    } = sensor;
    const sensorActivators = Sensor.activators.map((activator) => ({
      eventName: activator.eventName,
      handler: getSyntheticHandler(activator.handler, sensor)
    }));
    return [...accumulator, ...sensorActivators];
  }, []), [sensors, getSyntheticHandler]);
}
var MeasuringStrategy;
(function(MeasuringStrategy2) {
  MeasuringStrategy2[MeasuringStrategy2["Always"] = 0] = "Always";
  MeasuringStrategy2[MeasuringStrategy2["BeforeDragging"] = 1] = "BeforeDragging";
  MeasuringStrategy2[MeasuringStrategy2["WhileDragging"] = 2] = "WhileDragging";
})(MeasuringStrategy || (MeasuringStrategy = {}));
var MeasuringFrequency;
(function(MeasuringFrequency2) {
  MeasuringFrequency2["Optimized"] = "optimized";
})(MeasuringFrequency || (MeasuringFrequency = {}));
const defaultValue = /* @__PURE__ */ new Map();
function useDroppableMeasuring(containers, _ref) {
  let {
    dragging,
    dependencies,
    config
  } = _ref;
  const [queue, setQueue] = reactExports.useState(null);
  const {
    frequency,
    measure,
    strategy
  } = config;
  const containersRef = reactExports.useRef(containers);
  const disabled = isDisabled();
  const disabledRef = useLatestValue(disabled);
  const measureDroppableContainers = reactExports.useCallback(function(ids2) {
    if (ids2 === void 0) {
      ids2 = [];
    }
    if (disabledRef.current) {
      return;
    }
    setQueue((value) => {
      if (value === null) {
        return ids2;
      }
      return value.concat(ids2.filter((id) => !value.includes(id)));
    });
  }, [disabledRef]);
  const timeoutId = reactExports.useRef(null);
  const droppableRects = useLazyMemo((previousValue) => {
    if (disabled && !dragging) {
      return defaultValue;
    }
    if (!previousValue || previousValue === defaultValue || containersRef.current !== containers || queue != null) {
      const map = /* @__PURE__ */ new Map();
      for (let container of containers) {
        if (!container) {
          continue;
        }
        if (queue && queue.length > 0 && !queue.includes(container.id) && container.rect.current) {
          map.set(container.id, container.rect.current);
          continue;
        }
        const node = container.node.current;
        const rect = node ? new Rect(measure(node), node) : null;
        container.rect.current = rect;
        if (rect) {
          map.set(container.id, rect);
        }
      }
      return map;
    }
    return previousValue;
  }, [containers, queue, dragging, disabled, measure]);
  reactExports.useEffect(() => {
    containersRef.current = containers;
  }, [containers]);
  reactExports.useEffect(
    () => {
      if (disabled) {
        return;
      }
      measureDroppableContainers();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragging, disabled]
  );
  reactExports.useEffect(
    () => {
      if (queue && queue.length > 0) {
        setQueue(null);
      }
    },
    //eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(queue)]
  );
  reactExports.useEffect(
    () => {
      if (disabled || typeof frequency !== "number" || timeoutId.current !== null) {
        return;
      }
      timeoutId.current = setTimeout(() => {
        measureDroppableContainers();
        timeoutId.current = null;
      }, frequency);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frequency, disabled, measureDroppableContainers, ...dependencies]
  );
  return {
    droppableRects,
    measureDroppableContainers,
    measuringScheduled: queue != null
  };
  function isDisabled() {
    switch (strategy) {
      case MeasuringStrategy.Always:
        return false;
      case MeasuringStrategy.BeforeDragging:
        return dragging;
      default:
        return !dragging;
    }
  }
}
function useInitialValue(value, computeFn) {
  return useLazyMemo((previousValue) => {
    if (!value) {
      return null;
    }
    if (previousValue) {
      return previousValue;
    }
    return typeof computeFn === "function" ? computeFn(value) : value;
  }, [computeFn, value]);
}
function useInitialRect(node, measure) {
  return useInitialValue(node, measure);
}
function useMutationObserver(_ref) {
  let {
    callback,
    disabled
  } = _ref;
  const handleMutations = useEvent(callback);
  const mutationObserver = reactExports.useMemo(() => {
    if (disabled || typeof window === "undefined" || typeof window.MutationObserver === "undefined") {
      return void 0;
    }
    const {
      MutationObserver
    } = window;
    return new MutationObserver(handleMutations);
  }, [handleMutations, disabled]);
  reactExports.useEffect(() => {
    return () => mutationObserver == null ? void 0 : mutationObserver.disconnect();
  }, [mutationObserver]);
  return mutationObserver;
}
function useResizeObserver(_ref) {
  let {
    callback,
    disabled
  } = _ref;
  const handleResize = useEvent(callback);
  const resizeObserver = reactExports.useMemo(
    () => {
      if (disabled || typeof window === "undefined" || typeof window.ResizeObserver === "undefined") {
        return void 0;
      }
      const {
        ResizeObserver
      } = window;
      return new ResizeObserver(handleResize);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled]
  );
  reactExports.useEffect(() => {
    return () => resizeObserver == null ? void 0 : resizeObserver.disconnect();
  }, [resizeObserver]);
  return resizeObserver;
}
function defaultMeasure(element) {
  return new Rect(getClientRect(element), element);
}
function useRect(element, measure, fallbackRect) {
  if (measure === void 0) {
    measure = defaultMeasure;
  }
  const [rect, setRect] = reactExports.useState(null);
  function measureRect() {
    setRect((currentRect) => {
      if (!element) {
        return null;
      }
      if (element.isConnected === false) {
        var _ref;
        return (_ref = currentRect != null ? currentRect : fallbackRect) != null ? _ref : null;
      }
      const newRect = measure(element);
      if (JSON.stringify(currentRect) === JSON.stringify(newRect)) {
        return currentRect;
      }
      return newRect;
    });
  }
  const mutationObserver = useMutationObserver({
    callback(records) {
      if (!element) {
        return;
      }
      for (const record of records) {
        const {
          type,
          target
        } = record;
        if (type === "childList" && target instanceof HTMLElement && target.contains(element)) {
          measureRect();
          break;
        }
      }
    }
  });
  const resizeObserver = useResizeObserver({
    callback: measureRect
  });
  useIsomorphicLayoutEffect(() => {
    measureRect();
    if (element) {
      resizeObserver == null ? void 0 : resizeObserver.observe(element);
      mutationObserver == null ? void 0 : mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      resizeObserver == null ? void 0 : resizeObserver.disconnect();
      mutationObserver == null ? void 0 : mutationObserver.disconnect();
    }
  }, [element]);
  return rect;
}
function useRectDelta(rect) {
  const initialRect = useInitialValue(rect);
  return getRectDelta(rect, initialRect);
}
const defaultValue$1 = [];
function useScrollableAncestors(node) {
  const previousNode = reactExports.useRef(node);
  const ancestors = useLazyMemo((previousValue) => {
    if (!node) {
      return defaultValue$1;
    }
    if (previousValue && previousValue !== defaultValue$1 && node && previousNode.current && node.parentNode === previousNode.current.parentNode) {
      return previousValue;
    }
    return getScrollableAncestors(node);
  }, [node]);
  reactExports.useEffect(() => {
    previousNode.current = node;
  }, [node]);
  return ancestors;
}
function useScrollOffsets(elements) {
  const [scrollCoordinates, setScrollCoordinates] = reactExports.useState(null);
  const prevElements = reactExports.useRef(elements);
  const handleScroll = reactExports.useCallback((event) => {
    const scrollingElement = getScrollableElement(event.target);
    if (!scrollingElement) {
      return;
    }
    setScrollCoordinates((scrollCoordinates2) => {
      if (!scrollCoordinates2) {
        return null;
      }
      scrollCoordinates2.set(scrollingElement, getScrollCoordinates(scrollingElement));
      return new Map(scrollCoordinates2);
    });
  }, []);
  reactExports.useEffect(() => {
    const previousElements = prevElements.current;
    if (elements !== previousElements) {
      cleanup(previousElements);
      const entries = elements.map((element) => {
        const scrollableElement = getScrollableElement(element);
        if (scrollableElement) {
          scrollableElement.addEventListener("scroll", handleScroll, {
            passive: true
          });
          return [scrollableElement, getScrollCoordinates(scrollableElement)];
        }
        return null;
      }).filter((entry) => entry != null);
      setScrollCoordinates(entries.length ? new Map(entries) : null);
      prevElements.current = elements;
    }
    return () => {
      cleanup(elements);
      cleanup(previousElements);
    };
    function cleanup(elements2) {
      elements2.forEach((element) => {
        const scrollableElement = getScrollableElement(element);
        scrollableElement == null ? void 0 : scrollableElement.removeEventListener("scroll", handleScroll);
      });
    }
  }, [handleScroll, elements]);
  return reactExports.useMemo(() => {
    if (elements.length) {
      return scrollCoordinates ? Array.from(scrollCoordinates.values()).reduce((acc, coordinates) => add(acc, coordinates), defaultCoordinates) : getScrollOffsets(elements);
    }
    return defaultCoordinates;
  }, [elements, scrollCoordinates]);
}
function useScrollOffsetsDelta(scrollOffsets, dependencies) {
  if (dependencies === void 0) {
    dependencies = [];
  }
  const initialScrollOffsets = reactExports.useRef(null);
  reactExports.useEffect(
    () => {
      initialScrollOffsets.current = null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  );
  reactExports.useEffect(() => {
    const hasScrollOffsets = scrollOffsets !== defaultCoordinates;
    if (hasScrollOffsets && !initialScrollOffsets.current) {
      initialScrollOffsets.current = scrollOffsets;
    }
    if (!hasScrollOffsets && initialScrollOffsets.current) {
      initialScrollOffsets.current = null;
    }
  }, [scrollOffsets]);
  return initialScrollOffsets.current ? subtract(scrollOffsets, initialScrollOffsets.current) : defaultCoordinates;
}
function useSensorSetup(sensors) {
  reactExports.useEffect(
    () => {
      if (!canUseDOM) {
        return;
      }
      const teardownFns = sensors.map((_ref) => {
        let {
          sensor
        } = _ref;
        return sensor.setup == null ? void 0 : sensor.setup();
      });
      return () => {
        for (const teardown of teardownFns) {
          teardown == null ? void 0 : teardown();
        }
      };
    },
    // TO-DO: Sensors length could theoretically change which would not be a valid dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
    sensors.map((_ref2) => {
      let {
        sensor
      } = _ref2;
      return sensor;
    })
  );
}
function useSyntheticListeners(listeners, id) {
  return reactExports.useMemo(() => {
    return listeners.reduce((acc, _ref) => {
      let {
        eventName,
        handler
      } = _ref;
      acc[eventName] = (event) => {
        handler(event, id);
      };
      return acc;
    }, {});
  }, [listeners, id]);
}
function useWindowRect(element) {
  return reactExports.useMemo(() => element ? getWindowClientRect(element) : null, [element]);
}
const defaultValue$2 = [];
function useRects(elements, measure) {
  if (measure === void 0) {
    measure = getClientRect;
  }
  const [firstElement] = elements;
  const windowRect = useWindowRect(firstElement ? getWindow(firstElement) : null);
  const [rects, setRects] = reactExports.useState(defaultValue$2);
  function measureRects() {
    setRects(() => {
      if (!elements.length) {
        return defaultValue$2;
      }
      return elements.map((element) => isDocumentScrollingElement(element) ? windowRect : new Rect(measure(element), element));
    });
  }
  const resizeObserver = useResizeObserver({
    callback: measureRects
  });
  useIsomorphicLayoutEffect(() => {
    resizeObserver == null ? void 0 : resizeObserver.disconnect();
    measureRects();
    elements.forEach((element) => resizeObserver == null ? void 0 : resizeObserver.observe(element));
  }, [elements]);
  return rects;
}
function getMeasurableNode(node) {
  if (!node) {
    return null;
  }
  if (node.children.length > 1) {
    return node;
  }
  const firstChild = node.children[0];
  return isHTMLElement(firstChild) ? firstChild : node;
}
function useDragOverlayMeasuring(_ref) {
  let {
    measure
  } = _ref;
  const [rect, setRect] = reactExports.useState(null);
  const handleResize = reactExports.useCallback((entries) => {
    for (const {
      target
    } of entries) {
      if (isHTMLElement(target)) {
        setRect((rect2) => {
          const newRect = measure(target);
          return rect2 ? {
            ...rect2,
            width: newRect.width,
            height: newRect.height
          } : newRect;
        });
        break;
      }
    }
  }, [measure]);
  const resizeObserver = useResizeObserver({
    callback: handleResize
  });
  const handleNodeChange = reactExports.useCallback((element) => {
    const node = getMeasurableNode(element);
    resizeObserver == null ? void 0 : resizeObserver.disconnect();
    if (node) {
      resizeObserver == null ? void 0 : resizeObserver.observe(node);
    }
    setRect(node ? measure(node) : null);
  }, [measure, resizeObserver]);
  const [nodeRef, setRef] = useNodeRef(handleNodeChange);
  return reactExports.useMemo(() => ({
    nodeRef,
    rect,
    setRef
  }), [rect, nodeRef, setRef]);
}
const defaultSensors = [{
  sensor: PointerSensor,
  options: {}
}, {
  sensor: KeyboardSensor,
  options: {}
}];
const defaultData = {
  current: {}
};
const defaultMeasuringConfiguration = {
  draggable: {
    measure: getTransformAgnosticClientRect
  },
  droppable: {
    measure: getTransformAgnosticClientRect,
    strategy: MeasuringStrategy.WhileDragging,
    frequency: MeasuringFrequency.Optimized
  },
  dragOverlay: {
    measure: getClientRect
  }
};
class DroppableContainersMap extends Map {
  get(id) {
    var _super$get;
    return id != null ? (_super$get = super.get(id)) != null ? _super$get : void 0 : void 0;
  }
  toArray() {
    return Array.from(this.values());
  }
  getEnabled() {
    return this.toArray().filter((_ref) => {
      let {
        disabled
      } = _ref;
      return !disabled;
    });
  }
  getNodeFor(id) {
    var _this$get$node$curren, _this$get;
    return (_this$get$node$curren = (_this$get = this.get(id)) == null ? void 0 : _this$get.node.current) != null ? _this$get$node$curren : void 0;
  }
}
const defaultPublicContext = {
  activatorEvent: null,
  active: null,
  activeNode: null,
  activeNodeRect: null,
  collisions: null,
  containerNodeRect: null,
  draggableNodes: /* @__PURE__ */ new Map(),
  droppableRects: /* @__PURE__ */ new Map(),
  droppableContainers: /* @__PURE__ */ new DroppableContainersMap(),
  over: null,
  dragOverlay: {
    nodeRef: {
      current: null
    },
    rect: null,
    setRef: noop
  },
  scrollableAncestors: [],
  scrollableAncestorRects: [],
  measuringConfiguration: defaultMeasuringConfiguration,
  measureDroppableContainers: noop,
  windowRect: null,
  measuringScheduled: false
};
const defaultInternalContext = {
  activatorEvent: null,
  activators: [],
  active: null,
  activeNodeRect: null,
  ariaDescribedById: {
    draggable: ""
  },
  dispatch: noop,
  draggableNodes: /* @__PURE__ */ new Map(),
  over: null,
  measureDroppableContainers: noop
};
const InternalContext = /* @__PURE__ */ reactExports.createContext(defaultInternalContext);
const PublicContext = /* @__PURE__ */ reactExports.createContext(defaultPublicContext);
function getInitialState() {
  return {
    draggable: {
      active: null,
      initialCoordinates: {
        x: 0,
        y: 0
      },
      nodes: /* @__PURE__ */ new Map(),
      translate: {
        x: 0,
        y: 0
      }
    },
    droppable: {
      containers: new DroppableContainersMap()
    }
  };
}
function reducer(state, action) {
  switch (action.type) {
    case Action.DragStart:
      return {
        ...state,
        draggable: {
          ...state.draggable,
          initialCoordinates: action.initialCoordinates,
          active: action.active
        }
      };
    case Action.DragMove:
      if (state.draggable.active == null) {
        return state;
      }
      return {
        ...state,
        draggable: {
          ...state.draggable,
          translate: {
            x: action.coordinates.x - state.draggable.initialCoordinates.x,
            y: action.coordinates.y - state.draggable.initialCoordinates.y
          }
        }
      };
    case Action.DragEnd:
    case Action.DragCancel:
      return {
        ...state,
        draggable: {
          ...state.draggable,
          active: null,
          initialCoordinates: {
            x: 0,
            y: 0
          },
          translate: {
            x: 0,
            y: 0
          }
        }
      };
    case Action.RegisterDroppable: {
      const {
        element
      } = action;
      const {
        id
      } = element;
      const containers = new DroppableContainersMap(state.droppable.containers);
      containers.set(id, element);
      return {
        ...state,
        droppable: {
          ...state.droppable,
          containers
        }
      };
    }
    case Action.SetDroppableDisabled: {
      const {
        id,
        key,
        disabled
      } = action;
      const element = state.droppable.containers.get(id);
      if (!element || key !== element.key) {
        return state;
      }
      const containers = new DroppableContainersMap(state.droppable.containers);
      containers.set(id, {
        ...element,
        disabled
      });
      return {
        ...state,
        droppable: {
          ...state.droppable,
          containers
        }
      };
    }
    case Action.UnregisterDroppable: {
      const {
        id,
        key
      } = action;
      const element = state.droppable.containers.get(id);
      if (!element || key !== element.key) {
        return state;
      }
      const containers = new DroppableContainersMap(state.droppable.containers);
      containers.delete(id);
      return {
        ...state,
        droppable: {
          ...state.droppable,
          containers
        }
      };
    }
    default: {
      return state;
    }
  }
}
function RestoreFocus(_ref) {
  let {
    disabled
  } = _ref;
  const {
    active,
    activatorEvent,
    draggableNodes
  } = reactExports.useContext(InternalContext);
  const previousActivatorEvent = usePrevious(activatorEvent);
  const previousActiveId = usePrevious(active == null ? void 0 : active.id);
  reactExports.useEffect(() => {
    if (disabled) {
      return;
    }
    if (!activatorEvent && previousActivatorEvent && previousActiveId != null) {
      if (!isKeyboardEvent(previousActivatorEvent)) {
        return;
      }
      if (document.activeElement === previousActivatorEvent.target) {
        return;
      }
      const draggableNode = draggableNodes.get(previousActiveId);
      if (!draggableNode) {
        return;
      }
      const {
        activatorNode,
        node
      } = draggableNode;
      if (!activatorNode.current && !node.current) {
        return;
      }
      requestAnimationFrame(() => {
        for (const element of [activatorNode.current, node.current]) {
          if (!element) {
            continue;
          }
          const focusableNode = findFirstFocusableNode(element);
          if (focusableNode) {
            focusableNode.focus();
            break;
          }
        }
      });
    }
  }, [activatorEvent, disabled, draggableNodes, previousActiveId, previousActivatorEvent]);
  return null;
}
function applyModifiers(modifiers, _ref) {
  let {
    transform,
    ...args
  } = _ref;
  return modifiers != null && modifiers.length ? modifiers.reduce((accumulator, modifier) => {
    return modifier({
      transform: accumulator,
      ...args
    });
  }, transform) : transform;
}
function useMeasuringConfiguration(config) {
  return reactExports.useMemo(
    () => ({
      draggable: {
        ...defaultMeasuringConfiguration.draggable,
        ...config == null ? void 0 : config.draggable
      },
      droppable: {
        ...defaultMeasuringConfiguration.droppable,
        ...config == null ? void 0 : config.droppable
      },
      dragOverlay: {
        ...defaultMeasuringConfiguration.dragOverlay,
        ...config == null ? void 0 : config.dragOverlay
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config == null ? void 0 : config.draggable, config == null ? void 0 : config.droppable, config == null ? void 0 : config.dragOverlay]
  );
}
function useLayoutShiftScrollCompensation(_ref) {
  let {
    activeNode,
    measure,
    initialRect,
    config = true
  } = _ref;
  const initialized = reactExports.useRef(false);
  const {
    x,
    y
  } = typeof config === "boolean" ? {
    x: config,
    y: config
  } : config;
  useIsomorphicLayoutEffect(() => {
    const disabled = !x && !y;
    if (disabled || !activeNode) {
      initialized.current = false;
      return;
    }
    if (initialized.current || !initialRect) {
      return;
    }
    const node = activeNode == null ? void 0 : activeNode.node.current;
    if (!node || node.isConnected === false) {
      return;
    }
    const rect = measure(node);
    const rectDelta = getRectDelta(rect, initialRect);
    if (!x) {
      rectDelta.x = 0;
    }
    if (!y) {
      rectDelta.y = 0;
    }
    initialized.current = true;
    if (Math.abs(rectDelta.x) > 0 || Math.abs(rectDelta.y) > 0) {
      const firstScrollableAncestor = getFirstScrollableAncestor(node);
      if (firstScrollableAncestor) {
        firstScrollableAncestor.scrollBy({
          top: rectDelta.y,
          left: rectDelta.x
        });
      }
    }
  }, [activeNode, x, y, initialRect, measure]);
}
const ActiveDraggableContext = /* @__PURE__ */ reactExports.createContext({
  ...defaultCoordinates,
  scaleX: 1,
  scaleY: 1
});
var Status;
(function(Status2) {
  Status2[Status2["Uninitialized"] = 0] = "Uninitialized";
  Status2[Status2["Initializing"] = 1] = "Initializing";
  Status2[Status2["Initialized"] = 2] = "Initialized";
})(Status || (Status = {}));
const DndContext = /* @__PURE__ */ reactExports.memo(function DndContext2(_ref) {
  var _sensorContext$curren, _dragOverlay$nodeRef$, _dragOverlay$rect, _over$rect;
  let {
    id,
    accessibility,
    autoScroll = true,
    children,
    sensors = defaultSensors,
    collisionDetection = rectIntersection,
    measuring,
    modifiers,
    ...props
  } = _ref;
  const store = reactExports.useReducer(reducer, void 0, getInitialState);
  const [state, dispatch] = store;
  const [dispatchMonitorEvent, registerMonitorListener] = useDndMonitorProvider();
  const [status, setStatus] = reactExports.useState(Status.Uninitialized);
  const isInitialized = status === Status.Initialized;
  const {
    draggable: {
      active: activeId,
      nodes: draggableNodes,
      translate
    },
    droppable: {
      containers: droppableContainers
    }
  } = state;
  const node = activeId != null ? draggableNodes.get(activeId) : null;
  const activeRects = reactExports.useRef({
    initial: null,
    translated: null
  });
  const active = reactExports.useMemo(() => {
    var _node$data;
    return activeId != null ? {
      id: activeId,
      // It's possible for the active node to unmount while dragging
      data: (_node$data = node == null ? void 0 : node.data) != null ? _node$data : defaultData,
      rect: activeRects
    } : null;
  }, [activeId, node]);
  const activeRef = reactExports.useRef(null);
  const [activeSensor, setActiveSensor] = reactExports.useState(null);
  const [activatorEvent, setActivatorEvent] = reactExports.useState(null);
  const latestProps = useLatestValue(props, Object.values(props));
  const draggableDescribedById = useUniqueId("DndDescribedBy", id);
  const enabledDroppableContainers = reactExports.useMemo(() => droppableContainers.getEnabled(), [droppableContainers]);
  const measuringConfiguration = useMeasuringConfiguration(measuring);
  const {
    droppableRects,
    measureDroppableContainers,
    measuringScheduled
  } = useDroppableMeasuring(enabledDroppableContainers, {
    dragging: isInitialized,
    dependencies: [translate.x, translate.y],
    config: measuringConfiguration.droppable
  });
  const activeNode = useCachedNode(draggableNodes, activeId);
  const activationCoordinates = reactExports.useMemo(() => activatorEvent ? getEventCoordinates(activatorEvent) : null, [activatorEvent]);
  const autoScrollOptions = getAutoScrollerOptions();
  const initialActiveNodeRect = useInitialRect(activeNode, measuringConfiguration.draggable.measure);
  useLayoutShiftScrollCompensation({
    activeNode: activeId != null ? draggableNodes.get(activeId) : null,
    config: autoScrollOptions.layoutShiftCompensation,
    initialRect: initialActiveNodeRect,
    measure: measuringConfiguration.draggable.measure
  });
  const activeNodeRect = useRect(activeNode, measuringConfiguration.draggable.measure, initialActiveNodeRect);
  const containerNodeRect = useRect(activeNode ? activeNode.parentElement : null);
  const sensorContext = reactExports.useRef({
    activatorEvent: null,
    active: null,
    activeNode,
    collisionRect: null,
    collisions: null,
    droppableRects,
    draggableNodes,
    draggingNode: null,
    draggingNodeRect: null,
    droppableContainers,
    over: null,
    scrollableAncestors: [],
    scrollAdjustedTranslate: null
  });
  const overNode = droppableContainers.getNodeFor((_sensorContext$curren = sensorContext.current.over) == null ? void 0 : _sensorContext$curren.id);
  const dragOverlay = useDragOverlayMeasuring({
    measure: measuringConfiguration.dragOverlay.measure
  });
  const draggingNode = (_dragOverlay$nodeRef$ = dragOverlay.nodeRef.current) != null ? _dragOverlay$nodeRef$ : activeNode;
  const draggingNodeRect = isInitialized ? (_dragOverlay$rect = dragOverlay.rect) != null ? _dragOverlay$rect : activeNodeRect : null;
  const usesDragOverlay = Boolean(dragOverlay.nodeRef.current && dragOverlay.rect);
  const nodeRectDelta = useRectDelta(usesDragOverlay ? null : activeNodeRect);
  const windowRect = useWindowRect(draggingNode ? getWindow(draggingNode) : null);
  const scrollableAncestors = useScrollableAncestors(isInitialized ? overNode != null ? overNode : activeNode : null);
  const scrollableAncestorRects = useRects(scrollableAncestors);
  const modifiedTranslate = applyModifiers(modifiers, {
    transform: {
      x: translate.x - nodeRectDelta.x,
      y: translate.y - nodeRectDelta.y,
      scaleX: 1,
      scaleY: 1
    },
    activatorEvent,
    active,
    activeNodeRect,
    containerNodeRect,
    draggingNodeRect,
    over: sensorContext.current.over,
    overlayNodeRect: dragOverlay.rect,
    scrollableAncestors,
    scrollableAncestorRects,
    windowRect
  });
  const pointerCoordinates = activationCoordinates ? add(activationCoordinates, translate) : null;
  const scrollOffsets = useScrollOffsets(scrollableAncestors);
  const scrollAdjustment = useScrollOffsetsDelta(scrollOffsets);
  const activeNodeScrollDelta = useScrollOffsetsDelta(scrollOffsets, [activeNodeRect]);
  const scrollAdjustedTranslate = add(modifiedTranslate, scrollAdjustment);
  const collisionRect = draggingNodeRect ? getAdjustedRect(draggingNodeRect, modifiedTranslate) : null;
  const collisions = active && collisionRect ? collisionDetection({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: enabledDroppableContainers,
    pointerCoordinates
  }) : null;
  const overId = getFirstCollision(collisions, "id");
  const [over, setOver] = reactExports.useState(null);
  const appliedTranslate = usesDragOverlay ? modifiedTranslate : add(modifiedTranslate, activeNodeScrollDelta);
  const transform = adjustScale(appliedTranslate, (_over$rect = over == null ? void 0 : over.rect) != null ? _over$rect : null, activeNodeRect);
  const activeSensorRef = reactExports.useRef(null);
  const instantiateSensor = reactExports.useCallback(
    (event, _ref2) => {
      let {
        sensor: Sensor,
        options
      } = _ref2;
      if (activeRef.current == null) {
        return;
      }
      const activeNode2 = draggableNodes.get(activeRef.current);
      if (!activeNode2) {
        return;
      }
      const activatorEvent2 = event.nativeEvent;
      const sensorInstance = new Sensor({
        active: activeRef.current,
        activeNode: activeNode2,
        event: activatorEvent2,
        options,
        // Sensors need to be instantiated with refs for arguments that change over time
        // otherwise they are frozen in time with the stale arguments
        context: sensorContext,
        onAbort(id2) {
          const draggableNode = draggableNodes.get(id2);
          if (!draggableNode) {
            return;
          }
          const {
            onDragAbort
          } = latestProps.current;
          const event2 = {
            id: id2
          };
          onDragAbort == null ? void 0 : onDragAbort(event2);
          dispatchMonitorEvent({
            type: "onDragAbort",
            event: event2
          });
        },
        onPending(id2, constraint, initialCoordinates, offset) {
          const draggableNode = draggableNodes.get(id2);
          if (!draggableNode) {
            return;
          }
          const {
            onDragPending
          } = latestProps.current;
          const event2 = {
            id: id2,
            constraint,
            initialCoordinates,
            offset
          };
          onDragPending == null ? void 0 : onDragPending(event2);
          dispatchMonitorEvent({
            type: "onDragPending",
            event: event2
          });
        },
        onStart(initialCoordinates) {
          const id2 = activeRef.current;
          if (id2 == null) {
            return;
          }
          const draggableNode = draggableNodes.get(id2);
          if (!draggableNode) {
            return;
          }
          const {
            onDragStart
          } = latestProps.current;
          const event2 = {
            activatorEvent: activatorEvent2,
            active: {
              id: id2,
              data: draggableNode.data,
              rect: activeRects
            }
          };
          reactDomExports.unstable_batchedUpdates(() => {
            onDragStart == null ? void 0 : onDragStart(event2);
            setStatus(Status.Initializing);
            dispatch({
              type: Action.DragStart,
              initialCoordinates,
              active: id2
            });
            dispatchMonitorEvent({
              type: "onDragStart",
              event: event2
            });
            setActiveSensor(activeSensorRef.current);
            setActivatorEvent(activatorEvent2);
          });
        },
        onMove(coordinates) {
          dispatch({
            type: Action.DragMove,
            coordinates
          });
        },
        onEnd: createHandler(Action.DragEnd),
        onCancel: createHandler(Action.DragCancel)
      });
      activeSensorRef.current = sensorInstance;
      function createHandler(type) {
        return async function handler() {
          const {
            active: active2,
            collisions: collisions2,
            over: over2,
            scrollAdjustedTranslate: scrollAdjustedTranslate2
          } = sensorContext.current;
          let event2 = null;
          if (active2 && scrollAdjustedTranslate2) {
            const {
              cancelDrop
            } = latestProps.current;
            event2 = {
              activatorEvent: activatorEvent2,
              active: active2,
              collisions: collisions2,
              delta: scrollAdjustedTranslate2,
              over: over2
            };
            if (type === Action.DragEnd && typeof cancelDrop === "function") {
              const shouldCancel = await Promise.resolve(cancelDrop(event2));
              if (shouldCancel) {
                type = Action.DragCancel;
              }
            }
          }
          activeRef.current = null;
          reactDomExports.unstable_batchedUpdates(() => {
            dispatch({
              type
            });
            setStatus(Status.Uninitialized);
            setOver(null);
            setActiveSensor(null);
            setActivatorEvent(null);
            activeSensorRef.current = null;
            const eventName = type === Action.DragEnd ? "onDragEnd" : "onDragCancel";
            if (event2) {
              const handler2 = latestProps.current[eventName];
              handler2 == null ? void 0 : handler2(event2);
              dispatchMonitorEvent({
                type: eventName,
                event: event2
              });
            }
          });
        };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draggableNodes]
  );
  const bindActivatorToSensorInstantiator = reactExports.useCallback((handler, sensor) => {
    return (event, active2) => {
      const nativeEvent = event.nativeEvent;
      const activeDraggableNode = draggableNodes.get(active2);
      if (
        // Another sensor is already instantiating
        activeRef.current !== null || // No active draggable
        !activeDraggableNode || // Event has already been captured
        nativeEvent.dndKit || nativeEvent.defaultPrevented
      ) {
        return;
      }
      const activationContext = {
        active: activeDraggableNode
      };
      const shouldActivate = handler(event, sensor.options, activationContext);
      if (shouldActivate === true) {
        nativeEvent.dndKit = {
          capturedBy: sensor.sensor
        };
        activeRef.current = active2;
        instantiateSensor(event, sensor);
      }
    };
  }, [draggableNodes, instantiateSensor]);
  const activators = useCombineActivators(sensors, bindActivatorToSensorInstantiator);
  useSensorSetup(sensors);
  useIsomorphicLayoutEffect(() => {
    if (activeNodeRect && status === Status.Initializing) {
      setStatus(Status.Initialized);
    }
  }, [activeNodeRect, status]);
  reactExports.useEffect(
    () => {
      const {
        onDragMove
      } = latestProps.current;
      const {
        active: active2,
        activatorEvent: activatorEvent2,
        collisions: collisions2,
        over: over2
      } = sensorContext.current;
      if (!active2 || !activatorEvent2) {
        return;
      }
      const event = {
        active: active2,
        activatorEvent: activatorEvent2,
        collisions: collisions2,
        delta: {
          x: scrollAdjustedTranslate.x,
          y: scrollAdjustedTranslate.y
        },
        over: over2
      };
      reactDomExports.unstable_batchedUpdates(() => {
        onDragMove == null ? void 0 : onDragMove(event);
        dispatchMonitorEvent({
          type: "onDragMove",
          event
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scrollAdjustedTranslate.x, scrollAdjustedTranslate.y]
  );
  reactExports.useEffect(
    () => {
      const {
        active: active2,
        activatorEvent: activatorEvent2,
        collisions: collisions2,
        droppableContainers: droppableContainers2,
        scrollAdjustedTranslate: scrollAdjustedTranslate2
      } = sensorContext.current;
      if (!active2 || activeRef.current == null || !activatorEvent2 || !scrollAdjustedTranslate2) {
        return;
      }
      const {
        onDragOver
      } = latestProps.current;
      const overContainer = droppableContainers2.get(overId);
      const over2 = overContainer && overContainer.rect.current ? {
        id: overContainer.id,
        rect: overContainer.rect.current,
        data: overContainer.data,
        disabled: overContainer.disabled
      } : null;
      const event = {
        active: active2,
        activatorEvent: activatorEvent2,
        collisions: collisions2,
        delta: {
          x: scrollAdjustedTranslate2.x,
          y: scrollAdjustedTranslate2.y
        },
        over: over2
      };
      reactDomExports.unstable_batchedUpdates(() => {
        setOver(over2);
        onDragOver == null ? void 0 : onDragOver(event);
        dispatchMonitorEvent({
          type: "onDragOver",
          event
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overId]
  );
  useIsomorphicLayoutEffect(() => {
    sensorContext.current = {
      activatorEvent,
      active,
      activeNode,
      collisionRect,
      collisions,
      droppableRects,
      draggableNodes,
      draggingNode,
      draggingNodeRect,
      droppableContainers,
      over,
      scrollableAncestors,
      scrollAdjustedTranslate
    };
    activeRects.current = {
      initial: draggingNodeRect,
      translated: collisionRect
    };
  }, [active, activeNode, collisions, collisionRect, draggableNodes, draggingNode, draggingNodeRect, droppableRects, droppableContainers, over, scrollableAncestors, scrollAdjustedTranslate]);
  useAutoScroller({
    ...autoScrollOptions,
    delta: translate,
    draggingRect: collisionRect,
    pointerCoordinates,
    scrollableAncestors,
    scrollableAncestorRects
  });
  const publicContext = reactExports.useMemo(() => {
    const context = {
      active,
      activeNode,
      activeNodeRect,
      activatorEvent,
      collisions,
      containerNodeRect,
      dragOverlay,
      draggableNodes,
      droppableContainers,
      droppableRects,
      over,
      measureDroppableContainers,
      scrollableAncestors,
      scrollableAncestorRects,
      measuringConfiguration,
      measuringScheduled,
      windowRect
    };
    return context;
  }, [active, activeNode, activeNodeRect, activatorEvent, collisions, containerNodeRect, dragOverlay, draggableNodes, droppableContainers, droppableRects, over, measureDroppableContainers, scrollableAncestors, scrollableAncestorRects, measuringConfiguration, measuringScheduled, windowRect]);
  const internalContext = reactExports.useMemo(() => {
    const context = {
      activatorEvent,
      activators,
      active,
      activeNodeRect,
      ariaDescribedById: {
        draggable: draggableDescribedById
      },
      dispatch,
      draggableNodes,
      over,
      measureDroppableContainers
    };
    return context;
  }, [activatorEvent, activators, active, activeNodeRect, dispatch, draggableDescribedById, draggableNodes, over, measureDroppableContainers]);
  return React.createElement(DndMonitorContext.Provider, {
    value: registerMonitorListener
  }, React.createElement(InternalContext.Provider, {
    value: internalContext
  }, React.createElement(PublicContext.Provider, {
    value: publicContext
  }, React.createElement(ActiveDraggableContext.Provider, {
    value: transform
  }, children)), React.createElement(RestoreFocus, {
    disabled: (accessibility == null ? void 0 : accessibility.restoreFocus) === false
  })), React.createElement(Accessibility, {
    ...accessibility,
    hiddenTextDescribedById: draggableDescribedById
  }));
  function getAutoScrollerOptions() {
    const activeSensorDisablesAutoscroll = (activeSensor == null ? void 0 : activeSensor.autoScrollEnabled) === false;
    const autoScrollGloballyDisabled = typeof autoScroll === "object" ? autoScroll.enabled === false : autoScroll === false;
    const enabled = isInitialized && !activeSensorDisablesAutoscroll && !autoScrollGloballyDisabled;
    if (typeof autoScroll === "object") {
      return {
        ...autoScroll,
        enabled
      };
    }
    return {
      enabled
    };
  }
});
const NullContext = /* @__PURE__ */ reactExports.createContext(null);
const defaultRole = "button";
const ID_PREFIX = "Draggable";
function useDraggable(_ref) {
  let {
    id,
    data,
    disabled = false,
    attributes
  } = _ref;
  const key = useUniqueId(ID_PREFIX);
  const {
    activators,
    activatorEvent,
    active,
    activeNodeRect,
    ariaDescribedById,
    draggableNodes,
    over
  } = reactExports.useContext(InternalContext);
  const {
    role = defaultRole,
    roleDescription = "draggable",
    tabIndex = 0
  } = attributes != null ? attributes : {};
  const isDragging = (active == null ? void 0 : active.id) === id;
  const transform = reactExports.useContext(isDragging ? ActiveDraggableContext : NullContext);
  const [node, setNodeRef] = useNodeRef();
  const [activatorNode, setActivatorNodeRef] = useNodeRef();
  const listeners = useSyntheticListeners(activators, id);
  const dataRef = useLatestValue(data);
  useIsomorphicLayoutEffect(
    () => {
      draggableNodes.set(id, {
        id,
        key,
        node,
        activatorNode,
        data: dataRef
      });
      return () => {
        const node2 = draggableNodes.get(id);
        if (node2 && node2.key === key) {
          draggableNodes.delete(id);
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draggableNodes, id]
  );
  const memoizedAttributes = reactExports.useMemo(() => ({
    role,
    tabIndex,
    "aria-disabled": disabled,
    "aria-pressed": isDragging && role === defaultRole ? true : void 0,
    "aria-roledescription": roleDescription,
    "aria-describedby": ariaDescribedById.draggable
  }), [disabled, role, tabIndex, isDragging, roleDescription, ariaDescribedById.draggable]);
  return {
    active,
    activatorEvent,
    activeNodeRect,
    attributes: memoizedAttributes,
    isDragging,
    listeners: disabled ? void 0 : listeners,
    node,
    over,
    setNodeRef,
    setActivatorNodeRef,
    transform
  };
}
const ID_PREFIX$1 = "Droppable";
const defaultResizeObserverConfig = {
  timeout: 25
};
function useDroppable(_ref) {
  let {
    data,
    disabled = false,
    id,
    resizeObserverConfig
  } = _ref;
  const key = useUniqueId(ID_PREFIX$1);
  const {
    active,
    dispatch,
    over,
    measureDroppableContainers
  } = reactExports.useContext(InternalContext);
  const previous = reactExports.useRef({
    disabled
  });
  const resizeObserverConnected = reactExports.useRef(false);
  const rect = reactExports.useRef(null);
  const callbackId = reactExports.useRef(null);
  const {
    disabled: resizeObserverDisabled,
    updateMeasurementsFor,
    timeout: resizeObserverTimeout
  } = {
    ...defaultResizeObserverConfig,
    ...resizeObserverConfig
  };
  const ids2 = useLatestValue(updateMeasurementsFor != null ? updateMeasurementsFor : id);
  const handleResize = reactExports.useCallback(
    () => {
      if (!resizeObserverConnected.current) {
        resizeObserverConnected.current = true;
        return;
      }
      if (callbackId.current != null) {
        clearTimeout(callbackId.current);
      }
      callbackId.current = setTimeout(() => {
        measureDroppableContainers(Array.isArray(ids2.current) ? ids2.current : [ids2.current]);
        callbackId.current = null;
      }, resizeObserverTimeout);
    },
    //eslint-disable-next-line react-hooks/exhaustive-deps
    [resizeObserverTimeout]
  );
  const resizeObserver = useResizeObserver({
    callback: handleResize,
    disabled: resizeObserverDisabled || !active
  });
  const handleNodeChange = reactExports.useCallback((newElement, previousElement) => {
    if (!resizeObserver) {
      return;
    }
    if (previousElement) {
      resizeObserver.unobserve(previousElement);
      resizeObserverConnected.current = false;
    }
    if (newElement) {
      resizeObserver.observe(newElement);
    }
  }, [resizeObserver]);
  const [nodeRef, setNodeRef] = useNodeRef(handleNodeChange);
  const dataRef = useLatestValue(data);
  reactExports.useEffect(() => {
    if (!resizeObserver || !nodeRef.current) {
      return;
    }
    resizeObserver.disconnect();
    resizeObserverConnected.current = false;
    resizeObserver.observe(nodeRef.current);
  }, [nodeRef, resizeObserver]);
  reactExports.useEffect(
    () => {
      dispatch({
        type: Action.RegisterDroppable,
        element: {
          id,
          key,
          disabled,
          node: nodeRef,
          rect,
          data: dataRef
        }
      });
      return () => dispatch({
        type: Action.UnregisterDroppable,
        key,
        id
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );
  reactExports.useEffect(() => {
    if (disabled !== previous.current.disabled) {
      dispatch({
        type: Action.SetDroppableDisabled,
        id,
        key,
        disabled
      });
      previous.current.disabled = disabled;
    }
  }, [id, key, disabled, dispatch]);
  return {
    active,
    rect,
    isOver: (over == null ? void 0 : over.id) === id,
    node: nodeRef,
    over,
    setNodeRef
  };
}
const createGoogleEventBody = (slot, dateStr) => {
  const startDateTime = `${dateStr}T${slot.startTime}:00`;
  const [hours, mins] = slot.startTime.split(":").map(Number);
  const totalMins = hours * 60 + mins + slot.durationMinutes;
  const endHours = Math.floor(totalMins / 60);
  const endMins = totalMins % 60;
  const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
  const endDateTime = `${dateStr}T${endTime}:00`;
  const body = {
    summary: `${slot.subject === "Solar" ? "☀️" : "💻"} ${slot.subject} Class (Grade ${slot.grade})`,
    description: `Grade ${slot.grade} - ${slot.subject}
Status: ${slot.status}

[Managed by PRISM]`,
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    extendedProperties: {
      private: {
        prismSlotId: slot.id,
        prismVersion: "2.0"
      }
    }
  };
  return body;
};
const syncScheduleToGoogle = async (schedule, accessToken, weekDates) => {
  let successCount = 0;
  let failCount = 0;
  let lastEventLink = "";
  const updatedSchedule = [...schedule];
  const startDate = new Date(weekDates[0]);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(weekDates[weekDates.length - 1]);
  endDate.setHours(23, 59, 59, 999);
  const timeMin = startDate.toISOString();
  const timeMax = endDate.toISOString();
  let existingGoogleEvents = [];
  try {
    const queryParams = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      privateExtendedProperty: "prismVersion=2.0"
      // Only fetch our events
    });
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    if (response.ok) {
      const data = await response.json();
      existingGoogleEvents = data.items || [];
    } else {
      console.error("Failed to fetch events:", response.status, await response.text());
    }
  } catch (e) {
    console.warn("Failed to fetch existing events, proceeding with blind create (may cause dupes)", e);
  }
  const getDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  for (const date of weekDates) {
    const dateStr = getDateStr(date);
    const dayOfWeek = date.getDay();
    const recurring = schedule.filter((s) => s.dayOfWeek === dayOfWeek && !s.overrideDate);
    const overrides = schedule.filter((s) => s.overrideDate === dateStr);
    const replacedIds = new Set(overrides.filter((o) => o.replacesSlotId).map((o) => o.replacesSlotId));
    const activeSlots = [
      ...recurring.filter((r) => !replacedIds.has(r.id)),
      ...overrides
    ].filter((s) => s.status !== "Cancelled");
    for (const slot of activeSlots) {
      const eventBody = createGoogleEventBody(slot, dateStr);
      const match = existingGoogleEvents.find(
        (ev) => {
          var _a, _b;
          return ((_b = (_a = ev.extendedProperties) == null ? void 0 : _a.private) == null ? void 0 : _b.prismSlotId) === slot.id && ev.start.dateTime.startsWith(dateStr);
        }
      );
      try {
        if (match) {
          const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${match.id}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(eventBody)
          });
          if (response.ok) successCount++;
          else {
            failCount++;
            console.error("Failed to update event:", await response.text());
          }
        } else {
          const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(eventBody)
          });
          if (response.ok) {
            const newEvent = await response.json();
            successCount++;
            lastEventLink = newEvent.htmlLink;
          } else {
            failCount++;
            console.error("Failed to create event:", await response.text());
          }
        }
      } catch (e) {
        console.error("Sync error", e);
        failCount++;
      }
    }
  }
  return { successCount, failCount, updatedSchedule, lastEventLink };
};
const DraggableSlot = ({
  slot,
  onSlotClick,
  children,
  className,
  style: propStyle,
  disabled
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slot.id,
    data: { slot },
    disabled
  });
  const style = {
    ...propStyle,
    ...transform ? {
      transform: CSS.Translate.toString(transform),
      zIndex: 50,
      opacity: 0.9
    } : void 0
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: setNodeRef,
      style,
      role: "button",
      tabIndex: disabled ? -1 : 0,
      "aria-label": `${slot.subject} class for grade ${slot.grade} at ${slot.startTime}. Status: ${slot.status}`,
      onKeyDown: (e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSlotClick();
        }
      },
      className: clsx(
        className,
        "transition-[box-shadow,transform,filter] outline-none",
        // Focus styling for keyboard accessibility
        "focus-visible:ring-4 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        isDragging ? "z-50 shadow-2xl scale-[1.03] ring-2 ring-violet-500/50 cursor-grabbing" : "z-10 cursor-grab"
      ),
      ...attributes,
      ...listeners,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onPointerDown: (e) => {
      }, onClick: (e) => {
        const target = e.target;
        if (target.closest('button, [role="button"]') && target !== e.currentTarget) {
          return;
        }
        if (!isDragging) onSlotClick();
      }, className: "h-full w-full", children })
    }
  );
};
const DroppableDayColumn = ({
  date,
  dateIdx,
  children,
  hourHeight,
  holiday
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date.getDay()}`,
    // Use day of week (0-6) as ID
    data: { date, isHoliday: !!holiday },
    disabled: !!holiday
    // Disable dropping if holiday
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: setNodeRef,
      className: clsx(
        "border-r border-[var(--md-sys-color-outline-variant)] relative transition-colors h-full",
        isOver ? "bg-[var(--md-sys-color-primary-container)]/30 ring-2 ring-inset ring-[var(--md-sys-color-primary)]/50" : ""
      ),
      style: { height: 24 * hourHeight },
      children: holiday ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-[var(--md-sys-color-surface-variant)]/80 flex flex-col items-center justify-center z-20 backdrop-blur-[2px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl mb-3 drop-shadow-sm", children: "🎉" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-[var(--md-sys-color-on-surface-variant)] transform -rotate-12 uppercase border-2 border-[var(--md-sys-color-on-surface-variant)] p-2.5 rounded-xl opacity-80 shadow-sm text-sm tracking-wider", children: holiday.name })
      ] }) : children
    }
  );
};
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const doTimesOverlap = (start1, duration1, start2, duration2) => {
  const end1 = start1 + duration1;
  const end2 = start2 + duration2;
  return start1 < end2 && start2 < end1;
};
const detectConflicts = (newSlot, existingSlots) => {
  const newStart = timeToMinutes(newSlot.startTime);
  const newDuration = newSlot.durationMinutes;
  const conflicts = [];
  for (const slot of existingSlots) {
    if (newSlot.id && slot.id === newSlot.id) continue;
    if (slot.status === "Cancelled") continue;
    const slotStart = timeToMinutes(slot.startTime);
    if (doTimesOverlap(newStart, newDuration, slotStart, slot.durationMinutes)) {
      let isResourceConflict = false;
      if (newSlot.resourceIds && slot.resourceIds) {
        const sharedResources = newSlot.resourceIds.filter((r) => {
          var _a;
          return (_a = slot.resourceIds) == null ? void 0 : _a.includes(r);
        });
        if (sharedResources.length > 0) {
          conflicts.push({
            type: "resource",
            slotId: slot.id,
            subject: slot.subject,
            message: `Resource conflict with ${slot.subject}`
          });
          isResourceConflict = true;
        }
      }
      if (!isResourceConflict) {
        conflicts.push({
          type: "time",
          slotId: slot.id,
          subject: slot.subject,
          message: `Time overlap with ${slot.subject}`
        });
      }
    }
  }
  return conflicts;
};
const findBestSlot = (durationMinutes, existingSlots, preferredTimeRange = { start: 6 * 60, end: 22 * 60 }) => {
  for (let time = preferredTimeRange.start; time <= preferredTimeRange.end - durationMinutes; time += 30) {
    const hasCollision = existingSlots.some((slot) => {
      if (slot.status === "Cancelled") return false;
      const sStart = timeToMinutes(slot.startTime);
      return doTimesOverlap(time, durationMinutes, sStart, slot.durationMinutes);
    });
    if (!hasCollision) {
      const h = Math.floor(time / 60);
      const m = time % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  return null;
};
const isHoliday = (date, holidays) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return holidays.find((h) => dateStr >= h.startDate && dateStr <= h.endDate);
};
const getSubjectIcon = (subject, size = 14) => {
  const normalized = (subject || "").toLowerCase();
  if (normalized.includes("solar") || normalized.includes("energy") || normalized.includes("electrical")) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size, fill: "currentColor" });
  }
  if (normalized.includes("ict") || normalized.includes("computer") || normalized.includes("tech") || normalized.includes("digital")) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { size });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size });
};
const getSubjectIconLarge = (subject, size = 24) => {
  const normalized = (subject || "").toLowerCase();
  if (normalized.includes("solar") || normalized.includes("energy") || normalized.includes("electrical")) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size, className: "text-orange-500" });
  }
  if (normalized.includes("ict") || normalized.includes("computer") || normalized.includes("tech") || normalized.includes("digital")) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { size, className: "text-blue-500" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size, className: "text-violet-500" });
};
const getSubjectEmoji = (subject) => {
  const normalized = (subject || "").toLowerCase();
  if (normalized.includes("solar") || normalized.includes("energy") || normalized.includes("electrical")) return "☀️";
  if (normalized.includes("ict") || normalized.includes("computer") || normalized.includes("tech") || normalized.includes("digital")) return "💻";
  if (normalized.includes("math")) return "🧮";
  if (normalized.includes("english") || normalized.includes("kiswahili") || normalized.includes("language") || normalized.includes("french")) return "🗣️";
  if (normalized.includes("science") || normalized.includes("physics") || normalized.includes("chemistry") || normalized.includes("biology")) return "🔬";
  if (normalized.includes("art") || normalized.includes("creative") || normalized.includes("music")) return "🎨";
  if (normalized.includes("history") || normalized.includes("geography") || normalized.includes("social")) return "🌍";
  if (normalized.includes("agriculture")) return "🌾";
  if (normalized.includes("business")) return "💼";
  return "📚";
};
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FULL_DAY_HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const TIME_OPTIONS_15MIN = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = i % 4 * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const CLASS_COLORS = [
  { name: "Coral", bg: "bg-red-50 dark:bg-red-900/20", border: "border-l-red-500", text: "text-red-700 dark:text-red-400", accent: "#ef4444", dot: "bg-red-500" },
  { name: "Mint", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-l-emerald-500", text: "text-emerald-700 dark:text-emerald-400", accent: "#10b981", dot: "bg-emerald-500" },
  { name: "Lavender", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-l-violet-500", text: "text-violet-700 dark:text-violet-400", accent: "#8b5cf6", dot: "bg-violet-500" },
  { name: "Sky", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-l-blue-500", text: "text-blue-700 dark:text-blue-400", accent: "#3b82f6", dot: "bg-blue-500" },
  { name: "Amber", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-l-orange-500", text: "text-orange-700 dark:text-orange-400", accent: "#f97316", dot: "bg-orange-500" },
  { name: "Rose", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-l-pink-500", text: "text-pink-700 dark:text-pink-400", accent: "#ec4899", dot: "bg-pink-500" }
];
const ProgressRing = ({ pct, size = 64, stroke = 5 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, className: "-rotate-90", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: "var(--md-sys-color-outline-variant)", strokeWidth: stroke }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.circle,
      {
        cx: size / 2,
        cy: size / 2,
        r,
        fill: "none",
        stroke: "url(#ring-grad-sched)",
        strokeWidth: stroke,
        strokeLinecap: "round",
        strokeDasharray: c,
        initial: { strokeDashoffset: c },
        animate: { strokeDashoffset: c - c * pct / 100 },
        transition: { delay: 0.3, duration: 1, ease: "easeOut" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "ring-grad-sched", x1: "0", y1: "0", x2: "1", y2: "1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#8b5cf6" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#3b82f6" })
    ] }) })
  ] });
};
const Schedule = ({ data, onUpdateSchedule, onUpdateStudent, onAddSlot, onEditSlot, onDeleteSlot, onResetSchedule, onNavigate }) => {
  var _a, _b;
  const { preferences } = useTheme();
  const [selectedSlot, setSelectedSlot] = reactExports.useState(null);
  const [isEditingSlot, setIsEditingSlot] = reactExports.useState(false);
  const [editSlotData, setEditSlotData] = reactExports.useState(null);
  const [selectedDate, setSelectedDate] = reactExports.useState(null);
  const [view, setView] = useLocalStorage("schedule_view", "week");
  const [referenceDate, setReferenceDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [isTemplateMode, setIsTemplateMode] = reactExports.useState(false);
  const [showAddModal, setShowAddModal] = reactExports.useState(false);
  const [showSettings, setShowSettings] = reactExports.useState(false);
  const [isSyncing, setIsSyncing] = reactExports.useState(false);
  const { user } = useAuth();
  const [now, setNow] = reactExports.useState(/* @__PURE__ */ new Date());
  const [notifyStudents, setNotifyStudents] = reactExports.useState(false);
  const [customDuration, setCustomDuration] = reactExports.useState("");
  const scrollContainerRef = reactExports.useRef(null);
  const [isMobile, setIsMobile] = reactExports.useState(window.innerWidth < 768);
  const subjects = reactExports.useMemo(() => {
    return (preferences == null ? void 0 : preferences.customSubjects) && preferences.customSubjects.length > 0 ? preferences.customSubjects : ["Solar", "ICT"];
  }, [preferences == null ? void 0 : preferences.customSubjects]);
  const [gridDensity, setGridDensity] = useLocalStorage("schedule_density", "comfortable");
  const [showCompletedClasses, setShowCompletedClasses] = useLocalStorage("schedule_show_completed", true);
  const [classColors] = useLocalStorage("schedule_colors", {});
  const [enableAnimations, setEnableAnimations] = useLocalStorage("schedule_animations", true);
  reactExports.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  reactExports.useEffect(() => {
    const handleBackButton = (e) => {
      if (showSettings) {
        e.preventDefault();
        setShowSettings(false);
      } else if (showAddModal) {
        e.preventDefault();
        setShowAddModal(false);
      } else if (selectedSlot) {
        e.preventDefault();
        setSelectedSlot(null);
        setIsEditingSlot(false);
      } else if (confirmDialog.isOpen) {
        e.preventDefault();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener("app-back-button", handleBackButton);
    return () => window.removeEventListener("app-back-button", handleBackButton);
  }, [showSettings, showAddModal, selectedSlot, confirmDialog.isOpen]);
  const [confirmDialog, setConfirmDialog] = reactExports.useState({ isOpen: false, title: "", message: "", onConfirm: () => {
  } });
  reactExports.useEffect(() => {
    const timer = setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
    return () => clearInterval(timer);
  }, []);
  const scrollToNow = reactExports.useCallback(() => {
    if (scrollContainerRef.current) {
      const currentHour2 = (/* @__PURE__ */ new Date()).getHours();
      const hourHeight2 = gridDensity === "compact" ? 68 : 88;
      const targetScroll = Math.max(0, currentHour2 * hourHeight2 - 200);
      scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  }, [gridDensity]);
  reactExports.useEffect(() => {
    const t = setTimeout(scrollToNow, 300);
    return () => clearTimeout(t);
  }, [scrollToNow]);
  const syncToGoogle = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        const { successCount, failCount, updatedSchedule, lastEventLink } = await syncScheduleToGoogle(
          data.schedule,
          tokenResponse.access_token,
          weekDates
        );
        if (successCount === 0 && failCount === 0) {
          showToast("ℹ️ No classes found to sync for this week.", "info");
        } else if (failCount === 0) {
          showToast(`✅ Synced ${successCount} classes to Google Calendar!`, "success");
          const calendarUrl = `https://calendar.google.com/calendar/u/0/r/week`;
          window.open(calendarUrl, "_blank");
        } else {
          showToast(`⚠️ Synced ${successCount}, but ${failCount} failed. Check console (F12) for details.`, "warning");
        }
      } catch (error) {
        console.error("Google Calendar sync error:", error);
        showToast("Failed to sync. Please check your console (F12).", "error");
      } finally {
        setIsSyncing(false);
      }
    },
    scope: "https://www.googleapis.com/auth/calendar.events",
    onError: (errorResponse) => {
      console.error("Google Login error:", errorResponse);
      showToast(`Google Login Failed: ${errorResponse.error_description || "Unknown error"}`, "error");
      setIsSyncing(false);
    },
    onNonOAuthError: (nonOAuthError) => {
      console.error("Google Login Non-OAuth Error:", nonOAuthError);
      showToast("Google Login Error. Pop-up might have been blocked.", "error");
      setIsSyncing(false);
    }
  });
  const handlePrint = () => window.print();
  const handleDuplicateSlot = () => {
    if (!selectedSlot || !onAddSlot) return;
    const nextDay = selectedSlot.dayOfWeek % 7 + 1;
    const duplicate = {
      dayOfWeek: nextDay,
      startTime: selectedSlot.startTime,
      durationMinutes: selectedSlot.durationMinutes,
      grade: selectedSlot.grade,
      studentGroup: selectedSlot.studentGroup,
      subject: selectedSlot.subject,
      status: "Pending",
      resourceIds: selectedSlot.resourceIds
    };
    onAddSlot(duplicate);
    setSelectedSlot(null);
    showToast(`Class duplicated to ${DAYS[nextDay - 1]}`, "success");
  };
  const getStudentCount = reactExports.useCallback((slot) => {
    return data.students.filter((s) => s.grade === slot.grade && s.subject === slot.subject).length;
  }, [data.students]);
  const [newSlotGroup, setNewSlotGroup] = reactExports.useState("Academy");
  const [newSlotDurationMode, setNewSlotDurationMode] = reactExports.useState("preset");
  const [newSlot, setNewSlot] = reactExports.useState({
    dayOfWeek: 1,
    startTime: "09:00",
    durationMinutes: 60,
    subject: "Solar",
    grade: "L3",
    studentGroup: "Academy",
    status: "Pending"
  });
  const openAddModal = reactExports.useCallback(() => {
    const availableGroups = getStudentGroups(preferences == null ? void 0 : preferences.institutionType);
    const defaultGroup = availableGroups[0] || "Academy";
    const defaultLevel = getDefaultLevel(defaultGroup, preferences == null ? void 0 : preferences.institutionType);
    setNewSlotGroup(defaultGroup);
    setNewSlot({
      dayOfWeek: 1,
      startTime: "09:00",
      durationMinutes: 60,
      subject: (preferences == null ? void 0 : preferences.defaultSubject) || subjects[0] || "Solar",
      grade: defaultLevel,
      studentGroup: defaultGroup,
      status: "Pending"
    });
    setShowAddModal(true);
  }, [preferences, subjects]);
  const { showToast } = useToast();
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5
    }
  });
  const sensors = useSensors(pointerSensor, touchSensor);
  const handleSuggestSlot = () => {
    const bestTime = findBestSlot(newSlot.durationMinutes || 60, data.schedule);
    if (bestTime) {
      setNewSlot((prev) => ({ ...prev, startTime: bestTime }));
      showToast(`Found best time: ${bestTime}`, "success");
    } else {
      showToast("No clear slot found", "error");
    }
  };
  const handleDragEnd = (event) => {
    var _a2;
    const { active, over, delta } = event;
    if (!over) return;
    const activeSlot = (_a2 = active.data.current) == null ? void 0 : _a2.slot;
    const overId = over.id;
    const targetDayIndex = parseInt(overId.split("-")[1]);
    if (!activeSlot) return;
    const heightPerMinute = hourHeight / 60;
    const minutesDelta = Math.round(delta.y / heightPerMinute / 15) * 15;
    const [hours, mins] = activeSlot.startTime.split(":").map(Number);
    const currentMinutes = hours * 60 + mins;
    let newTotalMinutes = currentMinutes + minutesDelta;
    const minTime = 0;
    const maxTime = 23 * 60 + 45;
    newTotalMinutes = Math.max(minTime, Math.min(newTotalMinutes, maxTime));
    const newHours = Math.floor(newTotalMinutes / 60);
    const newMins = newTotalMinutes % 60;
    const newStartTime = `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
    if (activeSlot.dayOfWeek !== targetDayIndex || activeSlot.startTime !== newStartTime) {
      const targetDate = weekDates.find((d) => d.getDay() === targetDayIndex) || /* @__PURE__ */ new Date();
      const dateStr = getDateStr(targetDate);
      const existingSlotsOnTargetDay = data.schedule.filter((s) => {
        if (s.overrideDate === dateStr && s.status !== "Cancelled") return true;
        if (s.dayOfWeek === targetDayIndex && !s.overrideDate && s.status !== "Cancelled") {
          const isOverridden = data.schedule.some(
            (override) => override.replacesSlotId === s.id && override.overrideDate === dateStr
          );
          return !isOverridden;
        }
        return false;
      });
      const conflicts = detectConflicts({
        id: activeSlot.id,
        startTime: newStartTime,
        durationMinutes: activeSlot.durationMinutes,
        resourceIds: activeSlot.resourceIds
      }, existingSlotsOnTargetDay);
      const commitMove = () => {
        if (!activeSlot.overrideDate && onAddSlot) {
          const override = {
            ...activeSlot,
            overrideDate: dateStr,
            startTime: newStartTime,
            dayOfWeek: targetDayIndex,
            replacesSlotId: activeSlot.id,
            status: "Pending"
          };
          onAddSlot(override);
          showToast(`Class moved to ${dateStr} at ${newStartTime}`, "success");
        } else if (activeSlot.overrideDate && onAddSlot) {
          const override = {
            ...activeSlot,
            overrideDate: dateStr,
            startTime: newStartTime,
            dayOfWeek: targetDayIndex,
            replacesSlotId: activeSlot.replacesSlotId,
            status: "Pending"
          };
          onAddSlot(override);
          showToast(`Class rescheduled to ${newStartTime}`, "success");
        }
      };
      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map((c) => c.message).join("\n");
        setConfirmDialog({
          isOpen: true,
          title: "Conflicts Detected",
          message: `The following conflicts were found:
${conflictMessages}

Proceed anyway?`,
          onConfirm: () => {
            commitMove();
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        });
        return;
      }
      commitMove();
    }
  };
  const getDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const getMondayOfWeek = reactExports.useCallback((date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);
  const handleDateChange = (date) => {
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    setReferenceDate(newDate);
    setView("day");
  };
  const jumpToToday = () => {
    const d = /* @__PURE__ */ new Date();
    d.setHours(0, 0, 0, 0);
    setReferenceDate(d);
  };
  const shiftDate = (direction) => {
    const newDate = new Date(referenceDate);
    if (view === "week") newDate.setDate(newDate.getDate() + direction * 7);
    else newDate.setDate(newDate.getDate() + direction);
    setReferenceDate(newDate);
  };
  const weekDates = reactExports.useMemo(() => {
    const monday = getMondayOfWeek(referenceDate);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [referenceDate, getMondayOfWeek]);
  const displayedDates = view === "week" ? weekDates : [referenceDate];
  const getSlotDateContext = () => {
    if (selectedDate) return getDateStr(selectedDate);
    if (selectedSlot == null ? void 0 : selectedSlot.overrideDate) return selectedSlot.overrideDate;
    if (selectedSlot) {
      const d = weekDates.find((wd) => wd.getDay() === selectedSlot.dayOfWeek);
      return d ? getDateStr(d) : getDateStr(/* @__PURE__ */ new Date());
    }
    return getDateStr(/* @__PURE__ */ new Date());
  };
  const getVisibleSlots = (date) => {
    const dayOfWeek = date.getDay();
    const dateStr = getDateStr(date);
    const recurring = data.schedule.filter((s) => s.dayOfWeek === dayOfWeek && !s.overrideDate);
    if (isTemplateMode) return recurring;
    const overrides = data.schedule.filter((s) => s.overrideDate === dateStr);
    const replacedIds = new Set(overrides.filter((o) => o.replacesSlotId).map((o) => o.replacesSlotId));
    let result = [...recurring.filter((r) => !replacedIds.has(r.id)), ...overrides];
    if (!showCompletedClasses) result = result.filter((s) => s.status !== "Completed");
    return result;
  };
  const memoizedVisibleSlots = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const date of view === "week" ? weekDates : [referenceDate]) {
      map.set(getDateStr(date), getVisibleSlots(date));
    }
    return map;
  }, [weekDates, referenceDate, view, data.schedule, showCompletedClasses, isTemplateMode]);
  const getSlotColor = (slot) => {
    if (classColors[slot.id] !== void 0) {
      return CLASS_COLORS[classColors[slot.id]] || CLASS_COLORS[3];
    }
    const sub = slot.subject || "";
    let hash = 0;
    for (let i = 0; i < sub.length; i++) {
      hash = sub.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % CLASS_COLORS.length;
    return CLASS_COLORS[idx];
  };
  const handleStatusChange = (status, slotOverride) => {
    const slotToUpdate = slotOverride || selectedSlot;
    if (!slotToUpdate) return;
    if (isTemplateMode) {
      onUpdateSchedule(slotToUpdate.id, status);
      if (!slotOverride) setSelectedSlot({ ...slotToUpdate, status });
      showToast(`Template updated`, "success");
      return;
    }
    if (!slotToUpdate.overrideDate && onAddSlot) {
      const targetDateStr = slotOverride ? getSlotDateContextForSlot(slotToUpdate) : getSlotDateContext();
      const override = {
        ...slotToUpdate,
        status,
        overrideDate: targetDateStr,
        replacesSlotId: slotToUpdate.id
      };
      onAddSlot(override);
      if (!slotOverride) setSelectedSlot(null);
      showToast(`Class marked as ${status}`, "success");
    } else {
      onUpdateSchedule(slotToUpdate.id, status);
      if (!slotOverride) setSelectedSlot({ ...slotToUpdate, status });
      showToast(`Class marked as ${status}`, "success");
    }
  };
  const getSlotDateContextForSlot = (slot) => {
    const d = weekDates.find((wd) => wd.getDay() === slot.dayOfWeek);
    return d ? getDateStr(d) : getDateStr(/* @__PURE__ */ new Date());
  };
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const hourHeight = gridDensity === "compact" ? 68 : 88;
  const currentTimeTop = currentHour * hourHeight + currentMinute / 60 * hourHeight;
  reactExports.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const currentH = (/* @__PURE__ */ new Date()).getHours();
    const currentM = (/* @__PURE__ */ new Date()).getMinutes();
    const targetHour = Math.max(0, currentH - 1);
    const targetOffset = targetHour * hourHeight + currentM / 60 * hourHeight;
    const timeout = setTimeout(() => {
      container.scrollTo({ top: targetOffset, behavior: "smooth" });
    }, 300);
    return () => clearTimeout(timeout);
  }, [hourHeight]);
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showAddModal) setShowAddModal(false);
        else if (selectedSlot) setSelectedSlot(null);
        else if (confirmDialog.isOpen) setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if ((user == null ? void 0 : user.role) !== "viewer") openAddModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal, selectedSlot, confirmDialog.isOpen, user == null ? void 0 : user.role, openAddModal]);
  const miniCalendarDays = reactExports.useMemo(() => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < startPadding; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [referenceDate]);
  const daysWithClasses = reactExports.useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    if (!(data == null ? void 0 : data.schedule)) return set;
    data.schedule.forEach((s) => {
      if (s.overrideDate) set.add(s.overrideDate);
      else {
        miniCalendarDays.forEach((day) => {
          if (day && day.getDay() === s.dayOfWeek) set.add(getDateStr(day));
        });
      }
    });
    return set;
  }, [data.schedule, miniCalendarDays]);
  const weeklyStats = reactExports.useMemo(() => {
    let totalClasses = 0, completed = 0, pending = 0, cancelled = 0;
    if (!weekDates) return { totalClasses: 0, completed: 0, pending: 0, cancelled: 0, pct: 0 };
    weekDates.forEach((date) => {
      const slots = getVisibleSlots(date);
      totalClasses += slots.length;
      slots.forEach((s) => {
        if (s.status === "Completed") completed++;
        else if (s.status === "Cancelled") cancelled++;
        else pending++;
      });
    });
    const pct = totalClasses > 0 ? completed / totalClasses * 100 : 0;
    return { totalClasses, completed, pending, cancelled, pct };
  }, [weekDates, data.schedule, showCompletedClasses, isTemplateMode]);
  if (!data) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PageTransition, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full pb-20 lg:pb-0 flex flex-col bg-[var(--md-sys-color-surface)] overflow-hidden font-sans", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-3 md:p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 md:gap-4 flex-1 w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: isMobile ? 20 : 24 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg md:text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] truncate", children: "Schedule" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs md:text-sm text-[var(--md-sys-color-secondary)] hidden sm:block", children: "Manage classes & timetable" })
        ] }),
        isMobile && (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: openAddModal, "aria-label": "Add Class", className: "p-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl shadow-md flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center bg-[var(--md-sys-color-surface-variant)] p-0.5 md:p-1 rounded-lg md:rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setView("day"), "aria-label": "Day View", className: clsx("px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all", view === "day" ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]"), children: "Day" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setView("week"), "aria-label": "Week View", className: clsx("px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all", view === "week" ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]"), children: "Week" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 md:h-8 bg-[var(--md-sys-color-outline-variant)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handlePrint, "aria-label": "Print Schedule", className: "p-2 md:p-2.5 rounded-lg md:rounded-xl text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { size: isMobile ? 18 : 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowSettings(!showSettings), "aria-label": "Settings", className: clsx("p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors", showSettings ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { size: isMobile ? 18 : 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => syncToGoogle(), "aria-label": "Sync to Google Calendar", disabled: isSyncing, className: clsx("p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors", isSyncing ? "text-blue-500 bg-blue-50" : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: isMobile ? 18 : 20, className: clsx(isSyncing && "animate-spin") }) }),
        !isMobile && (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setIsTemplateMode(!isTemplateMode), className: clsx("px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", isTemplateMode ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)]"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 16 }),
            " ",
            isTemplateMode ? "Done Editing" : "Edit Template"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: openAddModal, className: "px-5 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 18 }),
            " Add Class"
          ] })
        ] })
      ] })
    ] }) }),
    isMobile && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 px-3 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] shadow-sm px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => shiftDate(-1), "aria-label": "Previous Day", className: "p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20, className: "text-[var(--md-sys-color-secondary)]" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: jumpToToday, className: "text-[10px] uppercase font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg hover:bg-violet-100", children: "Today" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-google font-bold text-[var(--md-sys-color-on-surface)]", children: referenceDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: scrollToNow, className: "text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 10 }),
          " Now"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => shiftDate(1), "aria-label": "Next Day", className: "p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 20, className: "text-[var(--md-sys-color-secondary)]" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex overflow-hidden px-3 md:px-6 pb-3 md:pb-6 gap-3 md:gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-72 flex-shrink-0 flex-col gap-6 hidden md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4 px-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-google font-bold text-[var(--md-sys-color-on-surface)]", children: referenceDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => shiftDate(-1), "aria-label": "Previous Week", className: "p-1 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 16, className: "text-[var(--md-sys-color-secondary)]" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: jumpToToday, "aria-label": "Go to Today", className: "text-[10px] uppercase font-bold text-violet-600 bg-violet-50 px-2 rounded-lg hover:bg-violet-100", children: "Today" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: scrollToNow, "aria-label": "Jump to Now Line", className: "text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 rounded-lg hover:bg-red-100 ml-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 10 }),
                " Now"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => shiftDate(1), "aria-label": "Next Week", className: "p-1 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, className: "text-[var(--md-sys-color-secondary)]" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-7 gap-y-2 text-center mb-2", children: [
            ["M", "T", "W", "T", "F", "S", "S"].map((d, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)]", children: d }, i)),
            miniCalendarDays.map((day, i) => {
              if (!day) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}, i);
              const dateStr = getDateStr(day);
              const isSelected = view === "week" ? weekDates.some((wd) => getDateStr(wd) === dateStr) : dateStr === getDateStr(referenceDate);
              const hasClasses = daysWithClasses.has(dateStr);
              const isToday = dateStr === getDateStr(/* @__PURE__ */ new Date());
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => handleDateChange(day),
                  "aria-label": `Select ${day.toDateString()}`,
                  tabIndex: 0,
                  className: clsx(
                    "w-8 h-8 rounded-full text-xs font-semibold mx-auto transition-all relative flex items-center justify-center focus-visible:ring-2 focus-visible:ring-violet-500",
                    isSelected ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 ring-1 ring-violet-300" : "hover:bg-[var(--md-sys-color-surface-variant)]",
                    isToday && !isSelected && "text-violet-600 font-bold",
                    !isSelected && !isToday && "text-[var(--md-sys-color-on-surface)]"
                  ),
                  children: [
                    day.getDate(),
                    hasClasses && !isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" })
                  ]
                },
                i
              );
            })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-6 flex flex-col items-center text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider w-full text-left mb-6", children: "This Week's Progress" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressRing, { pct: weeklyStats.pct, size: 110, stroke: 8 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-google font-black text-[var(--md-sys-color-on-surface)]", children: weeklyStats.completed }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-medium text-[var(--md-sys-color-secondary)] uppercase bg-[var(--md-sys-color-surface)] px-1 relative -top-1", children: [
                "of ",
                weeklyStats.totalClasses
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]/50 px-3 py-2 rounded-xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold flex items-center gap-2 text-green-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16 }),
                " Completed"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-green-700", children: weeklyStats.completed })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]/50 px-3 py-2 rounded-xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold flex items-center gap-2 text-amber-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 16 }),
                " Pending"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-amber-700", children: weeklyStats.pending })
            ] })
          ] })
        ] }),
        showSettings && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-4 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { size: 14 }),
            " Timetable Settings"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)]", children: "Grid Density" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-[var(--md-sys-color-surface-variant)] p-0.5 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setGridDensity("compact"),
                  className: clsx(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                    gridDensity === "compact" ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]"
                  ),
                  children: "Compact"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setGridDensity("comfortable"),
                  className: clsx(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                    gridDensity === "comfortable" ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]"
                  ),
                  children: "Comfortable"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)]", children: "Show Completed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: showCompletedClasses, onChange: () => setShowCompletedClasses(!showCompletedClasses), className: "w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)]" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)]", children: "Animations" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: enableAnimations, onChange: () => setEnableAnimations(!enableAnimations), className: "w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)]" })
          ] }),
          onResetSchedule && (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-3 border-t border-[var(--md-sys-color-outline-variant)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  setConfirmDialog({
                    isOpen: true,
                    title: "Factory Reset Timetable?",
                    message: "This will delete ALL custom classes and restore the default timetable template. This cannot be undone. Continue?",
                    onConfirm: () => {
                      if (onResetSchedule) onResetSchedule();
                      setShowSettings(false);
                      showToast("Timetable reset to factory defaults", "info");
                    }
                  });
                },
                className: "w-full px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl flex items-center justify-center gap-2 text-red-600 font-bold text-sm transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16 }),
                  " Factory Reset Timetable"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-[var(--md-sys-color-secondary)] mt-2 text-center", children: "Restores the default schedule template" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between px-2 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)] cursor-pointer flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: showCompletedClasses, onChange: () => setShowCompletedClasses(!showCompletedClasses), className: "w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)]" }),
          "Show Completed"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 flex flex-col bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm overflow-hidden relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DndContext, { sensors, onDragEnd: handleDragEnd, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col overflow-x-auto overflow-y-hidden select-none touch-pan-x", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("flex-1 flex flex-col", view === "week" && "min-w-[850px] md:min-w-0"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("grid border-b border-[var(--md-sys-color-outline-variant)] flex-shrink-0 bg-[var(--md-sys-color-surface)] z-10", view === "week" ? "grid-cols-[50px_repeat(7,1fr)] md:grid-cols-[70px_repeat(7,1fr)]" : "grid-cols-[50px_1fr] md:grid-cols-[70px_1fr]"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 md:h-16 border-r border-[var(--md-sys-color-outline-variant)] flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] md:text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest", children: "GMT+3" }) }),
          displayedDates.map((date) => {
            const isToday = getDateStr(date) === getDateStr(/* @__PURE__ */ new Date());
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-12 md:h-16 flex flex-col items-center justify-center border-r border-[var(--md-sys-color-outline-variant)] relative", children: [
              isToday && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 w-full h-1 bg-violet-500 rounded-t-xl" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-[10px] md:text-xs font-medium uppercase tracking-wider", isToday ? "text-violet-600" : "text-[var(--md-sys-color-secondary)]"), children: date.toLocaleDateString("en-US", { weekday: "short" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-base md:text-xl font-google font-bold mt-0.5", isToday ? "text-violet-700" : "text-[var(--md-sys-color-on-surface)]"), children: date.getDate() })
            ] }, date.toString());
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollContainerRef, className: "flex-1 overflow-y-auto relative bg-[var(--md-sys-color-surface)] hide-scrollbar bg-grid-pattern", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("grid min-h-full", view === "week" ? "grid-cols-[50px_repeat(7,1fr)] md:grid-cols-[70px_repeat(7,1fr)]" : "grid-cols-[50px_1fr] md:grid-cols-[70px_1fr]"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-r border-[var(--md-sys-color-outline-variant)] relative bg-[var(--md-sys-color-surface-variant)]/30", children: FULL_DAY_HOURS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] md:text-xs text-[var(--md-sys-color-secondary)] text-right pr-1.5 md:pr-3 -mt-2 font-medium", style: { height: hourHeight }, children: t }, t)) }),
          displayedDates.map((date, dateIdx) => {
            const slots = memoizedVisibleSlots.get(getDateStr(date)) || [];
            const isToday = getDateStr(date) === getDateStr(/* @__PURE__ */ new Date());
            const holiday = isHoliday(date, data.holidays || []);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              DroppableDayColumn,
              {
                date,
                dateIdx,
                hourHeight,
                holiday,
                children: [
                  FULL_DAY_HOURS.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "absolute w-full border-t border-[var(--md-sys-color-outline-variant)] border-dashed opacity-50",
                      style: { top: i * hourHeight }
                    },
                    i
                  )),
                  isToday && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute left-0 right-0 z-20 flex items-center pointer-events-none group", style: { top: currentTimeTop }, "aria-current": "time", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-sm ring-4 ring-[var(--md-sys-color-surface)] relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity", children: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
                  ] }),
                  slots.map((slot) => {
                    const startHour = parseInt(slot.startTime.split(":")[0]);
                    const startMin = parseInt(slot.startTime.split(":")[1] || "0");
                    const top = startHour * hourHeight + startMin / 60 * hourHeight;
                    const height = slot.durationMinutes / 60 * hourHeight;
                    const color = getSlotColor(slot);
                    const isOverride = !!slot.overrideDate;
                    const isCompleted = slot.status === "Completed";
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(
                      DraggableSlot,
                      {
                        slot,
                        hourHeight,
                        onSlotClick: () => {
                          setSelectedSlot(slot);
                          setIsEditingSlot(false);
                          setSelectedDate(date);
                        },
                        disabled: (user == null ? void 0 : user.role) === "viewer",
                        className: clsx(
                          "rounded-2xl border-l-[6px] p-2.5 cursor-pointer overflow-hidden backdrop-blur-md transition-all group flex flex-col justify-between absolute left-1 right-2",
                          color.bg,
                          color.border,
                          isCompleted ? "opacity-60 saturate-50" : "shadow-sm shadow-black/5 dark:shadow-black/20",
                          isOverride && !isTemplateMode && "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900",
                          isTemplateMode && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900 border-dashed"
                        ),
                        style: { top, height: height - 4 },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start gap-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("font-bold text-sm leading-tight flex items-center gap-1.5 truncate", color.text), children: [
                              getSubjectIcon(slot.subject, 14),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: slot.subject })
                            ] }),
                            (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-shrink-0 flex items-center gap-0.5 z-20", children: [
                              onDeleteSlot && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  "aria-label": "Delete class",
                                  title: "Delete class",
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: "Delete Class?",
                                      message: "Are you sure you want to permanently delete this class from your schedule?",
                                      onConfirm: () => {
                                        onDeleteSlot(slot.id);
                                        showToast("Class deleted", "success");
                                      }
                                    });
                                  },
                                  className: "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/60 dark:bg-black/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-[var(--md-sys-color-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100",
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12 })
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  "aria-label": "Toggle Complete Status",
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    handleStatusChange(isCompleted ? "Pending" : "Completed", slot);
                                  },
                                  className: clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110",
                                    isCompleted ? "bg-green-500 text-white" : "bg-white/60 dark:bg-black/20 hover:bg-green-100 text-[var(--md-sys-color-secondary)] opacity-0 group-hover:opacity-100"
                                  ),
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, strokeWidth: isCompleted ? 3 : 2 })
                                }
                              )
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("text-xs font-semibold mt-0.5", color.text, "opacity-80"), children: [
                            getLevelShortLabel(slot.studentGroup || "Academy", String(slot.grade)),
                            " • ",
                            slot.startTime
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mt-auto pt-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx("flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md", color.text, "bg-white/40 dark:bg-black/20"), children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 10 }),
                              " ",
                              getStudentCount(slot)
                            ] }),
                            isOverride && /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 10, className: "text-blue-500 ml-auto" })
                          ] })
                        ] })
                      },
                      slot.id
                    );
                  })
                ]
              },
              dateIdx
            );
          })
        ] }) })
      ] }) }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AnimatePresence, { children: [
      showAddModal && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setShowAddModal(false), className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.95 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.95 },
            className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[420px] max-h-[85vh] overflow-y-auto bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl shadow-2xl z-50 border border-[var(--md-sys-color-outline-variant)]",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-gradient-to-r from-violet-500 to-indigo-600" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl font-google font-bold text-[var(--md-sys-color-on-surface)] mb-6 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 24, className: "text-violet-600" }),
                  " New Class Session"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2", children: "Subject" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: subjects.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { "aria-pressed": newSlot.subject === s, onClick: () => setNewSlot({ ...newSlot, subject: s }), className: clsx("px-4 py-2.5 rounded-2xl font-bold text-sm border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlot.subject === s ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"), children: [
                      getSubjectEmoji(s),
                      " ",
                      s
                    ] }, s)) })
                  ] }),
                  getStudentGroups(preferences == null ? void 0 : preferences.institutionType).length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2", children: "Student Group" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: getStudentGroups(preferences == null ? void 0 : preferences.institutionType).map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-pressed": newSlotGroup === g, onClick: () => {
                      setNewSlotGroup(g);
                      setNewSlot({ ...newSlot, grade: getDefaultLevel(g, preferences == null ? void 0 : preferences.institutionType), studentGroup: g });
                    }, className: clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlotGroup === g ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"), children: g }, g)) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2", children: ((_a = preferences == null ? void 0 : preferences.terminology) == null ? void 0 : _a.classLabel) || "Level" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: getLevelsForGroup(newSlotGroup, preferences == null ? void 0 : preferences.institutionType).map((lvl) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-pressed": newSlot.grade === lvl.id, onClick: () => setNewSlot({ ...newSlot, grade: lvl.id }), className: clsx("px-3 py-2.5 rounded-2xl font-bold text-sm border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlot.grade === lvl.id ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"), children: lvl.shortLabel }, lvl.id)) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2", children: "Day" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("select", { "aria-label": "Select Day", value: newSlot.dayOfWeek, onChange: (e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) }), className: "w-full px-4 py-3 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none cursor-pointer", children: DAYS.map((d, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: i + 1, children: d }, i)) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Time" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSuggestSlot, className: "text-[10px] text-violet-600 font-bold hover:underline py-0.5 px-1 rounded focus-visible:ring-2", children: "Auto-fill" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("select", { "aria-label": "Select Time", value: newSlot.startTime, onChange: (e) => setNewSlot({ ...newSlot, startTime: e.target.value }), className: "w-full px-4 py-3 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none cursor-pointer", children: TIME_OPTIONS_15MIN.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t, children: t }, t)) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2", children: "Duration" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
                      DURATION_OPTIONS.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          "aria-pressed": newSlotDurationMode === "preset" && newSlot.durationMinutes === d,
                          onClick: () => {
                            setNewSlotDurationMode("preset");
                            setNewSlot({ ...newSlot, durationMinutes: d });
                          },
                          className: clsx(
                            "px-3 py-2 rounded-xl font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500",
                            newSlotDurationMode === "preset" && newSlot.durationMinutes === d ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                          ),
                          children: [
                            d,
                            " min"
                          ]
                        },
                        d
                      )),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          "aria-pressed": newSlotDurationMode === "custom",
                          onClick: () => setNewSlotDurationMode("custom"),
                          className: clsx(
                            "px-3 py-2 rounded-xl font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500",
                            newSlotDurationMode === "custom" ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                          ),
                          children: "Custom"
                        }
                      )
                    ] }),
                    newSlotDurationMode === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "number",
                        min: 5,
                        max: 480,
                        placeholder: "Minutes",
                        "aria-label": "Custom duration in minutes",
                        value: customDuration,
                        onChange: (e) => {
                          const v = parseInt(e.target.value);
                          setCustomDuration(e.target.value === "" ? "" : v);
                          if (!isNaN(v) && v > 0) setNewSlot({ ...newSlot, durationMinutes: v });
                        },
                        className: "mt-2 w-full px-4 py-3 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-8 pt-6 border-t border-[var(--md-sys-color-outline-variant)]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowAddModal(false), className: "flex-1 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl font-bold hover:bg-[var(--md-sys-color-outline-variant)] transition-colors focus-visible:ring-2 focus-visible:ring-violet-500", children: "Cancel" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
                    if (onAddSlot) onAddSlot(newSlot);
                    setShowAddModal(false);
                    showToast("Class Created", "success");
                  }, className: "flex-1 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl font-bold shadow-md hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--md-sys-color-primary)]", children: "Create" })
                ] })
              ] })
            ]
          }
        )
      ] }),
      selectedSlot && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setSelectedSlot(null), className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.95, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: 20 },
            className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[400px] max-h-[85vh] overflow-y-auto bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl shadow-2xl z-50 border border-[var(--md-sys-color-outline-variant)]",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("h-3 w-full", getSlotColor(selectedSlot).dot) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: isEditingSlot && editSlotData ? (
                // EDIT MODE
                /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-6", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 24, className: "text-violet-600" }),
                      " Edit Class Details"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIsEditingSlot(false), "aria-label": "Cancel Edit", className: "p-2 bg-[var(--md-sys-color-surface-variant)] rounded-full hover:bg-[var(--md-sys-color-outline-variant)] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 20, className: "text-[var(--md-sys-color-secondary)]" }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5", children: "Subject" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: subjects.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { "aria-pressed": editSlotData.subject === s, onClick: () => setEditSlotData({ ...editSlotData, subject: s }), className: clsx("px-3 py-2 rounded-xl font-bold text-sm border transition-all", editSlotData.subject === s ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"), children: [
                        getSubjectEmoji(s),
                        " ",
                        s
                      ] }, s)) })
                    ] }),
                    getStudentGroups(preferences == null ? void 0 : preferences.institutionType).length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5", children: "Student Group" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: getStudentGroups(preferences == null ? void 0 : preferences.institutionType).map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          "aria-pressed": editSlotData.studentGroup === g,
                          onClick: () => setEditSlotData({ ...editSlotData, studentGroup: g, grade: getDefaultLevel(g, preferences == null ? void 0 : preferences.institutionType) }),
                          className: clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all", editSlotData.studentGroup === g ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"),
                          children: g
                        },
                        g
                      )) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5", children: ((_b = preferences == null ? void 0 : preferences.terminology) == null ? void 0 : _b.classLabel) || "Level" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: getLevelsForGroup(editSlotData.studentGroup || "Academy", preferences == null ? void 0 : preferences.institutionType).map((lvl) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          "aria-pressed": editSlotData.grade === lvl.id,
                          onClick: () => setEditSlotData({ ...editSlotData, grade: lvl.id }),
                          className: clsx("px-3 py-2 rounded-xl font-bold text-sm border transition-all", editSlotData.grade === lvl.id ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"),
                          children: lvl.shortLabel
                        },
                        lvl.id
                      )) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5", children: "Day" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { "aria-label": "Select Day", value: editSlotData.dayOfWeek, onChange: (e) => setEditSlotData({ ...editSlotData, dayOfWeek: parseInt(e.target.value) }), className: "w-full px-3 py-2.5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer", children: DAYS.map((d, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: i + 1, children: d }, i)) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5", children: "Time" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { "aria-label": "Select Time", value: editSlotData.startTime, onChange: (e) => setEditSlotData({ ...editSlotData, startTime: e.target.value }), className: "w-full px-3 py-2.5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer", children: TIME_OPTIONS_15MIN.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t, children: t }, t)) })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5", children: "Duration" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: DURATION_OPTIONS.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          "aria-pressed": editSlotData.durationMinutes === d,
                          onClick: () => setEditSlotData({ ...editSlotData, durationMinutes: d }),
                          className: clsx(
                            "px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500",
                            editSlotData.durationMinutes === d ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                          ),
                          children: [
                            d,
                            "m"
                          ]
                        },
                        d
                      )) }),
                      !DURATION_OPTIONS.includes(editSlotData.durationMinutes) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "number",
                          min: 5,
                          max: 480,
                          "aria-label": "Custom duration in minutes",
                          value: editSlotData.durationMinutes,
                          onChange: (e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v) && v > 0) setEditSlotData({ ...editSlotData, durationMinutes: v });
                          },
                          className: "mt-2 w-full px-3 py-2 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl border border-violet-100 dark:border-violet-800/30", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 16, className: "text-violet-600" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-violet-900 dark:text-violet-300", children: "Notify students of changes" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", "aria-label": "Notify students", checked: notifyStudents, onChange: (e) => setNotifyStudents(e.target.checked), className: "w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)] cursor-pointer" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIsEditingSlot(false), className: "flex-1 py-2.5 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold transition-colors", children: "Cancel" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: async () => {
                      if (onEditSlot) onEditSlot(editSlotData);
                      setSelectedSlot(editSlotData);
                      setIsEditingSlot(false);
                      if (notifyStudents) {
                        showToast("Broadcasting schedule update...", "info");
                        const success = await notificationService.sendRemoteNotification({
                          title: "Schedule Update",
                          body: `Your ${editSlotData.subject} class on ${DAYS[editSlotData.dayOfWeek - 1]} at ${editSlotData.startTime} has been updated.`,
                          type: "push"
                        });
                        if (success) showToast("Students notified", "success");
                      }
                    }, className: "flex-1 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold shadow-md transition-all", children: "Save Changes" })
                  ] })
                ] })
              ) : (
                // VIEW MODE
                /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-6", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2", children: [
                        getSubjectIconLarge(selectedSlot.subject, 24),
                        selectedSlot.subject,
                        " Class"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-[var(--md-sys-color-secondary)] mt-1", children: [
                        getLevelShortLabel(selectedSlot.studentGroup || "Academy", String(selectedSlot.grade)),
                        " • ",
                        selectedDate == null ? void 0 : selectedDate.toLocaleDateString("en-US", { weekday: "long" }),
                        " • ",
                        selectedSlot.startTime
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedSlot(null), "aria-label": "Close Details", className: "p-2 bg-[var(--md-sys-color-surface-variant)] rounded-full hover:bg-[var(--md-sys-color-outline-variant)] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 20, className: "text-[var(--md-sys-color-secondary)]" }) })
                  ] }),
                  (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 mb-6", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleStatusChange("Completed"), className: clsx("flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all focus-visible:ring-2", selectedSlot.status === "Completed" ? "bg-green-100 text-green-800 ring-2 ring-green-400" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-outline-variant)]"), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 24 }),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold uppercase", children: "Complete" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleStatusChange("Pending"), className: clsx("flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all focus-visible:ring-2", selectedSlot.status === "Pending" ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-outline-variant)]"), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 24 }),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold uppercase", children: "Pending" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleStatusChange("Cancelled"), className: clsx("flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all focus-visible:ring-2", selectedSlot.status === "Cancelled" ? "bg-red-100 text-red-800 ring-2 ring-red-400" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-outline-variant)]"), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 24 }),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold uppercase", children: "Cancel" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border-t border-[var(--md-sys-color-outline-variant)] pt-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
                      setSelectedSlot(null);
                      onNavigate == null ? void 0 : onNavigate("attendance");
                    }, className: "w-full text-left px-4 py-3 bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-outline-variant)] rounded-2xl flex items-center justify-between text-[var(--md-sys-color-on-surface)] font-bold transition-colors", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 18, className: "text-violet-500" }),
                        " View Attendance (",
                        getStudentCount(selectedSlot),
                        ")"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 16, className: "text-[var(--md-sys-color-secondary)]" })
                    ] }),
                    (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
                        setEditSlotData(selectedSlot);
                        setIsEditingSlot(true);
                      }, className: "flex-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-primary-container)] rounded-2xl flex items-center justify-center gap-2 text-[var(--md-sys-color-on-surface)] font-bold transition-colors", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 18 }),
                        " Edit Details"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleDuplicateSlot, className: "flex-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-primary-container)] rounded-2xl flex items-center justify-center gap-2 text-[var(--md-sys-color-on-surface)] font-bold transition-colors", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 18 }),
                        " Duplicate"
                      ] }),
                      onDeleteSlot && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
                        setConfirmDialog({
                          isOpen: true,
                          title: "Delete Class Permanently?",
                          message: "Are you sure you want to permanently delete this class?",
                          onConfirm: () => {
                            onDeleteSlot(selectedSlot.id);
                            setSelectedSlot(null);
                            showToast("Class deleted", "success");
                          }
                        });
                      }, className: "px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-bold transition-colors", title: "Delete this class", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 18 }) })
                    ] })
                  ] })
                ] })
              ) })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: confirmDialog.isOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })), className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0, scale: 0.95, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 20 },
          className: "fixed inset-0 m-auto w-full max-w-sm h-fit bg-[var(--md-sys-color-surface)] dark:bg-slate-900 rounded-[28px] shadow-2xl z-50 border border-[var(--md-sys-color-outline-variant)] overflow-hidden",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 32, className: "text-red-600 dark:text-red-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-google font-bold text-center text-[var(--md-sys-color-on-surface)] mb-3", children: confirmDialog.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[15px] leading-relaxed text-center text-[var(--md-sys-color-secondary)] mb-8", children: confirmDialog.message }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })), className: "flex-1 px-4 py-3.5 rounded-2xl font-bold bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] transition-all", children: "Cancel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
                confirmDialog.onConfirm();
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
              }, className: "flex-1 px-4 py-3.5 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all", children: "Confirm" })
            ] })
          ] })
        }
      )
    ] }) })
  ] }) });
};
export {
  Schedule as default
};
