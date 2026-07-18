(() => {
  // node_modules/@hotwired/stimulus/dist/stimulus.js
  var EventListener = class {
    constructor(eventTarget, eventName, eventOptions) {
      this.eventTarget = eventTarget;
      this.eventName = eventName;
      this.eventOptions = eventOptions;
      this.unorderedBindings = /* @__PURE__ */ new Set();
    }
    connect() {
      this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
    }
    disconnect() {
      this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
    }
    bindingConnected(binding) {
      this.unorderedBindings.add(binding);
    }
    bindingDisconnected(binding) {
      this.unorderedBindings.delete(binding);
    }
    handleEvent(event) {
      const extendedEvent = extendEvent(event);
      for (const binding of this.bindings) {
        if (extendedEvent.immediatePropagationStopped) {
          break;
        } else {
          binding.handleEvent(extendedEvent);
        }
      }
    }
    hasBindings() {
      return this.unorderedBindings.size > 0;
    }
    get bindings() {
      return Array.from(this.unorderedBindings).sort((left, right) => {
        const leftIndex = left.index, rightIndex = right.index;
        return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
      });
    }
  };
  function extendEvent(event) {
    if ("immediatePropagationStopped" in event) {
      return event;
    } else {
      const { stopImmediatePropagation } = event;
      return Object.assign(event, {
        immediatePropagationStopped: false,
        stopImmediatePropagation() {
          this.immediatePropagationStopped = true;
          stopImmediatePropagation.call(this);
        }
      });
    }
  }
  var Dispatcher = class {
    constructor(application2) {
      this.application = application2;
      this.eventListenerMaps = /* @__PURE__ */ new Map();
      this.started = false;
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.eventListeners.forEach((eventListener) => eventListener.connect());
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.eventListeners.forEach((eventListener) => eventListener.disconnect());
      }
    }
    get eventListeners() {
      return Array.from(this.eventListenerMaps.values()).reduce((listeners, map) => listeners.concat(Array.from(map.values())), []);
    }
    bindingConnected(binding) {
      this.fetchEventListenerForBinding(binding).bindingConnected(binding);
    }
    bindingDisconnected(binding, clearEventListeners = false) {
      this.fetchEventListenerForBinding(binding).bindingDisconnected(binding);
      if (clearEventListeners)
        this.clearEventListenersForBinding(binding);
    }
    handleError(error2, message, detail = {}) {
      this.application.handleError(error2, `Error ${message}`, detail);
    }
    clearEventListenersForBinding(binding) {
      const eventListener = this.fetchEventListenerForBinding(binding);
      if (!eventListener.hasBindings()) {
        eventListener.disconnect();
        this.removeMappedEventListenerFor(binding);
      }
    }
    removeMappedEventListenerFor(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      eventListenerMap.delete(cacheKey);
      if (eventListenerMap.size == 0)
        this.eventListenerMaps.delete(eventTarget);
    }
    fetchEventListenerForBinding(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      return this.fetchEventListener(eventTarget, eventName, eventOptions);
    }
    fetchEventListener(eventTarget, eventName, eventOptions) {
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      let eventListener = eventListenerMap.get(cacheKey);
      if (!eventListener) {
        eventListener = this.createEventListener(eventTarget, eventName, eventOptions);
        eventListenerMap.set(cacheKey, eventListener);
      }
      return eventListener;
    }
    createEventListener(eventTarget, eventName, eventOptions) {
      const eventListener = new EventListener(eventTarget, eventName, eventOptions);
      if (this.started) {
        eventListener.connect();
      }
      return eventListener;
    }
    fetchEventListenerMapForEventTarget(eventTarget) {
      let eventListenerMap = this.eventListenerMaps.get(eventTarget);
      if (!eventListenerMap) {
        eventListenerMap = /* @__PURE__ */ new Map();
        this.eventListenerMaps.set(eventTarget, eventListenerMap);
      }
      return eventListenerMap;
    }
    cacheKey(eventName, eventOptions) {
      const parts = [eventName];
      Object.keys(eventOptions).sort().forEach((key2) => {
        parts.push(`${eventOptions[key2] ? "" : "!"}${key2}`);
      });
      return parts.join(":");
    }
  };
  var defaultActionDescriptorFilters = {
    stop({ event, value }) {
      if (value)
        event.stopPropagation();
      return true;
    },
    prevent({ event, value }) {
      if (value)
        event.preventDefault();
      return true;
    },
    self({ event, value, element }) {
      if (value) {
        return element === event.target;
      } else {
        return true;
      }
    }
  };
  var descriptorPattern = /^(?:(?:([^.]+?)\+)?(.+?)(?:\.(.+?))?(?:@(window|document))?->)?(.+?)(?:#([^:]+?))(?::(.+))?$/;
  function parseActionDescriptorString(descriptorString) {
    const source = descriptorString.trim();
    const matches = source.match(descriptorPattern) || [];
    let eventName = matches[2];
    let keyFilter = matches[3];
    if (keyFilter && !["keydown", "keyup", "keypress"].includes(eventName)) {
      eventName += `.${keyFilter}`;
      keyFilter = "";
    }
    return {
      eventTarget: parseEventTarget(matches[4]),
      eventName,
      eventOptions: matches[7] ? parseEventOptions(matches[7]) : {},
      identifier: matches[5],
      methodName: matches[6],
      keyFilter: matches[1] || keyFilter
    };
  }
  function parseEventTarget(eventTargetName) {
    if (eventTargetName == "window") {
      return window;
    } else if (eventTargetName == "document") {
      return document;
    }
  }
  function parseEventOptions(eventOptions) {
    return eventOptions.split(":").reduce((options, token) => Object.assign(options, { [token.replace(/^!/, "")]: !/^!/.test(token) }), {});
  }
  function stringifyEventTarget(eventTarget) {
    if (eventTarget == window) {
      return "window";
    } else if (eventTarget == document) {
      return "document";
    }
  }
  function camelize(value) {
    return value.replace(/(?:[_-])([a-z0-9])/g, (_, char) => char.toUpperCase());
  }
  function namespaceCamelize(value) {
    return camelize(value.replace(/--/g, "-").replace(/__/g, "_"));
  }
  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function dasherize(value) {
    return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`);
  }
  function tokenize(value) {
    return value.match(/[^\s]+/g) || [];
  }
  function isSomething(object) {
    return object !== null && object !== void 0;
  }
  function hasProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  }
  var allModifiers = ["meta", "ctrl", "alt", "shift"];
  var Action = class {
    constructor(element, index, descriptor, schema) {
      this.element = element;
      this.index = index;
      this.eventTarget = descriptor.eventTarget || element;
      this.eventName = descriptor.eventName || getDefaultEventNameForElement(element) || error("missing event name");
      this.eventOptions = descriptor.eventOptions || {};
      this.identifier = descriptor.identifier || error("missing identifier");
      this.methodName = descriptor.methodName || error("missing method name");
      this.keyFilter = descriptor.keyFilter || "";
      this.schema = schema;
    }
    static forToken(token, schema) {
      return new this(token.element, token.index, parseActionDescriptorString(token.content), schema);
    }
    toString() {
      const eventFilter = this.keyFilter ? `.${this.keyFilter}` : "";
      const eventTarget = this.eventTargetName ? `@${this.eventTargetName}` : "";
      return `${this.eventName}${eventFilter}${eventTarget}->${this.identifier}#${this.methodName}`;
    }
    shouldIgnoreKeyboardEvent(event) {
      if (!this.keyFilter) {
        return false;
      }
      const filters = this.keyFilter.split("+");
      if (this.keyFilterDissatisfied(event, filters)) {
        return true;
      }
      const standardFilter = filters.filter((key2) => !allModifiers.includes(key2))[0];
      if (!standardFilter) {
        return false;
      }
      if (!hasProperty(this.keyMappings, standardFilter)) {
        error(`contains unknown key filter: ${this.keyFilter}`);
      }
      return this.keyMappings[standardFilter].toLowerCase() !== event.key.toLowerCase();
    }
    shouldIgnoreMouseEvent(event) {
      if (!this.keyFilter) {
        return false;
      }
      const filters = [this.keyFilter];
      if (this.keyFilterDissatisfied(event, filters)) {
        return true;
      }
      return false;
    }
    get params() {
      const params = {};
      const pattern = new RegExp(`^data-${this.identifier}-(.+)-param$`, "i");
      for (const { name, value } of Array.from(this.element.attributes)) {
        const match = name.match(pattern);
        const key2 = match && match[1];
        if (key2) {
          params[camelize(key2)] = typecast(value);
        }
      }
      return params;
    }
    get eventTargetName() {
      return stringifyEventTarget(this.eventTarget);
    }
    get keyMappings() {
      return this.schema.keyMappings;
    }
    keyFilterDissatisfied(event, filters) {
      const [meta, ctrl, alt, shift] = allModifiers.map((modifier) => filters.includes(modifier));
      return event.metaKey !== meta || event.ctrlKey !== ctrl || event.altKey !== alt || event.shiftKey !== shift;
    }
  };
  var defaultEventNames = {
    a: () => "click",
    button: () => "click",
    form: () => "submit",
    details: () => "toggle",
    input: (e) => e.getAttribute("type") == "submit" ? "click" : "input",
    select: () => "change",
    textarea: () => "input"
  };
  function getDefaultEventNameForElement(element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName in defaultEventNames) {
      return defaultEventNames[tagName](element);
    }
  }
  function error(message) {
    throw new Error(message);
  }
  function typecast(value) {
    try {
      return JSON.parse(value);
    } catch (o_O) {
      return value;
    }
  }
  var Binding = class {
    constructor(context, action) {
      this.context = context;
      this.action = action;
    }
    get index() {
      return this.action.index;
    }
    get eventTarget() {
      return this.action.eventTarget;
    }
    get eventOptions() {
      return this.action.eventOptions;
    }
    get identifier() {
      return this.context.identifier;
    }
    handleEvent(event) {
      const actionEvent = this.prepareActionEvent(event);
      if (this.willBeInvokedByEvent(event) && this.applyEventModifiers(actionEvent)) {
        this.invokeWithEvent(actionEvent);
      }
    }
    get eventName() {
      return this.action.eventName;
    }
    get method() {
      const method = this.controller[this.methodName];
      if (typeof method == "function") {
        return method;
      }
      throw new Error(`Action "${this.action}" references undefined method "${this.methodName}"`);
    }
    applyEventModifiers(event) {
      const { element } = this.action;
      const { actionDescriptorFilters } = this.context.application;
      const { controller } = this.context;
      let passes = true;
      for (const [name, value] of Object.entries(this.eventOptions)) {
        if (name in actionDescriptorFilters) {
          const filter = actionDescriptorFilters[name];
          passes = passes && filter({ name, value, event, element, controller });
        } else {
          continue;
        }
      }
      return passes;
    }
    prepareActionEvent(event) {
      return Object.assign(event, { params: this.action.params });
    }
    invokeWithEvent(event) {
      const { target, currentTarget } = event;
      try {
        this.method.call(this.controller, event);
        this.context.logDebugActivity(this.methodName, { event, target, currentTarget, action: this.methodName });
      } catch (error2) {
        const { identifier, controller, element, index } = this;
        const detail = { identifier, controller, element, index, event };
        this.context.handleError(error2, `invoking action "${this.action}"`, detail);
      }
    }
    willBeInvokedByEvent(event) {
      const eventTarget = event.target;
      if (event instanceof KeyboardEvent && this.action.shouldIgnoreKeyboardEvent(event)) {
        return false;
      }
      if (event instanceof MouseEvent && this.action.shouldIgnoreMouseEvent(event)) {
        return false;
      }
      if (this.element === eventTarget) {
        return true;
      } else if (eventTarget instanceof Element && this.element.contains(eventTarget)) {
        return this.scope.containsElement(eventTarget);
      } else {
        return this.scope.containsElement(this.action.element);
      }
    }
    get controller() {
      return this.context.controller;
    }
    get methodName() {
      return this.action.methodName;
    }
    get element() {
      return this.scope.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  var ElementObserver = class {
    constructor(element, delegate) {
      this.mutationObserverInit = { attributes: true, childList: true, subtree: true };
      this.element = element;
      this.started = false;
      this.delegate = delegate;
      this.elements = /* @__PURE__ */ new Set();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.refresh();
      }
    }
    pause(callback) {
      if (this.started) {
        this.mutationObserver.disconnect();
        this.started = false;
      }
      callback();
      if (!this.started) {
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        const matches = new Set(this.matchElementsInTree());
        for (const element of Array.from(this.elements)) {
          if (!matches.has(element)) {
            this.removeElement(element);
          }
        }
        for (const element of Array.from(matches)) {
          this.addElement(element);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      if (mutation.type == "attributes") {
        this.processAttributeChange(mutation.target, mutation.attributeName);
      } else if (mutation.type == "childList") {
        this.processRemovedNodes(mutation.removedNodes);
        this.processAddedNodes(mutation.addedNodes);
      }
    }
    processAttributeChange(element, attributeName) {
      if (this.elements.has(element)) {
        if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
          this.delegate.elementAttributeChanged(element, attributeName);
        } else {
          this.removeElement(element);
        }
      } else if (this.matchElement(element)) {
        this.addElement(element);
      }
    }
    processRemovedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element) {
          this.processTree(element, this.removeElement);
        }
      }
    }
    processAddedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element && this.elementIsActive(element)) {
          this.processTree(element, this.addElement);
        }
      }
    }
    matchElement(element) {
      return this.delegate.matchElement(element);
    }
    matchElementsInTree(tree = this.element) {
      return this.delegate.matchElementsInTree(tree);
    }
    processTree(tree, processor) {
      for (const element of this.matchElementsInTree(tree)) {
        processor.call(this, element);
      }
    }
    elementFromNode(node) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        return node;
      }
    }
    elementIsActive(element) {
      if (element.isConnected != this.element.isConnected) {
        return false;
      } else {
        return this.element.contains(element);
      }
    }
    addElement(element) {
      if (!this.elements.has(element)) {
        if (this.elementIsActive(element)) {
          this.elements.add(element);
          if (this.delegate.elementMatched) {
            this.delegate.elementMatched(element);
          }
        }
      }
    }
    removeElement(element) {
      if (this.elements.has(element)) {
        this.elements.delete(element);
        if (this.delegate.elementUnmatched) {
          this.delegate.elementUnmatched(element);
        }
      }
    }
  };
  var AttributeObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeName = attributeName;
      this.delegate = delegate;
      this.elementObserver = new ElementObserver(element, this);
    }
    get element() {
      return this.elementObserver.element;
    }
    get selector() {
      return `[${this.attributeName}]`;
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get started() {
      return this.elementObserver.started;
    }
    matchElement(element) {
      return element.hasAttribute(this.attributeName);
    }
    matchElementsInTree(tree) {
      const match = this.matchElement(tree) ? [tree] : [];
      const matches = Array.from(tree.querySelectorAll(this.selector));
      return match.concat(matches);
    }
    elementMatched(element) {
      if (this.delegate.elementMatchedAttribute) {
        this.delegate.elementMatchedAttribute(element, this.attributeName);
      }
    }
    elementUnmatched(element) {
      if (this.delegate.elementUnmatchedAttribute) {
        this.delegate.elementUnmatchedAttribute(element, this.attributeName);
      }
    }
    elementAttributeChanged(element, attributeName) {
      if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
        this.delegate.elementAttributeValueChanged(element, attributeName);
      }
    }
  };
  function add(map, key2, value) {
    fetch(map, key2).add(value);
  }
  function del(map, key2, value) {
    fetch(map, key2).delete(value);
    prune(map, key2);
  }
  function fetch(map, key2) {
    let values = map.get(key2);
    if (!values) {
      values = /* @__PURE__ */ new Set();
      map.set(key2, values);
    }
    return values;
  }
  function prune(map, key2) {
    const values = map.get(key2);
    if (values != null && values.size == 0) {
      map.delete(key2);
    }
  }
  var Multimap = class {
    constructor() {
      this.valuesByKey = /* @__PURE__ */ new Map();
    }
    get keys() {
      return Array.from(this.valuesByKey.keys());
    }
    get values() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((values, set) => values.concat(Array.from(set)), []);
    }
    get size() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((size, set) => size + set.size, 0);
    }
    add(key2, value) {
      add(this.valuesByKey, key2, value);
    }
    delete(key2, value) {
      del(this.valuesByKey, key2, value);
    }
    has(key2, value) {
      const values = this.valuesByKey.get(key2);
      return values != null && values.has(value);
    }
    hasKey(key2) {
      return this.valuesByKey.has(key2);
    }
    hasValue(value) {
      const sets = Array.from(this.valuesByKey.values());
      return sets.some((set) => set.has(value));
    }
    getValuesForKey(key2) {
      const values = this.valuesByKey.get(key2);
      return values ? Array.from(values) : [];
    }
    getKeysForValue(value) {
      return Array.from(this.valuesByKey).filter(([_key, values]) => values.has(value)).map(([key2, _values]) => key2);
    }
  };
  var SelectorObserver = class {
    constructor(element, selector, delegate, details) {
      this._selector = selector;
      this.details = details;
      this.elementObserver = new ElementObserver(element, this);
      this.delegate = delegate;
      this.matchesByElement = new Multimap();
    }
    get started() {
      return this.elementObserver.started;
    }
    get selector() {
      return this._selector;
    }
    set selector(selector) {
      this._selector = selector;
      this.refresh();
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get element() {
      return this.elementObserver.element;
    }
    matchElement(element) {
      const { selector } = this;
      if (selector) {
        const matches = element.matches(selector);
        if (this.delegate.selectorMatchElement) {
          return matches && this.delegate.selectorMatchElement(element, this.details);
        }
        return matches;
      } else {
        return false;
      }
    }
    matchElementsInTree(tree) {
      const { selector } = this;
      if (selector) {
        const match = this.matchElement(tree) ? [tree] : [];
        const matches = Array.from(tree.querySelectorAll(selector)).filter((match2) => this.matchElement(match2));
        return match.concat(matches);
      } else {
        return [];
      }
    }
    elementMatched(element) {
      const { selector } = this;
      if (selector) {
        this.selectorMatched(element, selector);
      }
    }
    elementUnmatched(element) {
      const selectors = this.matchesByElement.getKeysForValue(element);
      for (const selector of selectors) {
        this.selectorUnmatched(element, selector);
      }
    }
    elementAttributeChanged(element, _attributeName) {
      const { selector } = this;
      if (selector) {
        const matches = this.matchElement(element);
        const matchedBefore = this.matchesByElement.has(selector, element);
        if (matches && !matchedBefore) {
          this.selectorMatched(element, selector);
        } else if (!matches && matchedBefore) {
          this.selectorUnmatched(element, selector);
        }
      }
    }
    selectorMatched(element, selector) {
      this.delegate.selectorMatched(element, selector, this.details);
      this.matchesByElement.add(selector, element);
    }
    selectorUnmatched(element, selector) {
      this.delegate.selectorUnmatched(element, selector, this.details);
      this.matchesByElement.delete(selector, element);
    }
  };
  var StringMapObserver = class {
    constructor(element, delegate) {
      this.element = element;
      this.delegate = delegate;
      this.started = false;
      this.stringMap = /* @__PURE__ */ new Map();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, { attributes: true, attributeOldValue: true });
        this.refresh();
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        for (const attributeName of this.knownAttributeNames) {
          this.refreshAttribute(attributeName, null);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      const attributeName = mutation.attributeName;
      if (attributeName) {
        this.refreshAttribute(attributeName, mutation.oldValue);
      }
    }
    refreshAttribute(attributeName, oldValue) {
      const key2 = this.delegate.getStringMapKeyForAttribute(attributeName);
      if (key2 != null) {
        if (!this.stringMap.has(attributeName)) {
          this.stringMapKeyAdded(key2, attributeName);
        }
        const value = this.element.getAttribute(attributeName);
        if (this.stringMap.get(attributeName) != value) {
          this.stringMapValueChanged(value, key2, oldValue);
        }
        if (value == null) {
          const oldValue2 = this.stringMap.get(attributeName);
          this.stringMap.delete(attributeName);
          if (oldValue2)
            this.stringMapKeyRemoved(key2, attributeName, oldValue2);
        } else {
          this.stringMap.set(attributeName, value);
        }
      }
    }
    stringMapKeyAdded(key2, attributeName) {
      if (this.delegate.stringMapKeyAdded) {
        this.delegate.stringMapKeyAdded(key2, attributeName);
      }
    }
    stringMapValueChanged(value, key2, oldValue) {
      if (this.delegate.stringMapValueChanged) {
        this.delegate.stringMapValueChanged(value, key2, oldValue);
      }
    }
    stringMapKeyRemoved(key2, attributeName, oldValue) {
      if (this.delegate.stringMapKeyRemoved) {
        this.delegate.stringMapKeyRemoved(key2, attributeName, oldValue);
      }
    }
    get knownAttributeNames() {
      return Array.from(new Set(this.currentAttributeNames.concat(this.recordedAttributeNames)));
    }
    get currentAttributeNames() {
      return Array.from(this.element.attributes).map((attribute) => attribute.name);
    }
    get recordedAttributeNames() {
      return Array.from(this.stringMap.keys());
    }
  };
  var TokenListObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeObserver = new AttributeObserver(element, attributeName, this);
      this.delegate = delegate;
      this.tokensByElement = new Multimap();
    }
    get started() {
      return this.attributeObserver.started;
    }
    start() {
      this.attributeObserver.start();
    }
    pause(callback) {
      this.attributeObserver.pause(callback);
    }
    stop() {
      this.attributeObserver.stop();
    }
    refresh() {
      this.attributeObserver.refresh();
    }
    get element() {
      return this.attributeObserver.element;
    }
    get attributeName() {
      return this.attributeObserver.attributeName;
    }
    elementMatchedAttribute(element) {
      this.tokensMatched(this.readTokensForElement(element));
    }
    elementAttributeValueChanged(element) {
      const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element);
      this.tokensUnmatched(unmatchedTokens);
      this.tokensMatched(matchedTokens);
    }
    elementUnmatchedAttribute(element) {
      this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
    }
    tokensMatched(tokens) {
      tokens.forEach((token) => this.tokenMatched(token));
    }
    tokensUnmatched(tokens) {
      tokens.forEach((token) => this.tokenUnmatched(token));
    }
    tokenMatched(token) {
      this.delegate.tokenMatched(token);
      this.tokensByElement.add(token.element, token);
    }
    tokenUnmatched(token) {
      this.delegate.tokenUnmatched(token);
      this.tokensByElement.delete(token.element, token);
    }
    refreshTokensForElement(element) {
      const previousTokens = this.tokensByElement.getValuesForKey(element);
      const currentTokens = this.readTokensForElement(element);
      const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken));
      if (firstDifferingIndex == -1) {
        return [[], []];
      } else {
        return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
      }
    }
    readTokensForElement(element) {
      const attributeName = this.attributeName;
      const tokenString = element.getAttribute(attributeName) || "";
      return parseTokenString(tokenString, element, attributeName);
    }
  };
  function parseTokenString(tokenString, element, attributeName) {
    return tokenString.trim().split(/\s+/).filter((content) => content.length).map((content, index) => ({ element, attributeName, content, index }));
  }
  function zip(left, right) {
    const length = Math.max(left.length, right.length);
    return Array.from({ length }, (_, index) => [left[index], right[index]]);
  }
  function tokensAreEqual(left, right) {
    return left && right && left.index == right.index && left.content == right.content;
  }
  var ValueListObserver = class {
    constructor(element, attributeName, delegate) {
      this.tokenListObserver = new TokenListObserver(element, attributeName, this);
      this.delegate = delegate;
      this.parseResultsByToken = /* @__PURE__ */ new WeakMap();
      this.valuesByTokenByElement = /* @__PURE__ */ new WeakMap();
    }
    get started() {
      return this.tokenListObserver.started;
    }
    start() {
      this.tokenListObserver.start();
    }
    stop() {
      this.tokenListObserver.stop();
    }
    refresh() {
      this.tokenListObserver.refresh();
    }
    get element() {
      return this.tokenListObserver.element;
    }
    get attributeName() {
      return this.tokenListObserver.attributeName;
    }
    tokenMatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).set(token, value);
        this.delegate.elementMatchedValue(element, value);
      }
    }
    tokenUnmatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).delete(token);
        this.delegate.elementUnmatchedValue(element, value);
      }
    }
    fetchParseResultForToken(token) {
      let parseResult = this.parseResultsByToken.get(token);
      if (!parseResult) {
        parseResult = this.parseToken(token);
        this.parseResultsByToken.set(token, parseResult);
      }
      return parseResult;
    }
    fetchValuesByTokenForElement(element) {
      let valuesByToken = this.valuesByTokenByElement.get(element);
      if (!valuesByToken) {
        valuesByToken = /* @__PURE__ */ new Map();
        this.valuesByTokenByElement.set(element, valuesByToken);
      }
      return valuesByToken;
    }
    parseToken(token) {
      try {
        const value = this.delegate.parseValueForToken(token);
        return { value };
      } catch (error2) {
        return { error: error2 };
      }
    }
  };
  var BindingObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.bindingsByAction = /* @__PURE__ */ new Map();
    }
    start() {
      if (!this.valueListObserver) {
        this.valueListObserver = new ValueListObserver(this.element, this.actionAttribute, this);
        this.valueListObserver.start();
      }
    }
    stop() {
      if (this.valueListObserver) {
        this.valueListObserver.stop();
        delete this.valueListObserver;
        this.disconnectAllActions();
      }
    }
    get element() {
      return this.context.element;
    }
    get identifier() {
      return this.context.identifier;
    }
    get actionAttribute() {
      return this.schema.actionAttribute;
    }
    get schema() {
      return this.context.schema;
    }
    get bindings() {
      return Array.from(this.bindingsByAction.values());
    }
    connectAction(action) {
      const binding = new Binding(this.context, action);
      this.bindingsByAction.set(action, binding);
      this.delegate.bindingConnected(binding);
    }
    disconnectAction(action) {
      const binding = this.bindingsByAction.get(action);
      if (binding) {
        this.bindingsByAction.delete(action);
        this.delegate.bindingDisconnected(binding);
      }
    }
    disconnectAllActions() {
      this.bindings.forEach((binding) => this.delegate.bindingDisconnected(binding, true));
      this.bindingsByAction.clear();
    }
    parseValueForToken(token) {
      const action = Action.forToken(token, this.schema);
      if (action.identifier == this.identifier) {
        return action;
      }
    }
    elementMatchedValue(element, action) {
      this.connectAction(action);
    }
    elementUnmatchedValue(element, action) {
      this.disconnectAction(action);
    }
  };
  var ValueObserver = class {
    constructor(context, receiver) {
      this.context = context;
      this.receiver = receiver;
      this.stringMapObserver = new StringMapObserver(this.element, this);
      this.valueDescriptorMap = this.controller.valueDescriptorMap;
    }
    start() {
      this.stringMapObserver.start();
      this.invokeChangedCallbacksForDefaultValues();
    }
    stop() {
      this.stringMapObserver.stop();
    }
    get element() {
      return this.context.element;
    }
    get controller() {
      return this.context.controller;
    }
    getStringMapKeyForAttribute(attributeName) {
      if (attributeName in this.valueDescriptorMap) {
        return this.valueDescriptorMap[attributeName].name;
      }
    }
    stringMapKeyAdded(key2, attributeName) {
      const descriptor = this.valueDescriptorMap[attributeName];
      if (!this.hasValue(key2)) {
        this.invokeChangedCallback(key2, descriptor.writer(this.receiver[key2]), descriptor.writer(descriptor.defaultValue));
      }
    }
    stringMapValueChanged(value, name, oldValue) {
      const descriptor = this.valueDescriptorNameMap[name];
      if (value === null)
        return;
      if (oldValue === null) {
        oldValue = descriptor.writer(descriptor.defaultValue);
      }
      this.invokeChangedCallback(name, value, oldValue);
    }
    stringMapKeyRemoved(key2, attributeName, oldValue) {
      const descriptor = this.valueDescriptorNameMap[key2];
      if (this.hasValue(key2)) {
        this.invokeChangedCallback(key2, descriptor.writer(this.receiver[key2]), oldValue);
      } else {
        this.invokeChangedCallback(key2, descriptor.writer(descriptor.defaultValue), oldValue);
      }
    }
    invokeChangedCallbacksForDefaultValues() {
      for (const { key: key2, name, defaultValue, writer } of this.valueDescriptors) {
        if (defaultValue != void 0 && !this.controller.data.has(key2)) {
          this.invokeChangedCallback(name, writer(defaultValue), void 0);
        }
      }
    }
    invokeChangedCallback(name, rawValue, rawOldValue) {
      const changedMethodName = `${name}Changed`;
      const changedMethod = this.receiver[changedMethodName];
      if (typeof changedMethod == "function") {
        const descriptor = this.valueDescriptorNameMap[name];
        try {
          const value = descriptor.reader(rawValue);
          let oldValue = rawOldValue;
          if (rawOldValue) {
            oldValue = descriptor.reader(rawOldValue);
          }
          changedMethod.call(this.receiver, value, oldValue);
        } catch (error2) {
          if (error2 instanceof TypeError) {
            error2.message = `Stimulus Value "${this.context.identifier}.${descriptor.name}" - ${error2.message}`;
          }
          throw error2;
        }
      }
    }
    get valueDescriptors() {
      const { valueDescriptorMap } = this;
      return Object.keys(valueDescriptorMap).map((key2) => valueDescriptorMap[key2]);
    }
    get valueDescriptorNameMap() {
      const descriptors = {};
      Object.keys(this.valueDescriptorMap).forEach((key2) => {
        const descriptor = this.valueDescriptorMap[key2];
        descriptors[descriptor.name] = descriptor;
      });
      return descriptors;
    }
    hasValue(attributeName) {
      const descriptor = this.valueDescriptorNameMap[attributeName];
      const hasMethodName = `has${capitalize(descriptor.name)}`;
      return this.receiver[hasMethodName];
    }
  };
  var TargetObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.targetsByName = new Multimap();
    }
    start() {
      if (!this.tokenListObserver) {
        this.tokenListObserver = new TokenListObserver(this.element, this.attributeName, this);
        this.tokenListObserver.start();
      }
    }
    stop() {
      if (this.tokenListObserver) {
        this.disconnectAllTargets();
        this.tokenListObserver.stop();
        delete this.tokenListObserver;
      }
    }
    tokenMatched({ element, content: name }) {
      if (this.scope.containsElement(element)) {
        this.connectTarget(element, name);
      }
    }
    tokenUnmatched({ element, content: name }) {
      this.disconnectTarget(element, name);
    }
    connectTarget(element, name) {
      var _a;
      if (!this.targetsByName.has(name, element)) {
        this.targetsByName.add(name, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetConnected(element, name));
      }
    }
    disconnectTarget(element, name) {
      var _a;
      if (this.targetsByName.has(name, element)) {
        this.targetsByName.delete(name, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetDisconnected(element, name));
      }
    }
    disconnectAllTargets() {
      for (const name of this.targetsByName.keys) {
        for (const element of this.targetsByName.getValuesForKey(name)) {
          this.disconnectTarget(element, name);
        }
      }
    }
    get attributeName() {
      return `data-${this.context.identifier}-target`;
    }
    get element() {
      return this.context.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  function readInheritableStaticArrayValues(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return Array.from(ancestors.reduce((values, constructor2) => {
      getOwnStaticArrayValues(constructor2, propertyName).forEach((name) => values.add(name));
      return values;
    }, /* @__PURE__ */ new Set()));
  }
  function readInheritableStaticObjectPairs(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return ancestors.reduce((pairs, constructor2) => {
      pairs.push(...getOwnStaticObjectPairs(constructor2, propertyName));
      return pairs;
    }, []);
  }
  function getAncestorsForConstructor(constructor) {
    const ancestors = [];
    while (constructor) {
      ancestors.push(constructor);
      constructor = Object.getPrototypeOf(constructor);
    }
    return ancestors.reverse();
  }
  function getOwnStaticArrayValues(constructor, propertyName) {
    const definition = constructor[propertyName];
    return Array.isArray(definition) ? definition : [];
  }
  function getOwnStaticObjectPairs(constructor, propertyName) {
    const definition = constructor[propertyName];
    return definition ? Object.keys(definition).map((key2) => [key2, definition[key2]]) : [];
  }
  var OutletObserver = class {
    constructor(context, delegate) {
      this.started = false;
      this.context = context;
      this.delegate = delegate;
      this.outletsByName = new Multimap();
      this.outletElementsByName = new Multimap();
      this.selectorObserverMap = /* @__PURE__ */ new Map();
      this.attributeObserverMap = /* @__PURE__ */ new Map();
    }
    start() {
      if (!this.started) {
        this.outletDefinitions.forEach((outletName) => {
          this.setupSelectorObserverForOutlet(outletName);
          this.setupAttributeObserverForOutlet(outletName);
        });
        this.started = true;
        this.dependentContexts.forEach((context) => context.refresh());
      }
    }
    refresh() {
      this.selectorObserverMap.forEach((observer) => observer.refresh());
      this.attributeObserverMap.forEach((observer) => observer.refresh());
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.disconnectAllOutlets();
        this.stopSelectorObservers();
        this.stopAttributeObservers();
      }
    }
    stopSelectorObservers() {
      if (this.selectorObserverMap.size > 0) {
        this.selectorObserverMap.forEach((observer) => observer.stop());
        this.selectorObserverMap.clear();
      }
    }
    stopAttributeObservers() {
      if (this.attributeObserverMap.size > 0) {
        this.attributeObserverMap.forEach((observer) => observer.stop());
        this.attributeObserverMap.clear();
      }
    }
    selectorMatched(element, _selector, { outletName }) {
      const outlet = this.getOutlet(element, outletName);
      if (outlet) {
        this.connectOutlet(outlet, element, outletName);
      }
    }
    selectorUnmatched(element, _selector, { outletName }) {
      const outlet = this.getOutletFromMap(element, outletName);
      if (outlet) {
        this.disconnectOutlet(outlet, element, outletName);
      }
    }
    selectorMatchElement(element, { outletName }) {
      const selector = this.selector(outletName);
      const hasOutlet = this.hasOutlet(element, outletName);
      const hasOutletController = element.matches(`[${this.schema.controllerAttribute}~=${outletName}]`);
      if (selector) {
        return hasOutlet && hasOutletController && element.matches(selector);
      } else {
        return false;
      }
    }
    elementMatchedAttribute(_element, attributeName) {
      const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
      if (outletName) {
        this.updateSelectorObserverForOutlet(outletName);
      }
    }
    elementAttributeValueChanged(_element, attributeName) {
      const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
      if (outletName) {
        this.updateSelectorObserverForOutlet(outletName);
      }
    }
    elementUnmatchedAttribute(_element, attributeName) {
      const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
      if (outletName) {
        this.updateSelectorObserverForOutlet(outletName);
      }
    }
    connectOutlet(outlet, element, outletName) {
      var _a;
      if (!this.outletElementsByName.has(outletName, element)) {
        this.outletsByName.add(outletName, outlet);
        this.outletElementsByName.add(outletName, element);
        (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletConnected(outlet, element, outletName));
      }
    }
    disconnectOutlet(outlet, element, outletName) {
      var _a;
      if (this.outletElementsByName.has(outletName, element)) {
        this.outletsByName.delete(outletName, outlet);
        this.outletElementsByName.delete(outletName, element);
        (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletDisconnected(outlet, element, outletName));
      }
    }
    disconnectAllOutlets() {
      for (const outletName of this.outletElementsByName.keys) {
        for (const element of this.outletElementsByName.getValuesForKey(outletName)) {
          for (const outlet of this.outletsByName.getValuesForKey(outletName)) {
            this.disconnectOutlet(outlet, element, outletName);
          }
        }
      }
    }
    updateSelectorObserverForOutlet(outletName) {
      const observer = this.selectorObserverMap.get(outletName);
      if (observer) {
        observer.selector = this.selector(outletName);
      }
    }
    setupSelectorObserverForOutlet(outletName) {
      const selector = this.selector(outletName);
      const selectorObserver = new SelectorObserver(document.body, selector, this, { outletName });
      this.selectorObserverMap.set(outletName, selectorObserver);
      selectorObserver.start();
    }
    setupAttributeObserverForOutlet(outletName) {
      const attributeName = this.attributeNameForOutletName(outletName);
      const attributeObserver = new AttributeObserver(this.scope.element, attributeName, this);
      this.attributeObserverMap.set(outletName, attributeObserver);
      attributeObserver.start();
    }
    selector(outletName) {
      return this.scope.outlets.getSelectorForOutletName(outletName);
    }
    attributeNameForOutletName(outletName) {
      return this.scope.schema.outletAttributeForScope(this.identifier, outletName);
    }
    getOutletNameFromOutletAttributeName(attributeName) {
      return this.outletDefinitions.find((outletName) => this.attributeNameForOutletName(outletName) === attributeName);
    }
    get outletDependencies() {
      const dependencies = new Multimap();
      this.router.modules.forEach((module) => {
        const constructor = module.definition.controllerConstructor;
        const outlets = readInheritableStaticArrayValues(constructor, "outlets");
        outlets.forEach((outlet) => dependencies.add(outlet, module.identifier));
      });
      return dependencies;
    }
    get outletDefinitions() {
      return this.outletDependencies.getKeysForValue(this.identifier);
    }
    get dependentControllerIdentifiers() {
      return this.outletDependencies.getValuesForKey(this.identifier);
    }
    get dependentContexts() {
      const identifiers = this.dependentControllerIdentifiers;
      return this.router.contexts.filter((context) => identifiers.includes(context.identifier));
    }
    hasOutlet(element, outletName) {
      return !!this.getOutlet(element, outletName) || !!this.getOutletFromMap(element, outletName);
    }
    getOutlet(element, outletName) {
      return this.application.getControllerForElementAndIdentifier(element, outletName);
    }
    getOutletFromMap(element, outletName) {
      return this.outletsByName.getValuesForKey(outletName).find((outlet) => outlet.element === element);
    }
    get scope() {
      return this.context.scope;
    }
    get schema() {
      return this.context.schema;
    }
    get identifier() {
      return this.context.identifier;
    }
    get application() {
      return this.context.application;
    }
    get router() {
      return this.application.router;
    }
  };
  var Context = class {
    constructor(module, scope2) {
      this.logDebugActivity = (functionName, detail = {}) => {
        const { identifier, controller, element } = this;
        detail = Object.assign({ identifier, controller, element }, detail);
        this.application.logDebugActivity(this.identifier, functionName, detail);
      };
      this.module = module;
      this.scope = scope2;
      this.controller = new module.controllerConstructor(this);
      this.bindingObserver = new BindingObserver(this, this.dispatcher);
      this.valueObserver = new ValueObserver(this, this.controller);
      this.targetObserver = new TargetObserver(this, this);
      this.outletObserver = new OutletObserver(this, this);
      try {
        this.controller.initialize();
        this.logDebugActivity("initialize");
      } catch (error2) {
        this.handleError(error2, "initializing controller");
      }
    }
    connect() {
      this.bindingObserver.start();
      this.valueObserver.start();
      this.targetObserver.start();
      this.outletObserver.start();
      try {
        this.controller.connect();
        this.logDebugActivity("connect");
      } catch (error2) {
        this.handleError(error2, "connecting controller");
      }
    }
    refresh() {
      this.outletObserver.refresh();
    }
    disconnect() {
      try {
        this.controller.disconnect();
        this.logDebugActivity("disconnect");
      } catch (error2) {
        this.handleError(error2, "disconnecting controller");
      }
      this.outletObserver.stop();
      this.targetObserver.stop();
      this.valueObserver.stop();
      this.bindingObserver.stop();
    }
    get application() {
      return this.module.application;
    }
    get identifier() {
      return this.module.identifier;
    }
    get schema() {
      return this.application.schema;
    }
    get dispatcher() {
      return this.application.dispatcher;
    }
    get element() {
      return this.scope.element;
    }
    get parentElement() {
      return this.element.parentElement;
    }
    handleError(error2, message, detail = {}) {
      const { identifier, controller, element } = this;
      detail = Object.assign({ identifier, controller, element }, detail);
      this.application.handleError(error2, `Error ${message}`, detail);
    }
    targetConnected(element, name) {
      this.invokeControllerMethod(`${name}TargetConnected`, element);
    }
    targetDisconnected(element, name) {
      this.invokeControllerMethod(`${name}TargetDisconnected`, element);
    }
    outletConnected(outlet, element, name) {
      this.invokeControllerMethod(`${namespaceCamelize(name)}OutletConnected`, outlet, element);
    }
    outletDisconnected(outlet, element, name) {
      this.invokeControllerMethod(`${namespaceCamelize(name)}OutletDisconnected`, outlet, element);
    }
    invokeControllerMethod(methodName, ...args) {
      const controller = this.controller;
      if (typeof controller[methodName] == "function") {
        controller[methodName](...args);
      }
    }
  };
  function bless(constructor) {
    return shadow(constructor, getBlessedProperties(constructor));
  }
  function shadow(constructor, properties) {
    const shadowConstructor = extend(constructor);
    const shadowProperties = getShadowProperties(constructor.prototype, properties);
    Object.defineProperties(shadowConstructor.prototype, shadowProperties);
    return shadowConstructor;
  }
  function getBlessedProperties(constructor) {
    const blessings = readInheritableStaticArrayValues(constructor, "blessings");
    return blessings.reduce((blessedProperties, blessing) => {
      const properties = blessing(constructor);
      for (const key2 in properties) {
        const descriptor = blessedProperties[key2] || {};
        blessedProperties[key2] = Object.assign(descriptor, properties[key2]);
      }
      return blessedProperties;
    }, {});
  }
  function getShadowProperties(prototype, properties) {
    return getOwnKeys(properties).reduce((shadowProperties, key2) => {
      const descriptor = getShadowedDescriptor(prototype, properties, key2);
      if (descriptor) {
        Object.assign(shadowProperties, { [key2]: descriptor });
      }
      return shadowProperties;
    }, {});
  }
  function getShadowedDescriptor(prototype, properties, key2) {
    const shadowingDescriptor = Object.getOwnPropertyDescriptor(prototype, key2);
    const shadowedByValue = shadowingDescriptor && "value" in shadowingDescriptor;
    if (!shadowedByValue) {
      const descriptor = Object.getOwnPropertyDescriptor(properties, key2).value;
      if (shadowingDescriptor) {
        descriptor.get = shadowingDescriptor.get || descriptor.get;
        descriptor.set = shadowingDescriptor.set || descriptor.set;
      }
      return descriptor;
    }
  }
  var getOwnKeys = (() => {
    if (typeof Object.getOwnPropertySymbols == "function") {
      return (object) => [...Object.getOwnPropertyNames(object), ...Object.getOwnPropertySymbols(object)];
    } else {
      return Object.getOwnPropertyNames;
    }
  })();
  var extend = (() => {
    function extendWithReflect(constructor) {
      function extended() {
        return Reflect.construct(constructor, arguments, new.target);
      }
      extended.prototype = Object.create(constructor.prototype, {
        constructor: { value: extended }
      });
      Reflect.setPrototypeOf(extended, constructor);
      return extended;
    }
    function testReflectExtension() {
      const a = function() {
        this.a.call(this);
      };
      const b = extendWithReflect(a);
      b.prototype.a = function() {
      };
      return new b();
    }
    try {
      testReflectExtension();
      return extendWithReflect;
    } catch (error2) {
      return (constructor) => class extended extends constructor {
      };
    }
  })();
  function blessDefinition(definition) {
    return {
      identifier: definition.identifier,
      controllerConstructor: bless(definition.controllerConstructor)
    };
  }
  var Module = class {
    constructor(application2, definition) {
      this.application = application2;
      this.definition = blessDefinition(definition);
      this.contextsByScope = /* @__PURE__ */ new WeakMap();
      this.connectedContexts = /* @__PURE__ */ new Set();
    }
    get identifier() {
      return this.definition.identifier;
    }
    get controllerConstructor() {
      return this.definition.controllerConstructor;
    }
    get contexts() {
      return Array.from(this.connectedContexts);
    }
    connectContextForScope(scope2) {
      const context = this.fetchContextForScope(scope2);
      this.connectedContexts.add(context);
      context.connect();
    }
    disconnectContextForScope(scope2) {
      const context = this.contextsByScope.get(scope2);
      if (context) {
        this.connectedContexts.delete(context);
        context.disconnect();
      }
    }
    fetchContextForScope(scope2) {
      let context = this.contextsByScope.get(scope2);
      if (!context) {
        context = new Context(this, scope2);
        this.contextsByScope.set(scope2, context);
      }
      return context;
    }
  };
  var ClassMap = class {
    constructor(scope2) {
      this.scope = scope2;
    }
    has(name) {
      return this.data.has(this.getDataKey(name));
    }
    get(name) {
      return this.getAll(name)[0];
    }
    getAll(name) {
      const tokenString = this.data.get(this.getDataKey(name)) || "";
      return tokenize(tokenString);
    }
    getAttributeName(name) {
      return this.data.getAttributeNameForKey(this.getDataKey(name));
    }
    getDataKey(name) {
      return `${name}-class`;
    }
    get data() {
      return this.scope.data;
    }
  };
  var DataMap = class {
    constructor(scope2) {
      this.scope = scope2;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get(key2) {
      const name = this.getAttributeNameForKey(key2);
      return this.element.getAttribute(name);
    }
    set(key2, value) {
      const name = this.getAttributeNameForKey(key2);
      this.element.setAttribute(name, value);
      return this.get(key2);
    }
    has(key2) {
      const name = this.getAttributeNameForKey(key2);
      return this.element.hasAttribute(name);
    }
    delete(key2) {
      if (this.has(key2)) {
        const name = this.getAttributeNameForKey(key2);
        this.element.removeAttribute(name);
        return true;
      } else {
        return false;
      }
    }
    getAttributeNameForKey(key2) {
      return `data-${this.identifier}-${dasherize(key2)}`;
    }
  };
  var Guide = class {
    constructor(logger) {
      this.warnedKeysByObject = /* @__PURE__ */ new WeakMap();
      this.logger = logger;
    }
    warn(object, key2, message) {
      let warnedKeys = this.warnedKeysByObject.get(object);
      if (!warnedKeys) {
        warnedKeys = /* @__PURE__ */ new Set();
        this.warnedKeysByObject.set(object, warnedKeys);
      }
      if (!warnedKeys.has(key2)) {
        warnedKeys.add(key2);
        this.logger.warn(message, object);
      }
    }
  };
  function attributeValueContainsToken(attributeName, token) {
    return `[${attributeName}~="${token}"]`;
  }
  var TargetSet = class {
    constructor(scope2) {
      this.scope = scope2;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get schema() {
      return this.scope.schema;
    }
    has(targetName) {
      return this.find(targetName) != null;
    }
    find(...targetNames) {
      return targetNames.reduce((target, targetName) => target || this.findTarget(targetName) || this.findLegacyTarget(targetName), void 0);
    }
    findAll(...targetNames) {
      return targetNames.reduce((targets, targetName) => [
        ...targets,
        ...this.findAllTargets(targetName),
        ...this.findAllLegacyTargets(targetName)
      ], []);
    }
    findTarget(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findElement(selector);
    }
    findAllTargets(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findAllElements(selector);
    }
    getSelectorForTargetName(targetName) {
      const attributeName = this.schema.targetAttributeForScope(this.identifier);
      return attributeValueContainsToken(attributeName, targetName);
    }
    findLegacyTarget(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.deprecate(this.scope.findElement(selector), targetName);
    }
    findAllLegacyTargets(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.scope.findAllElements(selector).map((element) => this.deprecate(element, targetName));
    }
    getLegacySelectorForTargetName(targetName) {
      const targetDescriptor = `${this.identifier}.${targetName}`;
      return attributeValueContainsToken(this.schema.targetAttribute, targetDescriptor);
    }
    deprecate(element, targetName) {
      if (element) {
        const { identifier } = this;
        const attributeName = this.schema.targetAttribute;
        const revisedAttributeName = this.schema.targetAttributeForScope(identifier);
        this.guide.warn(element, `target:${targetName}`, `Please replace ${attributeName}="${identifier}.${targetName}" with ${revisedAttributeName}="${targetName}". The ${attributeName} attribute is deprecated and will be removed in a future version of Stimulus.`);
      }
      return element;
    }
    get guide() {
      return this.scope.guide;
    }
  };
  var OutletSet = class {
    constructor(scope2, controllerElement) {
      this.scope = scope2;
      this.controllerElement = controllerElement;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get schema() {
      return this.scope.schema;
    }
    has(outletName) {
      return this.find(outletName) != null;
    }
    find(...outletNames) {
      return outletNames.reduce((outlet, outletName) => outlet || this.findOutlet(outletName), void 0);
    }
    findAll(...outletNames) {
      return outletNames.reduce((outlets, outletName) => [...outlets, ...this.findAllOutlets(outletName)], []);
    }
    getSelectorForOutletName(outletName) {
      const attributeName = this.schema.outletAttributeForScope(this.identifier, outletName);
      return this.controllerElement.getAttribute(attributeName);
    }
    findOutlet(outletName) {
      const selector = this.getSelectorForOutletName(outletName);
      if (selector)
        return this.findElement(selector, outletName);
    }
    findAllOutlets(outletName) {
      const selector = this.getSelectorForOutletName(outletName);
      return selector ? this.findAllElements(selector, outletName) : [];
    }
    findElement(selector, outletName) {
      const elements = this.scope.queryElements(selector);
      return elements.filter((element) => this.matchesElement(element, selector, outletName))[0];
    }
    findAllElements(selector, outletName) {
      const elements = this.scope.queryElements(selector);
      return elements.filter((element) => this.matchesElement(element, selector, outletName));
    }
    matchesElement(element, selector, outletName) {
      const controllerAttribute = element.getAttribute(this.scope.schema.controllerAttribute) || "";
      return element.matches(selector) && controllerAttribute.split(" ").includes(outletName);
    }
  };
  var Scope = class _Scope {
    constructor(schema, element, identifier, logger) {
      this.targets = new TargetSet(this);
      this.classes = new ClassMap(this);
      this.data = new DataMap(this);
      this.containsElement = (element2) => {
        return element2.closest(this.controllerSelector) === this.element;
      };
      this.schema = schema;
      this.element = element;
      this.identifier = identifier;
      this.guide = new Guide(logger);
      this.outlets = new OutletSet(this.documentScope, element);
    }
    findElement(selector) {
      return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
    }
    findAllElements(selector) {
      return [
        ...this.element.matches(selector) ? [this.element] : [],
        ...this.queryElements(selector).filter(this.containsElement)
      ];
    }
    queryElements(selector) {
      return Array.from(this.element.querySelectorAll(selector));
    }
    get controllerSelector() {
      return attributeValueContainsToken(this.schema.controllerAttribute, this.identifier);
    }
    get isDocumentScope() {
      return this.element === document.documentElement;
    }
    get documentScope() {
      return this.isDocumentScope ? this : new _Scope(this.schema, document.documentElement, this.identifier, this.guide.logger);
    }
  };
  var ScopeObserver = class {
    constructor(element, schema, delegate) {
      this.element = element;
      this.schema = schema;
      this.delegate = delegate;
      this.valueListObserver = new ValueListObserver(this.element, this.controllerAttribute, this);
      this.scopesByIdentifierByElement = /* @__PURE__ */ new WeakMap();
      this.scopeReferenceCounts = /* @__PURE__ */ new WeakMap();
    }
    start() {
      this.valueListObserver.start();
    }
    stop() {
      this.valueListObserver.stop();
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    parseValueForToken(token) {
      const { element, content: identifier } = token;
      return this.parseValueForElementAndIdentifier(element, identifier);
    }
    parseValueForElementAndIdentifier(element, identifier) {
      const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
      let scope2 = scopesByIdentifier.get(identifier);
      if (!scope2) {
        scope2 = this.delegate.createScopeForElementAndIdentifier(element, identifier);
        scopesByIdentifier.set(identifier, scope2);
      }
      return scope2;
    }
    elementMatchedValue(element, value) {
      const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
      this.scopeReferenceCounts.set(value, referenceCount);
      if (referenceCount == 1) {
        this.delegate.scopeConnected(value);
      }
    }
    elementUnmatchedValue(element, value) {
      const referenceCount = this.scopeReferenceCounts.get(value);
      if (referenceCount) {
        this.scopeReferenceCounts.set(value, referenceCount - 1);
        if (referenceCount == 1) {
          this.delegate.scopeDisconnected(value);
        }
      }
    }
    fetchScopesByIdentifierForElement(element) {
      let scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
      if (!scopesByIdentifier) {
        scopesByIdentifier = /* @__PURE__ */ new Map();
        this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
      }
      return scopesByIdentifier;
    }
  };
  var Router = class {
    constructor(application2) {
      this.application = application2;
      this.scopeObserver = new ScopeObserver(this.element, this.schema, this);
      this.scopesByIdentifier = new Multimap();
      this.modulesByIdentifier = /* @__PURE__ */ new Map();
    }
    get element() {
      return this.application.element;
    }
    get schema() {
      return this.application.schema;
    }
    get logger() {
      return this.application.logger;
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    get modules() {
      return Array.from(this.modulesByIdentifier.values());
    }
    get contexts() {
      return this.modules.reduce((contexts, module) => contexts.concat(module.contexts), []);
    }
    start() {
      this.scopeObserver.start();
    }
    stop() {
      this.scopeObserver.stop();
    }
    loadDefinition(definition) {
      this.unloadIdentifier(definition.identifier);
      const module = new Module(this.application, definition);
      this.connectModule(module);
      const afterLoad = definition.controllerConstructor.afterLoad;
      if (afterLoad) {
        afterLoad.call(definition.controllerConstructor, definition.identifier, this.application);
      }
    }
    unloadIdentifier(identifier) {
      const module = this.modulesByIdentifier.get(identifier);
      if (module) {
        this.disconnectModule(module);
      }
    }
    getContextForElementAndIdentifier(element, identifier) {
      const module = this.modulesByIdentifier.get(identifier);
      if (module) {
        return module.contexts.find((context) => context.element == element);
      }
    }
    proposeToConnectScopeForElementAndIdentifier(element, identifier) {
      const scope2 = this.scopeObserver.parseValueForElementAndIdentifier(element, identifier);
      if (scope2) {
        this.scopeObserver.elementMatchedValue(scope2.element, scope2);
      } else {
        console.error(`Couldn't find or create scope for identifier: "${identifier}" and element:`, element);
      }
    }
    handleError(error2, message, detail) {
      this.application.handleError(error2, message, detail);
    }
    createScopeForElementAndIdentifier(element, identifier) {
      return new Scope(this.schema, element, identifier, this.logger);
    }
    scopeConnected(scope2) {
      this.scopesByIdentifier.add(scope2.identifier, scope2);
      const module = this.modulesByIdentifier.get(scope2.identifier);
      if (module) {
        module.connectContextForScope(scope2);
      }
    }
    scopeDisconnected(scope2) {
      this.scopesByIdentifier.delete(scope2.identifier, scope2);
      const module = this.modulesByIdentifier.get(scope2.identifier);
      if (module) {
        module.disconnectContextForScope(scope2);
      }
    }
    connectModule(module) {
      this.modulesByIdentifier.set(module.identifier, module);
      const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach((scope2) => module.connectContextForScope(scope2));
    }
    disconnectModule(module) {
      this.modulesByIdentifier.delete(module.identifier);
      const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach((scope2) => module.disconnectContextForScope(scope2));
    }
  };
  var defaultSchema = {
    controllerAttribute: "data-controller",
    actionAttribute: "data-action",
    targetAttribute: "data-target",
    targetAttributeForScope: (identifier) => `data-${identifier}-target`,
    outletAttributeForScope: (identifier, outlet) => `data-${identifier}-${outlet}-outlet`,
    keyMappings: Object.assign(Object.assign({ enter: "Enter", tab: "Tab", esc: "Escape", space: " ", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", home: "Home", end: "End", page_up: "PageUp", page_down: "PageDown" }, objectFromEntries("abcdefghijklmnopqrstuvwxyz".split("").map((c) => [c, c]))), objectFromEntries("0123456789".split("").map((n) => [n, n])))
  };
  function objectFromEntries(array) {
    return array.reduce((memo, [k, v]) => Object.assign(Object.assign({}, memo), { [k]: v }), {});
  }
  var Application = class {
    constructor(element = document.documentElement, schema = defaultSchema) {
      this.logger = console;
      this.debug = false;
      this.logDebugActivity = (identifier, functionName, detail = {}) => {
        if (this.debug) {
          this.logFormattedMessage(identifier, functionName, detail);
        }
      };
      this.element = element;
      this.schema = schema;
      this.dispatcher = new Dispatcher(this);
      this.router = new Router(this);
      this.actionDescriptorFilters = Object.assign({}, defaultActionDescriptorFilters);
    }
    static start(element, schema) {
      const application2 = new this(element, schema);
      application2.start();
      return application2;
    }
    async start() {
      await domReady();
      this.logDebugActivity("application", "starting");
      this.dispatcher.start();
      this.router.start();
      this.logDebugActivity("application", "start");
    }
    stop() {
      this.logDebugActivity("application", "stopping");
      this.dispatcher.stop();
      this.router.stop();
      this.logDebugActivity("application", "stop");
    }
    register(identifier, controllerConstructor) {
      this.load({ identifier, controllerConstructor });
    }
    registerActionOption(name, filter) {
      this.actionDescriptorFilters[name] = filter;
    }
    load(head, ...rest) {
      const definitions = Array.isArray(head) ? head : [head, ...rest];
      definitions.forEach((definition) => {
        if (definition.controllerConstructor.shouldLoad) {
          this.router.loadDefinition(definition);
        }
      });
    }
    unload(head, ...rest) {
      const identifiers = Array.isArray(head) ? head : [head, ...rest];
      identifiers.forEach((identifier) => this.router.unloadIdentifier(identifier));
    }
    get controllers() {
      return this.router.contexts.map((context) => context.controller);
    }
    getControllerForElementAndIdentifier(element, identifier) {
      const context = this.router.getContextForElementAndIdentifier(element, identifier);
      return context ? context.controller : null;
    }
    handleError(error2, message, detail) {
      var _a;
      this.logger.error(`%s

%o

%o`, message, error2, detail);
      (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, message, "", 0, 0, error2);
    }
    logFormattedMessage(identifier, functionName, detail = {}) {
      detail = Object.assign({ application: this }, detail);
      this.logger.groupCollapsed(`${identifier} #${functionName}`);
      this.logger.log("details:", Object.assign({}, detail));
      this.logger.groupEnd();
    }
  };
  function domReady() {
    return new Promise((resolve) => {
      if (document.readyState == "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve());
      } else {
        resolve();
      }
    });
  }
  function ClassPropertiesBlessing(constructor) {
    const classes = readInheritableStaticArrayValues(constructor, "classes");
    return classes.reduce((properties, classDefinition) => {
      return Object.assign(properties, propertiesForClassDefinition(classDefinition));
    }, {});
  }
  function propertiesForClassDefinition(key2) {
    return {
      [`${key2}Class`]: {
        get() {
          const { classes } = this;
          if (classes.has(key2)) {
            return classes.get(key2);
          } else {
            const attribute = classes.getAttributeName(key2);
            throw new Error(`Missing attribute "${attribute}"`);
          }
        }
      },
      [`${key2}Classes`]: {
        get() {
          return this.classes.getAll(key2);
        }
      },
      [`has${capitalize(key2)}Class`]: {
        get() {
          return this.classes.has(key2);
        }
      }
    };
  }
  function OutletPropertiesBlessing(constructor) {
    const outlets = readInheritableStaticArrayValues(constructor, "outlets");
    return outlets.reduce((properties, outletDefinition) => {
      return Object.assign(properties, propertiesForOutletDefinition(outletDefinition));
    }, {});
  }
  function getOutletController(controller, element, identifier) {
    return controller.application.getControllerForElementAndIdentifier(element, identifier);
  }
  function getControllerAndEnsureConnectedScope(controller, element, outletName) {
    let outletController = getOutletController(controller, element, outletName);
    if (outletController)
      return outletController;
    controller.application.router.proposeToConnectScopeForElementAndIdentifier(element, outletName);
    outletController = getOutletController(controller, element, outletName);
    if (outletController)
      return outletController;
  }
  function propertiesForOutletDefinition(name) {
    const camelizedName = namespaceCamelize(name);
    return {
      [`${camelizedName}Outlet`]: {
        get() {
          const outletElement = this.outlets.find(name);
          const selector = this.outlets.getSelectorForOutletName(name);
          if (outletElement) {
            const outletController = getControllerAndEnsureConnectedScope(this, outletElement, name);
            if (outletController)
              return outletController;
            throw new Error(`The provided outlet element is missing an outlet controller "${name}" instance for host controller "${this.identifier}"`);
          }
          throw new Error(`Missing outlet element "${name}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
        }
      },
      [`${camelizedName}Outlets`]: {
        get() {
          const outlets = this.outlets.findAll(name);
          if (outlets.length > 0) {
            return outlets.map((outletElement) => {
              const outletController = getControllerAndEnsureConnectedScope(this, outletElement, name);
              if (outletController)
                return outletController;
              console.warn(`The provided outlet element is missing an outlet controller "${name}" instance for host controller "${this.identifier}"`, outletElement);
            }).filter((controller) => controller);
          }
          return [];
        }
      },
      [`${camelizedName}OutletElement`]: {
        get() {
          const outletElement = this.outlets.find(name);
          const selector = this.outlets.getSelectorForOutletName(name);
          if (outletElement) {
            return outletElement;
          } else {
            throw new Error(`Missing outlet element "${name}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
          }
        }
      },
      [`${camelizedName}OutletElements`]: {
        get() {
          return this.outlets.findAll(name);
        }
      },
      [`has${capitalize(camelizedName)}Outlet`]: {
        get() {
          return this.outlets.has(name);
        }
      }
    };
  }
  function TargetPropertiesBlessing(constructor) {
    const targets = readInheritableStaticArrayValues(constructor, "targets");
    return targets.reduce((properties, targetDefinition) => {
      return Object.assign(properties, propertiesForTargetDefinition(targetDefinition));
    }, {});
  }
  function propertiesForTargetDefinition(name) {
    return {
      [`${name}Target`]: {
        get() {
          const target = this.targets.find(name);
          if (target) {
            return target;
          } else {
            throw new Error(`Missing target element "${name}" for "${this.identifier}" controller`);
          }
        }
      },
      [`${name}Targets`]: {
        get() {
          return this.targets.findAll(name);
        }
      },
      [`has${capitalize(name)}Target`]: {
        get() {
          return this.targets.has(name);
        }
      }
    };
  }
  function ValuePropertiesBlessing(constructor) {
    const valueDefinitionPairs = readInheritableStaticObjectPairs(constructor, "values");
    const propertyDescriptorMap = {
      valueDescriptorMap: {
        get() {
          return valueDefinitionPairs.reduce((result, valueDefinitionPair) => {
            const valueDescriptor = parseValueDefinitionPair(valueDefinitionPair, this.identifier);
            const attributeName = this.data.getAttributeNameForKey(valueDescriptor.key);
            return Object.assign(result, { [attributeName]: valueDescriptor });
          }, {});
        }
      }
    };
    return valueDefinitionPairs.reduce((properties, valueDefinitionPair) => {
      return Object.assign(properties, propertiesForValueDefinitionPair(valueDefinitionPair));
    }, propertyDescriptorMap);
  }
  function propertiesForValueDefinitionPair(valueDefinitionPair, controller) {
    const definition = parseValueDefinitionPair(valueDefinitionPair, controller);
    const { key: key2, name, reader: read, writer: write } = definition;
    return {
      [name]: {
        get() {
          const value = this.data.get(key2);
          if (value !== null) {
            return read(value);
          } else {
            return definition.defaultValue;
          }
        },
        set(value) {
          if (value === void 0) {
            this.data.delete(key2);
          } else {
            this.data.set(key2, write(value));
          }
        }
      },
      [`has${capitalize(name)}`]: {
        get() {
          return this.data.has(key2) || definition.hasCustomDefaultValue;
        }
      }
    };
  }
  function parseValueDefinitionPair([token, typeDefinition], controller) {
    return valueDescriptorForTokenAndTypeDefinition({
      controller,
      token,
      typeDefinition
    });
  }
  function parseValueTypeConstant(constant) {
    switch (constant) {
      case Array:
        return "array";
      case Boolean:
        return "boolean";
      case Number:
        return "number";
      case Object:
        return "object";
      case String:
        return "string";
    }
  }
  function parseValueTypeDefault(defaultValue) {
    switch (typeof defaultValue) {
      case "boolean":
        return "boolean";
      case "number":
        return "number";
      case "string":
        return "string";
    }
    if (Array.isArray(defaultValue))
      return "array";
    if (Object.prototype.toString.call(defaultValue) === "[object Object]")
      return "object";
  }
  function parseValueTypeObject(payload) {
    const { controller, token, typeObject } = payload;
    const hasType = isSomething(typeObject.type);
    const hasDefault = isSomething(typeObject.default);
    const fullObject = hasType && hasDefault;
    const onlyType = hasType && !hasDefault;
    const onlyDefault = !hasType && hasDefault;
    const typeFromObject = parseValueTypeConstant(typeObject.type);
    const typeFromDefaultValue = parseValueTypeDefault(payload.typeObject.default);
    if (onlyType)
      return typeFromObject;
    if (onlyDefault)
      return typeFromDefaultValue;
    if (typeFromObject !== typeFromDefaultValue) {
      const propertyPath = controller ? `${controller}.${token}` : token;
      throw new Error(`The specified default value for the Stimulus Value "${propertyPath}" must match the defined type "${typeFromObject}". The provided default value of "${typeObject.default}" is of type "${typeFromDefaultValue}".`);
    }
    if (fullObject)
      return typeFromObject;
  }
  function parseValueTypeDefinition(payload) {
    const { controller, token, typeDefinition } = payload;
    const typeObject = { controller, token, typeObject: typeDefinition };
    const typeFromObject = parseValueTypeObject(typeObject);
    const typeFromDefaultValue = parseValueTypeDefault(typeDefinition);
    const typeFromConstant = parseValueTypeConstant(typeDefinition);
    const type = typeFromObject || typeFromDefaultValue || typeFromConstant;
    if (type)
      return type;
    const propertyPath = controller ? `${controller}.${typeDefinition}` : token;
    throw new Error(`Unknown value type "${propertyPath}" for "${token}" value`);
  }
  function defaultValueForDefinition(typeDefinition) {
    const constant = parseValueTypeConstant(typeDefinition);
    if (constant)
      return defaultValuesByType[constant];
    const hasDefault = hasProperty(typeDefinition, "default");
    const hasType = hasProperty(typeDefinition, "type");
    const typeObject = typeDefinition;
    if (hasDefault)
      return typeObject.default;
    if (hasType) {
      const { type } = typeObject;
      const constantFromType = parseValueTypeConstant(type);
      if (constantFromType)
        return defaultValuesByType[constantFromType];
    }
    return typeDefinition;
  }
  function valueDescriptorForTokenAndTypeDefinition(payload) {
    const { token, typeDefinition } = payload;
    const key2 = `${dasherize(token)}-value`;
    const type = parseValueTypeDefinition(payload);
    return {
      type,
      key: key2,
      name: camelize(key2),
      get defaultValue() {
        return defaultValueForDefinition(typeDefinition);
      },
      get hasCustomDefaultValue() {
        return parseValueTypeDefault(typeDefinition) !== void 0;
      },
      reader: readers[type],
      writer: writers[type] || writers.default
    };
  }
  var defaultValuesByType = {
    get array() {
      return [];
    },
    boolean: false,
    number: 0,
    get object() {
      return {};
    },
    string: ""
  };
  var readers = {
    array(value) {
      const array = JSON.parse(value);
      if (!Array.isArray(array)) {
        throw new TypeError(`expected value of type "array" but instead got value "${value}" of type "${parseValueTypeDefault(array)}"`);
      }
      return array;
    },
    boolean(value) {
      return !(value == "0" || String(value).toLowerCase() == "false");
    },
    number(value) {
      return Number(value.replace(/_/g, ""));
    },
    object(value) {
      const object = JSON.parse(value);
      if (object === null || typeof object != "object" || Array.isArray(object)) {
        throw new TypeError(`expected value of type "object" but instead got value "${value}" of type "${parseValueTypeDefault(object)}"`);
      }
      return object;
    },
    string(value) {
      return value;
    }
  };
  var writers = {
    default: writeString,
    array: writeJSON,
    object: writeJSON
  };
  function writeJSON(value) {
    return JSON.stringify(value);
  }
  function writeString(value) {
    return `${value}`;
  }
  var Controller = class {
    constructor(context) {
      this.context = context;
    }
    static get shouldLoad() {
      return true;
    }
    static afterLoad(_identifier, _application) {
      return;
    }
    get application() {
      return this.context.application;
    }
    get scope() {
      return this.context.scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get targets() {
      return this.scope.targets;
    }
    get outlets() {
      return this.scope.outlets;
    }
    get classes() {
      return this.scope.classes;
    }
    get data() {
      return this.scope.data;
    }
    initialize() {
    }
    connect() {
    }
    disconnect() {
    }
    dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true } = {}) {
      const type = prefix ? `${prefix}:${eventName}` : eventName;
      const event = new CustomEvent(type, { detail, bubbles, cancelable });
      target.dispatchEvent(event);
      return event;
    }
  };
  Controller.blessings = [
    ClassPropertiesBlessing,
    TargetPropertiesBlessing,
    ValuePropertiesBlessing,
    OutletPropertiesBlessing
  ];
  Controller.targets = [];
  Controller.outlets = [];
  Controller.values = {};

  // node_modules/animejs/dist/modules/core/consts.js
  var isBrowser = typeof window !== "undefined";
  var win = isBrowser ? (
    /** @type {AnimeJSWindow} */
    /** @type {unknown} */
    window
  ) : null;
  var doc = isBrowser ? document : null;
  var tweenTypes = {
    OBJECT: 0,
    ATTRIBUTE: 1,
    CSS: 2,
    TRANSFORM: 3,
    CSS_VAR: 4
  };
  var valueTypes = {
    NUMBER: 0,
    UNIT: 1,
    COLOR: 2,
    COMPLEX: 3
  };
  var tickModes = {
    NONE: 0,
    AUTO: 1,
    FORCE: 2
  };
  var compositionTypes = {
    replace: 0,
    none: 1,
    blend: 2
  };
  var isRegisteredTargetSymbol = /* @__PURE__ */ Symbol();
  var isDomSymbol = /* @__PURE__ */ Symbol();
  var isSvgSymbol = /* @__PURE__ */ Symbol();
  var transformsSymbol = /* @__PURE__ */ Symbol();
  var proxyTargetSymbol = /* @__PURE__ */ Symbol();
  var minValue = 1e-11;
  var maxValue = 1e12;
  var K = 1e3;
  var maxFps = 240;
  var emptyString = "";
  var cssVarPrefix = "var(";
  var emptyArray = [];
  var shortTransforms = /* @__PURE__ */ (() => {
    const map = /* @__PURE__ */ new Map();
    map.set("x", "translateX");
    map.set("y", "translateY");
    map.set("z", "translateZ");
    return map;
  })();
  var validTransforms = [
    "perspective",
    "translateX",
    "translateY",
    "translateZ",
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "scale",
    "scaleX",
    "scaleY",
    "scaleZ",
    "skew",
    "skewX",
    "skewY"
  ];
  var transformsFragmentStrings = /* @__PURE__ */ validTransforms.reduce((a, v) => ({ ...a, [v]: v + "(" }), {});
  var noop = () => {
  };
  var noopModifier = (v) => v;
  var validRgbHslRgx = /\)\s*[-.\d]/;
  var hexTestRgx = /(^#([\da-f]{3}){1,2}$)|(^#([\da-f]{4}){1,2}$)/i;
  var rgbExecRgx = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i;
  var rgbaExecRgx = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i;
  var hslExecRgx = /hsl\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)/i;
  var hslaExecRgx = /hsla\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i;
  var digitWithExponentRgx = /[-+]?\d*\.?\d+(?:e[-+]?\d)?/gi;
  var unitsExecRgx = /^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)([a-z]+|%)$/i;
  var lowerCaseRgx = /([a-z])([A-Z])/g;
  var relativeValuesExecRgx = /(\*=|\+=|-=)/;
  var cssVariableMatchRgx = /var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/;

  // node_modules/animejs/dist/modules/core/globals.js
  var defaults = {
    id: null,
    keyframes: null,
    playbackEase: null,
    playbackRate: 1,
    frameRate: maxFps,
    loop: 0,
    reversed: false,
    alternate: false,
    autoplay: true,
    persist: false,
    duration: K,
    delay: 0,
    loopDelay: 0,
    ease: "out(2)",
    composition: compositionTypes.replace,
    modifier: noopModifier,
    onBegin: noop,
    onBeforeUpdate: noop,
    onUpdate: noop,
    onLoop: noop,
    onPause: noop,
    onComplete: noop,
    onRender: noop
  };
  var scope = {
    /** @type {Scope} */
    current: null,
    /** @type {Document|DOMTarget} */
    root: doc
  };
  var globals = {
    /** @type {DefaultsParams} */
    defaults,
    /** @type {Number} */
    precision: 4,
    /** @type {Number} equals 1 in ms mode, 0.001 in s mode */
    timeScale: 1,
    /** @type {Number} */
    tickThreshold: 200,
    /** @type {EditorGlobals|null} */
    editor: null
  };
  var globalVersions = { version: "4.5.0", engine: null };
  if (isBrowser) {
    if (!win.AnimeJS) win.AnimeJS = [];
    win.AnimeJS.push(globalVersions);
  }

  // node_modules/animejs/dist/modules/core/helpers.js
  var toLowerCase = (str) => str.replace(lowerCaseRgx, "$1-$2").toLowerCase();
  var stringStartsWith = (str, sub) => str.indexOf(sub) === 0;
  var now = Date.now;
  var isArr = Array.isArray;
  var isObj = (a) => a && a.constructor === Object;
  var isNum = (a) => typeof a === "number" && !isNaN(a);
  var isStr = (a) => typeof a === "string";
  var isFnc = (a) => typeof a === "function";
  var isUnd = (a) => typeof a === "undefined";
  var isNil = (a) => isUnd(a) || a === null;
  var isSvg = (a) => isBrowser && a instanceof SVGElement;
  var isHex = (a) => hexTestRgx.test(a);
  var isRgb = (a) => stringStartsWith(a, "rgb");
  var isHsl = (a) => stringStartsWith(a, "hsl");
  var isCol = (a) => isHex(a) || (isRgb(a) || isHsl(a)) && (a[a.length - 1] === ")" || !validRgbHslRgx.test(a));
  var isKey = (a) => !globals.defaults.hasOwnProperty(a);
  var svgCssReservedProperties = ["opacity", "rotate", "overflow", "color"];
  var isValidSVGAttribute = (el, propertyName) => {
    if (svgCssReservedProperties.includes(propertyName)) return false;
    if (el.getAttribute(propertyName) || propertyName in el) {
      if (propertyName === "scale") {
        const elParentNode = (
          /** @type {SVGGeometryElement} */
          /** @type {DOMTarget} */
          el.parentNode
        );
        return elParentNode && elParentNode.tagName === "filter";
      }
      return true;
    }
  };
  var parseNumber = (str) => isStr(str) ? parseFloat(
    /** @type {String} */
    str
  ) : (
    /** @type {Number} */
    str
  );
  var pow = Math.pow;
  var sqrt = Math.sqrt;
  var sin = Math.sin;
  var cos = Math.cos;
  var abs = Math.abs;
  var floor = Math.floor;
  var asin = Math.asin;
  var PI = Math.PI;
  var _round = Math.round;
  var clamp = (v, min, max) => v < min ? min : v > max ? max : v;
  var round = (v, decimalLength) => {
    if (decimalLength < 0) return v;
    if (!decimalLength) return _round(v);
    const p = 10 ** decimalLength;
    return _round(v * p) / p;
  };
  var lerp = (start, end, factor) => factor === 1 ? end : factor === 0 ? start : start + (end - start) * factor;
  var clampInfinity = (v) => v === Infinity ? maxValue : v === -Infinity ? -maxValue : v;
  var normalizeTime = (v) => v <= minValue ? minValue : clampInfinity(round(v, 11));
  var cloneArray = (a) => isArr(a) ? [...a] : a;
  var mergeObjects = (o1, o2) => {
    const merged = (
      /** @type {T & U} */
      { ...o1 }
    );
    for (let p in o2) {
      const o1p = (
        /** @type {T & U} */
        o1[p]
      );
      merged[p] = isUnd(o1p) ? (
        /** @type {T & U} */
        o2[p]
      ) : o1p;
    }
    return merged;
  };
  var forEachChildren = (parent, callback, reverse, prevProp = "_prev", nextProp = "_next") => {
    let next = parent._head;
    let adjustedNextProp = nextProp;
    if (reverse) {
      next = parent._tail;
      adjustedNextProp = prevProp;
    }
    while (next) {
      const currentNext = next[adjustedNextProp];
      callback(next);
      next = currentNext;
    }
  };
  var removeChild = (parent, child, prevProp = "_prev", nextProp = "_next") => {
    const prev = child[prevProp];
    const next = child[nextProp];
    prev ? prev[nextProp] = next : parent._head = next;
    next ? next[prevProp] = prev : parent._tail = prev;
    child[prevProp] = null;
    child[nextProp] = null;
  };
  var addChild = (parent, child, sortMethod, prevProp = "_prev", nextProp = "_next") => {
    let prev = parent._tail;
    while (prev && sortMethod && sortMethod(prev, child)) prev = prev[prevProp];
    const next = prev ? prev[nextProp] : parent._head;
    prev ? prev[nextProp] = child : parent._head = child;
    next ? next[prevProp] = child : parent._tail = child;
    child[prevProp] = prev;
    child[nextProp] = next;
  };

  // node_modules/animejs/dist/modules/core/transforms.js
  var parseInlineTransforms = (target, propName, animationInlineStyles) => {
    const inlineTransforms = target.style.transform;
    if (inlineTransforms) {
      const cachedTransforms = target[transformsSymbol];
      let pos = 0;
      const len = inlineTransforms.length;
      let fullTranslateValue;
      while (pos < len) {
        while (pos < len && inlineTransforms.charCodeAt(pos) === 32) pos++;
        if (pos >= len) break;
        const nameStart = pos;
        while (pos < len && inlineTransforms.charCodeAt(pos) !== 40) pos++;
        if (pos >= len) break;
        const name = inlineTransforms.substring(nameStart, pos);
        let depth = 1;
        const valueStart = pos + 1;
        let c1 = -1, c2 = -1;
        pos++;
        while (pos < len && depth > 0) {
          const c = inlineTransforms.charCodeAt(pos);
          if (c === 40) depth++;
          else if (c === 41) depth--;
          else if (c === 44 && depth === 1) {
            if (c1 === -1) c1 = pos;
            else if (c2 === -1) c2 = pos;
          }
          pos++;
        }
        const valueEnd = pos - 1;
        if (name === "translate" || name === "translate3d") {
          if (c1 === -1) {
            cachedTransforms.translateX = inlineTransforms.substring(valueStart, valueEnd).trim();
          } else {
            cachedTransforms.translateX = inlineTransforms.substring(valueStart, c1).trim();
            if (c2 === -1) {
              cachedTransforms.translateY = inlineTransforms.substring(c1 + 1, valueEnd).trim();
            } else {
              cachedTransforms.translateY = inlineTransforms.substring(c1 + 1, c2).trim();
              cachedTransforms.translateZ = inlineTransforms.substring(c2 + 1, valueEnd).trim();
            }
          }
          fullTranslateValue = inlineTransforms.substring(valueStart, valueEnd);
        } else if (name === "scale" || name === "scale3d") {
          if (c1 === -1) {
            cachedTransforms.scale = inlineTransforms.substring(valueStart, valueEnd).trim();
          } else {
            cachedTransforms.scaleX = inlineTransforms.substring(valueStart, c1).trim();
            if (c2 === -1) {
              cachedTransforms.scaleY = inlineTransforms.substring(c1 + 1, valueEnd).trim();
            } else {
              cachedTransforms.scaleY = inlineTransforms.substring(c1 + 1, c2).trim();
              cachedTransforms.scaleZ = inlineTransforms.substring(c2 + 1, valueEnd).trim();
            }
          }
        } else {
          cachedTransforms[name] = inlineTransforms.substring(valueStart, valueEnd);
        }
      }
      if (propName === "translate3d" && fullTranslateValue) {
        if (animationInlineStyles) animationInlineStyles[propName] = fullTranslateValue;
        return fullTranslateValue;
      }
      const cached = cachedTransforms[propName];
      if (!isUnd(cached)) {
        if (animationInlineStyles) animationInlineStyles[propName] = cached;
        return cached;
      }
    }
    return propName === "translate3d" ? "0px, 0px, 0px" : propName === "rotate3d" ? "0, 0, 0, 0deg" : stringStartsWith(propName, "scale") ? "1" : stringStartsWith(propName, "rotate") || stringStartsWith(propName, "skew") ? "0deg" : "0px";
  };
  var buildTransformString = (props) => {
    let str = emptyString;
    for (let i = 0, l = validTransforms.length; i < l; i++) {
      const key2 = validTransforms[i];
      const val = props[key2];
      if (val !== void 0) {
        if (key2 === "translateX") {
          const next = props.translateY;
          if (next !== void 0) {
            const next2 = props.translateZ;
            if (next2 !== void 0) {
              str += `translate3d(${val},${next},${next2}) `;
              i += 2;
            } else {
              str += `translate(${val},${next}) `;
              i += 1;
            }
            continue;
          }
        }
        if (key2 === "scaleX" && props.scale === void 0) {
          const next = props.scaleY;
          if (next !== void 0) {
            const next2 = props.scaleZ;
            if (next2 !== void 0) {
              str += `scale3d(${val},${next},${next2}) `;
              i += 2;
            } else {
              str += `scale(${val},${next}) `;
              i += 1;
            }
            continue;
          }
        }
        str += `${transformsFragmentStrings[key2]}${val}) `;
      }
      if (key2 === "rotateZ") {
        if (props.rotate3d !== void 0) str += `rotate3d(${props.rotate3d}) `;
      }
    }
    if (props.matrix !== void 0) str += `matrix(${props.matrix}) `;
    if (props.matrix3d !== void 0) str += `matrix3d(${props.matrix3d}) `;
    return str;
  };

  // node_modules/animejs/dist/modules/adapters/registry.js
  var adapters = (
    /** @type {Adapter[]} */
    []
  );
  function resolveAdapterEntry(target, name) {
    if (!target) return null;
    const al = adapters.length;
    outer: for (let i = 0; i < al; i++) {
      const a = adapters[i];
      if (a.detect && !a.detect(target)) continue;
      const tas = a.targetAdapters;
      for (let j = 0, m = tas.length; j < m; j++) {
        const ta = tas[j];
        if (ta.detect(target)) {
          const entry = ta.props[name];
          if (entry && (!entry.gate || entry.gate(target))) return entry;
          break outer;
        }
      }
    }
    for (let i = 0; i < al; i++) {
      const a = adapters[i];
      if (a.detect && !a.detect(target)) continue;
      const rs = a.propertyResolvers;
      for (let j = 0, m = rs.length; j < m; j++) {
        const entry = rs[j](target, name);
        if (entry) return entry;
      }
    }
    return null;
  }

  // node_modules/animejs/dist/modules/core/colors.js
  var rgbToRgba = (rgbValue) => {
    const rgba = rgbExecRgx.exec(rgbValue) || rgbaExecRgx.exec(rgbValue);
    const a = !isUnd(rgba[4]) ? +rgba[4] : 1;
    return [
      +rgba[1],
      +rgba[2],
      +rgba[3],
      a
    ];
  };
  var hexToRgba = (hexValue) => {
    const hexLength = hexValue.length;
    const isShort = hexLength === 4 || hexLength === 5;
    return [
      +("0x" + hexValue[1] + hexValue[isShort ? 1 : 2]),
      +("0x" + hexValue[isShort ? 2 : 3] + hexValue[isShort ? 2 : 4]),
      +("0x" + hexValue[isShort ? 3 : 5] + hexValue[isShort ? 3 : 6]),
      hexLength === 5 || hexLength === 9 ? +(+("0x" + hexValue[isShort ? 4 : 7] + hexValue[isShort ? 4 : 8]) / 255).toFixed(3) : 1
    ];
  };
  var hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  var hslToRgba = (hslValue) => {
    const hsla = hslExecRgx.exec(hslValue) || hslaExecRgx.exec(hslValue);
    const h = +hsla[1] / 360;
    const s = +hsla[2] / 100;
    const l = +hsla[3] / 100;
    const a = !isUnd(hsla[4]) ? +hsla[4] : 1;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = round(hue2rgb(p, q, h + 1 / 3) * 255, 0);
      g = round(hue2rgb(p, q, h) * 255, 0);
      b = round(hue2rgb(p, q, h - 1 / 3) * 255, 0);
    }
    return [r, g, b, a];
  };
  var convertColorStringValuesToRgbaArray = (colorString) => {
    return isRgb(colorString) ? rgbToRgba(colorString) : isHex(colorString) ? hexToRgba(colorString) : isHsl(colorString) ? hslToRgba(colorString) : [0, 0, 0, 1];
  };

  // node_modules/animejs/dist/modules/core/values.js
  var setValue = (targetValue, defaultValue) => {
    return isUnd(targetValue) ? defaultValue : targetValue;
  };
  var resolveCssVar = (value, target) => {
    const match = value.match(cssVariableMatchRgx);
    const el = target[isDomSymbol] ? target : document.documentElement;
    let computed = getComputedStyle(
      /** @type {HTMLElement} */
      el
    )?.getPropertyValue(match[1]);
    if ((!computed || computed.trim() === emptyString) && match[2]) computed = match[2].trim();
    return computed || 0;
  };
  var getFunctionValue = (value, target, index, targets, store, prevTween) => {
    if (isFnc(value)) {
      if (!store) {
        const computed = (
          /** @type {Function} */
          value(target, index, targets, prevTween)
        );
        return !isNaN(+computed) ? +computed : computed || 0;
      }
      const func = () => {
        const computed = (
          /** @type {Function} */
          value(target, index, targets, prevTween)
        );
        return !isNaN(+computed) ? +computed : computed || 0;
      };
      store.func = func;
      return func();
    }
    if (isStr(value) && stringStartsWith(value, cssVarPrefix)) {
      if (!store) return resolveCssVar(
        /** @type {String} */
        value,
        target
      );
      const func = () => resolveCssVar(
        /** @type {String} */
        value,
        target
      );
      store.func = func;
      return func();
    }
    return value;
  };
  var getTweenType = (target, prop) => {
    return !target[isDomSymbol] ? tweenTypes.OBJECT : (
      // Handle SVG attributes
      target[isSvgSymbol] && isValidSVGAttribute(target, prop) ? tweenTypes.ATTRIBUTE : (
        // Handle CSS Transform properties differently than CSS to allow individual animations
        validTransforms.includes(prop) || shortTransforms.get(prop) ? tweenTypes.TRANSFORM : (
          // CSS variables
          stringStartsWith(prop, "--") ? tweenTypes.CSS_VAR : (
            // All other CSS properties
            prop in /** @type {DOMTarget} */
            target.style ? tweenTypes.CSS : (
              // Handle other DOM Attributes
              prop in target ? tweenTypes.OBJECT : tweenTypes.ATTRIBUTE
            )
          )
        )
      )
    );
  };
  var getCSSValue = (target, propName, animationInlineStyles) => {
    const inlineStyles = target.style[propName];
    if (inlineStyles && animationInlineStyles) {
      animationInlineStyles[propName] = inlineStyles;
    }
    const value = inlineStyles || getComputedStyle(target[proxyTargetSymbol] || target).getPropertyValue(propName);
    return value === "auto" ? "0" : value;
  };
  var getOriginalAnimatableValue = (target, propName, tweenType, animationInlineStyles) => {
    const type = !isUnd(tweenType) ? tweenType : getTweenType(target, propName);
    const adapterProp = resolveAdapterEntry(target, propName);
    if (adapterProp) {
      const value = adapterProp.get(target);
      if (value && animationInlineStyles) animationInlineStyles[propName] = value;
      return value == null ? 0 : value;
    }
    if (type === tweenTypes.OBJECT) {
      const value = target[propName];
      if (value && animationInlineStyles) animationInlineStyles[propName] = value;
      return value || 0;
    }
    if (type === tweenTypes.ATTRIBUTE) {
      const value = (
        /** @type {DOMTarget} */
        target.getAttribute(propName)
      );
      if (value && animationInlineStyles) animationInlineStyles[propName] = value;
      return value;
    }
    return type === tweenTypes.TRANSFORM ? parseInlineTransforms(
      /** @type {DOMTarget} */
      target,
      propName,
      animationInlineStyles
    ) : type === tweenTypes.CSS_VAR ? getCSSValue(
      /** @type {DOMTarget} */
      target,
      propName,
      animationInlineStyles
    ).trimStart() : getCSSValue(
      /** @type {DOMTarget} */
      target,
      propName,
      animationInlineStyles
    );
  };
  var getRelativeValue = (x, y, operator) => {
    return operator === "-" ? x - y : operator === "+" ? x + y : x * y;
  };
  var createDecomposedValueTargetObject = () => {
    return {
      /** @type {valueTypes} */
      t: valueTypes.NUMBER,
      n: 0,
      u: null,
      o: null,
      d: null,
      s: null
    };
  };
  var decomposeRawValue = (rawValue, targetObject) => {
    targetObject.t = valueTypes.NUMBER;
    targetObject.n = 0;
    targetObject.u = null;
    targetObject.o = null;
    targetObject.d = null;
    targetObject.s = null;
    if (!rawValue) return targetObject;
    const num = +rawValue;
    if (!isNaN(num)) {
      targetObject.n = num;
      return targetObject;
    }
    let str = (
      /** @type {String} */
      rawValue
    );
    if (str[1] === "=") {
      targetObject.o = str[0];
      str = str.slice(2);
    }
    const unitMatch = str.includes(" ") ? false : unitsExecRgx.exec(str);
    if (unitMatch) {
      targetObject.t = valueTypes.UNIT;
      targetObject.n = +unitMatch[1];
      targetObject.u = unitMatch[2];
      return targetObject;
    } else if (targetObject.o) {
      targetObject.n = +str;
      return targetObject;
    } else if (isCol(str)) {
      targetObject.t = valueTypes.COLOR;
      targetObject.d = convertColorStringValuesToRgbaArray(str);
      return targetObject;
    } else {
      const matchedNumbers = str.match(digitWithExponentRgx);
      targetObject.t = valueTypes.COMPLEX;
      targetObject.d = matchedNumbers ? matchedNumbers.map(Number) : [];
      targetObject.s = str.split(digitWithExponentRgx) || [];
      return targetObject;
    }
  };
  var decomposeTweenValue = (tween, targetObject) => {
    targetObject.t = tween._valueType;
    targetObject.n = tween._toNumber;
    targetObject.u = tween._unit;
    targetObject.o = null;
    targetObject.d = cloneArray(tween._toNumbers);
    targetObject.s = cloneArray(tween._strings);
    return targetObject;
  };
  var decomposedOriginalValue = createDecomposedValueTargetObject();
  var composeComplexValue = (tween, progress, precision) => {
    const mod = tween._modifier;
    const fn = tween._fromNumbers;
    const tn = tween._toNumbers;
    const ts = tween._strings;
    let v = ts[0];
    for (let j = 0, l = tn.length; j < l; j++) {
      const n = (
        /** @type {Number} */
        mod(round(lerp(fn[j], tn[j], progress), precision))
      );
      const s = ts[j + 1];
      v += `${s ? n + s : n}`;
      tween._numbers[j] = n;
    }
    return v;
  };

  // node_modules/animejs/dist/modules/core/render.js
  var render = (tickable, time, muteCallbacks, internalRender, tickMode) => {
    const parent = tickable.parent;
    const duration = tickable.duration;
    const completed = tickable.completed;
    const iterationDuration = tickable.iterationDuration;
    const iterationCount = tickable.iterationCount;
    const _currentIteration = tickable._currentIteration;
    const _loopDelay = tickable._loopDelay;
    const _reversed = tickable._reversed;
    const _alternate = tickable._alternate;
    const _hasChildren = tickable._hasChildren;
    const tickableDelay = tickable._delay;
    const tickablePrevAbsoluteTime = tickable._currentTime;
    const tickableEndTime = tickableDelay + iterationDuration;
    const tickableAbsoluteTime = time - tickableDelay;
    const tickablePrevTime = clamp(tickablePrevAbsoluteTime, -tickableDelay, duration);
    const tickableCurrentTime = clamp(tickableAbsoluteTime, -tickableDelay, duration);
    const deltaTime = tickableAbsoluteTime - tickablePrevAbsoluteTime;
    const isCurrentTimeAboveZero = tickableCurrentTime > 0;
    const isCurrentTimeEqualOrAboveDuration = tickableCurrentTime >= duration;
    const isSetter = duration <= minValue;
    const forcedTick = tickMode === tickModes.FORCE;
    let isOdd = 0;
    let iterationElapsedTime = tickableAbsoluteTime;
    let hasRendered = 0;
    if (iterationCount > 1) {
      const period = iterationDuration + (isCurrentTimeEqualOrAboveDuration ? 0 : _loopDelay);
      const currentIteration = ~~(tickableCurrentTime / period);
      tickable._currentIteration = clamp(currentIteration, 0, iterationCount);
      if (isCurrentTimeEqualOrAboveDuration) tickable._currentIteration--;
      isOdd = tickable._currentIteration % 2;
      iterationElapsedTime = tickableCurrentTime - currentIteration * period || 0;
    }
    const isReversed = _reversed ^ (_alternate && isOdd);
    const _ease = (
      /** @type {Renderable} */
      tickable._ease
    );
    let iterationTime = isCurrentTimeEqualOrAboveDuration ? isReversed ? 0 : duration : isReversed ? iterationDuration - iterationElapsedTime : iterationElapsedTime;
    if (_ease) iterationTime = iterationDuration * _ease(iterationTime / iterationDuration) || 0;
    const isRunningBackwards = (parent ? parent.backwards : tickableAbsoluteTime < tickablePrevAbsoluteTime) ? !isReversed : !!isReversed;
    tickable._currentTime = tickableAbsoluteTime;
    tickable._iterationTime = iterationTime;
    tickable.backwards = isRunningBackwards;
    if (isCurrentTimeAboveZero && !tickable.began) {
      tickable.began = true;
      if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) {
        tickable.onBegin(
          /** @type {CallbackArgument} */
          tickable
        );
      }
    } else if (tickableAbsoluteTime <= 0) {
      tickable.began = false;
    }
    if (!muteCallbacks && !_hasChildren && isCurrentTimeAboveZero && tickable._currentIteration !== _currentIteration) {
      tickable.onLoop(
        /** @type {CallbackArgument} */
        tickable
      );
    }
    if (forcedTick || tickMode === tickModes.AUTO && // Timeline children render from their offset instead of their delay so the gap left by a truncated sibling is covered on seek.
    (time >= (parent && tickableDelay > 0 ? 0 : tickableDelay) && time <= tickableEndTime || // Normal render
    time <= tickableDelay && tickablePrevTime > tickableDelay || // Playhead is before the animation start time so make sure the animation is at its initial state
    time >= tickableEndTime && tickablePrevTime !== duration) || iterationTime >= tickableEndTime && tickablePrevTime !== duration || // iterationTime is per-iteration, compared to the delay to catch a backward seek into a looped iteration's delay region. Exclude the final settled end, where iterationTime clamps to duration and would falsely match the delay region when the delay exceeds the duration.
    iterationTime <= tickableDelay && tickablePrevTime > 0 && !isCurrentTimeEqualOrAboveDuration || time <= tickablePrevTime && tickablePrevTime === duration && completed || // Force a render if a seek occurs on an completed animation
    isCurrentTimeEqualOrAboveDuration && !completed && isSetter) {
      if (isCurrentTimeAboveZero) {
        tickable.computeDeltaTime(tickablePrevTime);
        if (!muteCallbacks) tickable.onBeforeUpdate(
          /** @type {CallbackArgument} */
          tickable
        );
      }
      if (!_hasChildren) {
        const forcedRender = forcedTick || (isRunningBackwards ? deltaTime * -1 : deltaTime) >= globals.tickThreshold;
        const absoluteTime = round(tickable._offset + (parent ? parent._offset : 0) + tickableDelay + iterationTime, 12);
        let tween = (
          /** @type {Tween} */
          /** @type {JSAnimation} */
          tickable._head
        );
        let tweenTarget;
        let tweenStyle;
        let tweenTargetTransforms;
        let tweenTargetTransformsProperties;
        let tweenTransformsNeedUpdate = 0;
        while (tween) {
          const tweenComposition = tween._composition;
          const tweenCurrentTime = tween._currentTime;
          const tweenChangeDuration = tween._changeDuration;
          const tweenAbsEndTime = tween._absoluteStartTime + tween._changeDuration;
          const tweenNextRep = tween._nextRep;
          const tweenPrevRep = tween._prevRep;
          const tweenHasComposition = tweenComposition !== compositionTypes.none;
          const tweenPrevRepEndTime = tweenPrevRep ? tweenPrevRep._absoluteStartTime + tweenPrevRep._changeDuration : 0;
          const tweenPrevRepIsCrossParent = tweenPrevRep && tweenPrevRep.parent !== tween.parent;
          const tweenNextRepTakeover = !tweenNextRep || tweenNextRep._isOverridden ? tweenAbsEndTime : tweenNextRep.parent === tween.parent ? tweenAbsEndTime + tweenNextRep._delay : tweenNextRep._absoluteStartTime < tweenNextRep._absoluteUpdateStartTime ? tweenNextRep._absoluteStartTime : tweenNextRep._absoluteUpdateStartTime;
          if ((forcedRender || // Tail keyframes always re-evaluate the gate so an earlier keyframe cannot leave the target stale by writing past its own range after a backward seek.
          (tweenCurrentTime !== tweenChangeDuration || absoluteTime <= tweenNextRepTakeover || tweenPrevRep && !tweenPrevRepIsCrossParent && (!tweenNextRep || tweenNextRep.parent !== tween.parent)) && // A cross parent tween re-renders its from value from the previous sibling truncated end so the handoff gap holds.
          // A keyframe re-renders its from revert while the next keyframe time is stale so a backward jump over its range cannot leave the next value in place.
          (tweenCurrentTime !== 0 || absoluteTime >= tween._absoluteStartTime || tweenPrevRepIsCrossParent && !tween._hasFromValue && !tweenPrevRep._isOverridden && absoluteTime >= tweenPrevRepEndTime || tweenNextRep && !tweenNextRep._isOverridden && tweenNextRep.parent === tween.parent && tweenNextRep._currentTime !== 0 && iterationTime < tweenNextRep._startTime)) && // Non-first keyframes wait until the iteration reaches their own start before rendering, so the previous keyframe can handle the from-revert when scrubbed backward past this tween's range.
          (!tweenPrevRep || tweenPrevRepIsCrossParent || iterationTime >= tween._startTime) && (!tweenHasComposition || !tween._isOverridden && (!tween._isOverlapped || absoluteTime <= tweenAbsEndTime) && // The next sibling owns the value past its takeover point, so yielding there keeps writes single owner in both directions.
          (!tweenNextRep || tweenNextRep._isOverridden || absoluteTime <= tweenNextRepTakeover) && // The previous sibling owns the value up to its truncated end.
          // Cross parent tweens take over the hold from that point, explicit from values wait for their own start.
          (!tweenPrevRep || (tweenPrevRep._isOverridden || (!tweenPrevRepIsCrossParent ? absoluteTime >= tweenPrevRepEndTime + tween._delay : absoluteTime >= tween._absoluteStartTime || !tween._hasFromValue && absoluteTime >= tweenPrevRepEndTime))))) {
            const tweenNewTime = tween._currentTime = clamp(iterationTime - tween._startTime, 0, tweenChangeDuration);
            const tweenProgress = tween._ease(tweenNewTime / tween._updateDuration);
            const tweenModifier = tween._modifier;
            const tweenValueType = tween._valueType;
            const tweenType = tween._tweenType;
            const tweenIsObject = tweenType === tweenTypes.OBJECT;
            const tweenIsNumber = tweenValueType === valueTypes.NUMBER;
            const tweenPrecision = tweenIsNumber && tweenIsObject || tweenProgress === 0 || tweenProgress === 1 ? -1 : globals.precision;
            let value;
            let number;
            if (tweenIsNumber) {
              value = number = /** @type {Number} */
              tweenModifier(round(lerp(tween._fromNumber, tween._toNumber, tweenProgress), tweenPrecision));
            } else if (tweenValueType === valueTypes.UNIT) {
              number = /** @type {Number} */
              tweenModifier(round(lerp(tween._fromNumber, tween._toNumber, tweenProgress), tweenPrecision));
              value = `${number}${tween._unit}`;
            } else if (tweenValueType === valueTypes.COLOR) {
              const ns = tween._numbers;
              const fn = tween._fromNumbers;
              const tn = tween._toNumbers;
              const omt = 1 - tweenProgress;
              const fr = fn[0], fg = fn[1], fb = fn[2];
              const tr = tn[0], tg = tn[1], tb = tn[2];
              ns[0] = /** @type {Number} */
              tweenModifier(Math.sqrt(fr * fr * omt + tr * tr * tweenProgress));
              ns[1] = /** @type {Number} */
              tweenModifier(Math.sqrt(fg * fg * omt + tg * tg * tweenProgress));
              ns[2] = /** @type {Number} */
              tweenModifier(Math.sqrt(fb * fb * omt + tb * tb * tweenProgress));
              ns[3] = /** @type {Number} */
              tweenModifier(lerp(fn[3], tn[3], tweenProgress));
              if (!tween._setter || internalRender) {
                value = `rgba(${round(ns[0], 0)},${round(ns[1], 0)},${round(ns[2], 0)},${ns[3]})`;
              }
            } else if (tweenValueType === valueTypes.COMPLEX) {
              value = composeComplexValue(tween, tweenProgress, tweenPrecision);
            }
            if (tweenHasComposition) {
              tween._number = number;
            }
            if (!internalRender && tweenComposition !== compositionTypes.blend) {
              const tweenProperty = tween.property;
              tweenTarget = tween.target;
              if (tween._setter) {
                tween._setter(tweenTarget, number, tween);
              } else if (tweenIsObject) {
                tweenTarget[tweenProperty] = value;
              } else if (tweenType === tweenTypes.ATTRIBUTE) {
                tweenTarget.setAttribute(
                  tweenProperty,
                  /** @type {String} */
                  value
                );
              } else {
                tweenStyle = /** @type {DOMTarget} */
                tweenTarget.style;
                if (tweenType === tweenTypes.TRANSFORM) {
                  if (tweenTarget !== tweenTargetTransforms) {
                    tweenTargetTransforms = tweenTarget;
                    tweenTargetTransformsProperties = tweenTarget[transformsSymbol];
                  }
                  tweenTargetTransformsProperties[tweenProperty] = value;
                  tweenTransformsNeedUpdate = 1;
                } else if (tweenType === tweenTypes.CSS) {
                  tweenStyle[tweenProperty] = value;
                } else if (tweenType === tweenTypes.CSS_VAR) {
                  tweenStyle.setProperty(
                    tweenProperty,
                    /** @type {String} */
                    value
                  );
                }
              }
              if (isCurrentTimeAboveZero) hasRendered = 1;
            } else {
              tween._value = value;
            }
          } else if (tweenCurrentTime && tweenPrevRep && !tweenPrevRepIsCrossParent && iterationTime < tween._startTime) {
            tween._currentTime = 0;
          }
          if (tweenTransformsNeedUpdate && tween._renderTransforms) {
            tweenStyle.transform = buildTransformString(tweenTargetTransformsProperties);
            tweenTransformsNeedUpdate = 0;
          }
          tween = tween._next;
        }
        if (!muteCallbacks && hasRendered) {
          tickable.onRender(
            /** @type {JSAnimation} */
            tickable
          );
        }
      }
      if (!muteCallbacks && isCurrentTimeAboveZero) {
        tickable.onUpdate(
          /** @type {CallbackArgument} */
          tickable
        );
      }
    }
    if (parent && isSetter) {
      if (!muteCallbacks && // (tickableAbsoluteTime > 0 instead) of (tickableAbsoluteTime >= duration) to prevent floating point precision issues
      // see: https://github.com/juliangarnier/anime/issues/1088
      (parent.began && !isRunningBackwards && tickableAbsoluteTime > 0 && !completed || isRunningBackwards && tickableAbsoluteTime <= minValue && completed)) {
        tickable.onComplete(
          /** @type {CallbackArgument} */
          tickable
        );
        tickable.completed = !isRunningBackwards;
      }
    } else if (isCurrentTimeAboveZero && isCurrentTimeEqualOrAboveDuration) {
      if (iterationCount === Infinity) {
        tickable._startTime += tickable.duration;
      } else if (tickable._currentIteration >= iterationCount - 1) {
        tickable.paused = true;
        if (!completed && !_hasChildren) {
          tickable.completed = true;
          if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) {
            tickable.onComplete(
              /** @type {CallbackArgument} */
              tickable
            );
            tickable._resolve(
              /** @type {CallbackArgument} */
              tickable
            );
          }
        }
      }
    } else {
      tickable.completed = false;
    }
    return hasRendered;
  };
  var tick = (tickable, time, muteCallbacks, internalRender, tickMode) => {
    const _currentIteration = tickable._currentIteration;
    render(tickable, time, muteCallbacks, internalRender, tickMode);
    if (tickable._hasChildren) {
      const tl = (
        /** @type {Timeline} */
        tickable
      );
      const tlIsRunningBackwards = tl.backwards;
      const tlChildrenTime = internalRender ? time : tl._iterationTime;
      const tlCildrenTickTime = now();
      let tlChildrenHasRendered = 0;
      let tlChildrenHaveCompleted = true;
      if (!internalRender && tl._currentIteration !== _currentIteration) {
        const tlIterationDuration = tl.iterationDuration;
        forEachChildren(tl, (child) => {
          if (!tlIsRunningBackwards) {
            if (!child.completed && !child.backwards && child._currentTime < child.iterationDuration) {
              render(child, tlIterationDuration, muteCallbacks, 1, tickModes.FORCE);
            }
            child.began = false;
            child.completed = false;
          } else {
            const childDuration = child.duration;
            const childStartTime = child._offset + child._delay;
            const childEndTime = childStartTime + childDuration;
            if (!muteCallbacks && childDuration <= minValue && (!childStartTime || childEndTime === tlIterationDuration)) {
              child.onComplete(child);
            }
          }
        });
        if (!muteCallbacks) tl.onLoop(
          /** @type {CallbackArgument} */
          tl
        );
      }
      forEachChildren(tl, (child) => {
        const childTime = round((tlChildrenTime - child._offset) * child._speed, 12);
        if (tlIsRunningBackwards && childTime > child._delay + child.duration) return;
        const childTickMode = child._fps < tl._fps ? child.requestTick(tlCildrenTickTime) : tickMode;
        tlChildrenHasRendered += render(child, childTime, muteCallbacks, internalRender, childTickMode);
        if (!child.completed && tlChildrenHaveCompleted) tlChildrenHaveCompleted = false;
      }, tlIsRunningBackwards);
      if (!muteCallbacks && tlChildrenHasRendered) tl.onRender(
        /** @type {CallbackArgument} */
        tl
      );
      if ((tlChildrenHaveCompleted || tlIsRunningBackwards) && tl._currentTime >= tl.duration) {
        tl.paused = true;
        if (!tl.completed) {
          tl.completed = true;
          if (!muteCallbacks) {
            tl.onComplete(
              /** @type {CallbackArgument} */
              tl
            );
            tl._resolve(
              /** @type {CallbackArgument} */
              tl
            );
          }
        }
      }
    }
  };

  // node_modules/animejs/dist/modules/core/styles.js
  var propertyNamesCache = {};
  var sanitizePropertyName = (propertyName, target, tweenType) => {
    if (tweenType === tweenTypes.TRANSFORM) {
      const t = shortTransforms.get(propertyName);
      return t ? t : propertyName;
    } else if (tweenType === tweenTypes.CSS || // Handle special cases where properties like "strokeDashoffset" needs to be set as "stroke-dashoffset"
    // but properties like "baseFrequency" should stay in lowerCamelCase
    tweenType === tweenTypes.ATTRIBUTE && (isSvg(target) && propertyName in /** @type {DOMTarget} */
    target.style)) {
      const cachedPropertyName = propertyNamesCache[propertyName];
      if (cachedPropertyName) {
        return cachedPropertyName;
      } else {
        const lowerCaseName = propertyName ? toLowerCase(propertyName) : propertyName;
        propertyNamesCache[propertyName] = lowerCaseName;
        return lowerCaseName;
      }
    } else {
      return propertyName;
    }
  };
  var revertValues = (renderable, inlineStylesOnly = false) => {
    if (renderable._hasChildren) {
      forEachChildren(renderable, (child) => revertValues(child, inlineStylesOnly), true);
    } else {
      const animation = (
        /** @type {JSAnimation} */
        renderable
      );
      animation.pause();
      forEachChildren(animation, (tween) => {
        const tweenProperty = tween.property;
        const tweenTarget = tween.target;
        const tweenType = tween._tweenType;
        const originalInlinedValue = tween._inlineValue;
        const tweenHadNoInlineValue = isNil(originalInlinedValue) || originalInlinedValue === emptyString;
        if (tween._setter) {
          if (!inlineStylesOnly && !tweenHadNoInlineValue) {
            decomposeRawValue(originalInlinedValue, decomposedOriginalValue);
            if (decomposedOriginalValue.d) {
              const src = decomposedOriginalValue.d;
              const dst = tween._numbers;
              for (let i = 0, l = src.length; i < l; i++) dst[i] = src[i];
            } else {
              tween._number = decomposedOriginalValue.n;
            }
            tween._setter(tween.target, tween._number, tween);
          }
        } else if (tweenType === tweenTypes.OBJECT) {
          if (!inlineStylesOnly && !tweenHadNoInlineValue) {
            tweenTarget[tweenProperty] = originalInlinedValue;
          }
        } else if (tweenTarget[isDomSymbol]) {
          if (tweenType === tweenTypes.ATTRIBUTE) {
            if (!inlineStylesOnly) {
              if (tweenHadNoInlineValue) {
                tweenTarget.removeAttribute(tweenProperty);
              } else {
                tweenTarget.setAttribute(
                  tweenProperty,
                  /** @type {String} */
                  originalInlinedValue
                );
              }
            }
          } else {
            const targetStyle = (
              /** @type {DOMTarget} */
              tweenTarget.style
            );
            if (tweenType === tweenTypes.TRANSFORM) {
              const cachedTransforms = tweenTarget[transformsSymbol];
              if (tweenHadNoInlineValue) {
                delete cachedTransforms[tweenProperty];
              } else {
                cachedTransforms[tweenProperty] = originalInlinedValue;
              }
              if (tween._renderTransforms) {
                if (!Object.keys(cachedTransforms).length) {
                  targetStyle.removeProperty("transform");
                } else {
                  targetStyle.transform = buildTransformString(cachedTransforms);
                }
              }
            } else {
              if (tweenHadNoInlineValue) {
                targetStyle.removeProperty(toLowerCase(tweenProperty));
              } else {
                targetStyle[tweenProperty] = originalInlinedValue;
              }
            }
          }
        }
        if (tweenTarget[isDomSymbol] && animation._tail === tween) {
          animation.targets.forEach((t) => {
            if (t.getAttribute && t.getAttribute("style") === emptyString) {
              t.removeAttribute("style");
            }
          });
        }
      });
    }
    return renderable;
  };

  // node_modules/animejs/dist/modules/core/clock.js
  var Clock = class {
    /** @param {Number} [initTime] */
    constructor(initTime = 0) {
      this.deltaTime = 0;
      this._currentTime = initTime;
      this._lastTickTime = initTime;
      this._startTime = initTime;
      this._lastTime = initTime;
      this._frameDuration = K / maxFps;
      this._fps = maxFps;
      this._speed = 1;
      this._hasChildren = false;
      this._head = null;
      this._tail = null;
    }
    get fps() {
      return this._fps;
    }
    set fps(frameRate) {
      const fr = +frameRate;
      const fps = fr < minValue ? minValue : fr;
      const frameDuration = K / fps;
      if (fps > defaults.frameRate) defaults.frameRate = fps;
      this._fps = fps;
      this._frameDuration = frameDuration;
    }
    get speed() {
      return this._speed;
    }
    set speed(playbackRate) {
      const pbr = +playbackRate;
      this._speed = pbr < minValue ? minValue : pbr;
    }
    /**
     * @param  {Number} time
     * @return {tickModes}
     */
    requestTick(time) {
      const frameDuration = this._frameDuration;
      const elapsed = time - this._lastTickTime;
      const scaled = frameDuration * 0.25;
      const tolerance = scaled < 4 ? scaled : 4;
      if (elapsed + tolerance < frameDuration) return tickModes.NONE;
      this._lastTickTime = elapsed >= frameDuration ? time - elapsed % frameDuration : time;
      return tickModes.AUTO;
    }
    /**
     * @param  {Number} time
     * @return {Number}
     */
    computeDeltaTime(time) {
      const delta = time - this._lastTime;
      this.deltaTime = delta;
      this._lastTime = time;
      return delta;
    }
  };

  // node_modules/animejs/dist/modules/animation/additive.js
  var additive = {
    animation: null,
    update: noop
  };
  var addAdditiveAnimation = (lookups2) => {
    let animation = additive.animation;
    if (!animation) {
      animation = {
        duration: minValue,
        computeDeltaTime: noop,
        _offset: 0,
        _delay: 0,
        _head: null,
        _tail: null
      };
      additive.animation = animation;
      additive.update = () => {
        lookups2.forEach((propertyAnimation) => {
          for (let propertyName in propertyAnimation) {
            const tweens = propertyAnimation[propertyName];
            const lookupTween = tweens._head;
            if (lookupTween) {
              const valueType = lookupTween._valueType;
              const additiveValues = valueType === valueTypes.COMPLEX || valueType === valueTypes.COLOR ? cloneArray(lookupTween._fromNumbers) : null;
              let additiveValue = lookupTween._fromNumber;
              let tween = tweens._tail;
              while (tween && tween !== lookupTween) {
                if (additiveValues) {
                  for (let i = 0, l = tween._numbers.length; i < l; i++) additiveValues[i] += tween._numbers[i];
                } else {
                  additiveValue += tween._number;
                }
                tween = tween._prevAdd;
              }
              lookupTween._toNumber = additiveValue;
              lookupTween._toNumbers = additiveValues;
            }
          }
        });
        render(animation, 1, 1, 0, tickModes.FORCE);
      };
    }
    return animation;
  };

  // node_modules/animejs/dist/modules/engine/engine.js
  var engineTickMethod = /* @__PURE__ */ (() => isBrowser ? requestAnimationFrame : setImmediate)();
  var engineCancelMethod = /* @__PURE__ */ (() => isBrowser ? cancelAnimationFrame : clearImmediate)();
  var Engine = class extends Clock {
    /** @param {Number} [initTime] */
    constructor(initTime) {
      super(initTime);
      this.useDefaultMainLoop = true;
      this.pauseOnDocumentHidden = true;
      this.defaults = defaults;
      this.paused = true;
      this.reqId = 0;
    }
    update() {
      const time = this._currentTime = now();
      if (this.requestTick(time)) {
        this.computeDeltaTime(time);
        const engineSpeed = this._speed;
        const engineFps = this._fps;
        let activeTickable = (
          /** @type {Tickable} */
          this._head
        );
        while (activeTickable) {
          const nextTickable = activeTickable._next;
          if (!activeTickable.paused) {
            tick(
              activeTickable,
              (time - activeTickable._startTime) * activeTickable._speed * engineSpeed,
              0,
              // !muteCallbacks
              0,
              // !internalRender
              activeTickable._fps < engineFps ? activeTickable.requestTick(time) : tickModes.AUTO
            );
          } else {
            removeChild(this, activeTickable);
            this._hasChildren = !!this._tail;
            activeTickable._running = false;
            if (activeTickable.completed && !activeTickable._cancelled) {
              activeTickable.cancel();
            }
          }
          activeTickable = nextTickable;
        }
        additive.update();
      }
    }
    wake() {
      if (this.useDefaultMainLoop && !this.reqId) {
        this.requestTick(now());
        this.reqId = engineTickMethod(tickEngine);
      }
      return this;
    }
    pause() {
      if (!this.reqId) return;
      this.paused = true;
      return killEngine();
    }
    resume() {
      if (!this.paused) return;
      this.paused = false;
      forEachChildren(this, (child) => child.resetTime());
      return this.wake();
    }
    // Getter and setter for speed
    get speed() {
      return this._speed * (globals.timeScale === 1 ? 1 : K);
    }
    set speed(playbackRate) {
      const speed = playbackRate * globals.timeScale;
      if (this._speed === speed) return;
      this._speed = speed;
      forEachChildren(this, (child) => child.speed = child._speed);
    }
    // Getter and setter for timeUnit
    get timeUnit() {
      return globals.timeScale === 1 ? "ms" : "s";
    }
    set timeUnit(unit) {
      const secondsScale = 1e-3;
      const isSecond = unit === "s";
      const newScale = isSecond ? secondsScale : 1;
      if (globals.timeScale !== newScale) {
        globals.timeScale = newScale;
        globals.tickThreshold = 200 * newScale;
        const scaleFactor = isSecond ? secondsScale : K;
        this.defaults.duration *= scaleFactor;
        this._speed *= scaleFactor;
      }
    }
    // Getter and setter for precision
    get precision() {
      return globals.precision;
    }
    set precision(precision) {
      globals.precision = precision;
    }
  };
  var engine = /* @__PURE__ */ (() => {
    const engine2 = new Engine(now());
    if (isBrowser) {
      globalVersions.engine = engine2;
      doc.addEventListener("visibilitychange", () => {
        if (!engine2.pauseOnDocumentHidden) return;
        doc.hidden ? engine2.pause() : engine2.resume();
      });
    }
    return engine2;
  })();
  var tickEngine = () => {
    if (engine._head) {
      engine.reqId = engineTickMethod(tickEngine);
      engine.update();
    } else {
      engine.reqId = 0;
    }
  };
  var killEngine = () => {
    engineCancelMethod(
      /** @type {NodeJS.Immediate & Number} */
      engine.reqId
    );
    engine.reqId = 0;
    return engine;
  };

  // node_modules/animejs/dist/modules/animation/composition.js
  var lookups = {
    /** @type {TweenReplaceLookups} */
    _rep: /* @__PURE__ */ new WeakMap(),
    /** @type {TweenAdditiveLookups} */
    _add: /* @__PURE__ */ new Map()
  };
  var getTweenSiblings = (target, property, lookup = "_rep") => {
    const lookupMap = lookups[lookup];
    let targetLookup = lookupMap.get(target);
    if (!targetLookup) {
      targetLookup = {};
      lookupMap.set(target, targetLookup);
    }
    return targetLookup[property] ? targetLookup[property] : targetLookup[property] = {
      _head: null,
      _tail: null
    };
  };
  var addTweenSortMethod = (p, c) => {
    return p._isOverridden || p._absoluteStartTime > c._absoluteStartTime;
  };
  var overrideTween = (tween) => {
    tween._isOverlapped = 1;
    tween._isOverridden = 1;
    tween._changeDuration = minValue;
    tween._currentTime = minValue;
  };
  var composeTween = (tween, siblings) => {
    const tweenCompositionType = tween._composition;
    if (tweenCompositionType === compositionTypes.replace) {
      const tweenAbsStartTime = tween._absoluteStartTime;
      addChild(siblings, tween, addTweenSortMethod, "_prevRep", "_nextRep");
      const prevSibling = tween._prevRep;
      if (prevSibling) {
        const prevParent = prevSibling.parent;
        const prevAbsEndTime = prevSibling._absoluteEndTime;
        if (
          // Check if the previous tween is from a different animation
          tween.parent.id !== prevParent.id && // Check if the animation has loops
          prevParent.iterationCount > 1 && // Check if _absoluteChangeEndTime of last loop overlaps the current tween
          prevAbsEndTime + (prevParent.duration - prevParent.iterationDuration) > tweenAbsStartTime
        ) {
          overrideTween(prevSibling);
          let prevPrevSibling = prevSibling._prevRep;
          while (prevPrevSibling && prevPrevSibling.parent.id === prevParent.id) {
            overrideTween(prevPrevSibling);
            prevPrevSibling = prevPrevSibling._prevRep;
          }
        }
        const absoluteUpdateStartTime = tween._absoluteUpdateStartTime;
        if (prevAbsEndTime > absoluteUpdateStartTime) {
          const prevChangeStartTime = prevSibling._startTime;
          const prevTLOffset = prevAbsEndTime - (prevChangeStartTime + prevSibling._updateDuration);
          const updatedPrevChangeDuration = round(absoluteUpdateStartTime - prevTLOffset - prevChangeStartTime, 12);
          prevSibling._changeDuration = updatedPrevChangeDuration;
          prevSibling._currentTime = updatedPrevChangeDuration;
          prevSibling._isOverlapped = 1;
          if (updatedPrevChangeDuration < minValue) {
            overrideTween(prevSibling);
          }
        }
        const tweenParentTL = tween.parent.parent;
        if (!tweenParentTL || tweenParentTL !== prevParent.parent) {
          let pausePrevParentAnimation = true;
          forEachChildren(prevParent, (t) => {
            if (!t._isOverlapped) pausePrevParentAnimation = false;
          });
          if (pausePrevParentAnimation) {
            const prevParentTL = prevParent.parent;
            if (prevParentTL) {
              let pausePrevParentTL = true;
              forEachChildren(prevParentTL, (a) => {
                if (a !== prevParent) {
                  forEachChildren(a, (t) => {
                    if (!t._isOverlapped) pausePrevParentTL = false;
                  });
                }
              });
              if (pausePrevParentTL) {
                prevParentTL.cancel();
              }
            } else {
              prevParent.cancel();
            }
          }
        }
      }
    } else if (tweenCompositionType === compositionTypes.blend) {
      const additiveTweenSiblings = getTweenSiblings(tween.target, tween.property, "_add");
      const additiveAnimation = addAdditiveAnimation(lookups._add);
      let lookupTween = additiveTweenSiblings._head;
      if (!lookupTween) {
        lookupTween = { ...tween };
        lookupTween._composition = compositionTypes.replace;
        lookupTween._updateDuration = minValue;
        lookupTween._startTime = 0;
        lookupTween._numbers = cloneArray(tween._fromNumbers);
        lookupTween._number = 0;
        lookupTween._next = null;
        lookupTween._prev = null;
        addChild(additiveTweenSiblings, lookupTween);
        addChild(additiveAnimation, lookupTween);
      }
      const toNumber = tween._toNumber;
      tween._fromNumber = lookupTween._fromNumber - toNumber;
      tween._toNumber = 0;
      tween._numbers = cloneArray(tween._fromNumbers);
      tween._number = 0;
      lookupTween._fromNumber = toNumber;
      if (tween._toNumbers.length) {
        const toNumbers = cloneArray(tween._toNumbers);
        toNumbers.forEach((value, i) => {
          tween._fromNumbers[i] = lookupTween._fromNumbers[i] - value;
          tween._toNumbers[i] = 0;
        });
        lookupTween._fromNumbers = toNumbers;
      }
      addChild(additiveTweenSiblings, tween, null, "_prevAdd", "_nextAdd");
    }
    return tween;
  };
  var removeTweenSliblings = (tween) => {
    const tweenComposition = tween._composition;
    if (tweenComposition !== compositionTypes.none) {
      const tweenTarget = tween.target;
      const tweenProperty = tween.property;
      const replaceTweensLookup = lookups._rep;
      const replaceTargetProps = replaceTweensLookup.get(tweenTarget);
      const tweenReplaceSiblings = replaceTargetProps[tweenProperty];
      removeChild(tweenReplaceSiblings, tween, "_prevRep", "_nextRep");
      if (tweenComposition === compositionTypes.blend) {
        const addTweensLookup = lookups._add;
        const addTargetProps = addTweensLookup.get(tweenTarget);
        if (!addTargetProps) return;
        const additiveTweenSiblings = addTargetProps[tweenProperty];
        const additiveAnimation = additive.animation;
        removeChild(additiveTweenSiblings, tween, "_prevAdd", "_nextAdd");
        const lookupTween = additiveTweenSiblings._head;
        if (lookupTween && lookupTween === additiveTweenSiblings._tail) {
          removeChild(additiveTweenSiblings, lookupTween, "_prevAdd", "_nextAdd");
          removeChild(additiveAnimation, lookupTween);
          let shouldClean = true;
          for (let prop in addTargetProps) {
            if (addTargetProps[prop]._head) {
              shouldClean = false;
              break;
            }
          }
          if (shouldClean) {
            addTweensLookup.delete(tweenTarget);
          }
        }
      }
    }
    return tween;
  };

  // node_modules/animejs/dist/modules/timer/timer.js
  var resetTimerProperties = (timer) => {
    timer.paused = true;
    timer.began = false;
    timer.completed = false;
    return timer;
  };
  var reviveTimer = (timer) => {
    if (!timer._cancelled) return timer;
    if (timer._hasChildren) {
      forEachChildren(timer, reviveTimer);
    } else {
      forEachChildren(timer, (tween) => {
        if (tween._composition !== compositionTypes.none) {
          composeTween(tween, getTweenSiblings(tween.target, tween.property));
        }
      });
    }
    timer._cancelled = 0;
    return timer;
  };
  var timerId = 0;
  var sortByPriority = (prev, child) => prev._priority > child._priority;
  var Timer = class extends Clock {
    /**
     * @param {TimerParams} [parameters]
     * @param {Timeline} [parent]
     * @param {Number} [parentPosition]
     */
    constructor(parameters = {}, parent = null, parentPosition = 0) {
      super(0);
      ++timerId;
      const {
        id,
        delay,
        duration,
        reversed,
        alternate,
        loop,
        loopDelay,
        autoplay,
        frameRate,
        playbackRate,
        priority,
        onComplete,
        onLoop,
        onPause,
        onBegin,
        onBeforeUpdate,
        onUpdate
      } = parameters;
      if (scope.current) scope.current.register(this);
      const timerInitTime = parent ? 0 : engine._lastTickTime;
      const timerDefaults = parent ? parent.defaults : globals.defaults;
      const timerDelay = (
        /** @type {Number} */
        isFnc(delay) || isUnd(delay) ? timerDefaults.delay : +delay
      );
      const timerDuration = isFnc(duration) || isUnd(duration) ? Infinity : +duration;
      const timerLoop = setValue(loop, timerDefaults.loop);
      const timerLoopDelay = setValue(loopDelay, timerDefaults.loopDelay);
      let timerIterationCount = timerLoop === true || timerLoop === Infinity || /** @type {Number} */
      timerLoop < 0 ? Infinity : (
        /** @type {Number} */
        timerLoop + 1
      );
      let offsetPosition = 0;
      if (parent) {
        offsetPosition = parentPosition;
      } else {
        if (!engine.reqId) engine.requestTick(now());
        offsetPosition = (engine._lastTickTime - engine._startTime) * globals.timeScale;
      }
      this.id = !isUnd(id) ? id : timerId;
      this.parent = parent;
      this.duration = clampInfinity((timerDuration + timerLoopDelay) * timerIterationCount - timerLoopDelay) || minValue;
      this.backwards = false;
      this.paused = true;
      this.began = false;
      this.completed = false;
      this.onBegin = onBegin || timerDefaults.onBegin;
      this.onBeforeUpdate = onBeforeUpdate || timerDefaults.onBeforeUpdate;
      this.onUpdate = onUpdate || timerDefaults.onUpdate;
      this.onLoop = onLoop || timerDefaults.onLoop;
      this.onPause = onPause || timerDefaults.onPause;
      this.onComplete = onComplete || timerDefaults.onComplete;
      this.iterationDuration = timerDuration;
      this.iterationCount = timerIterationCount;
      this._autoplay = parent ? false : setValue(autoplay, timerDefaults.autoplay);
      this._offset = offsetPosition;
      this._delay = timerDelay;
      this._loopDelay = timerLoopDelay;
      this._iterationTime = 0;
      this._currentIteration = 0;
      this._resolve = noop;
      this._running = false;
      this._reversed = +setValue(reversed, timerDefaults.reversed);
      this._reverse = this._reversed;
      this._cancelled = 0;
      this._alternate = setValue(alternate, timerDefaults.alternate);
      this._prev = null;
      this._next = null;
      this._lastTickTime = timerInitTime;
      this._startTime = timerInitTime;
      this._lastTime = timerInitTime;
      this._fps = setValue(frameRate, timerDefaults.frameRate);
      this._speed = setValue(playbackRate, timerDefaults.playbackRate);
      this._priority = +setValue(priority, 1);
    }
    get cancelled() {
      return !!this._cancelled;
    }
    set cancelled(cancelled) {
      cancelled ? this.cancel() : this.reset(true).play();
    }
    get currentTime() {
      return clamp(round(this._currentTime, globals.precision), -this._delay, this.duration);
    }
    set currentTime(time) {
      const paused = this.paused;
      this.pause().seek(+time);
      if (!paused) this.resume();
    }
    get iterationCurrentTime() {
      return clamp(round(this._iterationTime, globals.precision), 0, this.iterationDuration);
    }
    set iterationCurrentTime(time) {
      this.currentTime = this.iterationDuration * this._currentIteration + time;
    }
    get progress() {
      return clamp(round(this._currentTime / this.duration, 10), 0, 1);
    }
    set progress(progress) {
      this.currentTime = this.duration * progress;
    }
    get iterationProgress() {
      return clamp(round(this._iterationTime / this.iterationDuration, 10), 0, 1);
    }
    set iterationProgress(progress) {
      const iterationDuration = this.iterationDuration;
      this.currentTime = iterationDuration * this._currentIteration + iterationDuration * progress;
    }
    get currentIteration() {
      return this._currentIteration;
    }
    set currentIteration(iterationCount) {
      this.currentTime = this.iterationDuration * clamp(+iterationCount, 0, this.iterationCount - 1);
    }
    get reversed() {
      return !!this._reversed;
    }
    set reversed(reverse) {
      reverse ? this.reverse() : this.play();
    }
    get speed() {
      return super.speed;
    }
    set speed(playbackRate) {
      super.speed = playbackRate;
      this.resetTime();
    }
    /**
     * @param  {Boolean} [softReset]
     * @return {this}
     */
    reset(softReset = false) {
      reviveTimer(this);
      if (this._reversed && !this._reverse) this.reversed = false;
      this._iterationTime = this.iterationDuration;
      tick(this, 0, 1, ~~softReset, tickModes.FORCE);
      resetTimerProperties(this);
      if (this._hasChildren) {
        forEachChildren(this, resetTimerProperties);
      }
      return this;
    }
    /**
     * @param  {Boolean} internalRender
     * @return {this}
     */
    init(internalRender = false) {
      this.fps = this._fps;
      this.speed = this._speed;
      if (!internalRender && this._hasChildren) {
        tick(this, this.duration, 1, ~~internalRender, tickModes.FORCE);
      }
      this.reset(internalRender);
      const autoplay = this._autoplay;
      if (autoplay === true) {
        this.resume();
      } else if (autoplay && !isUnd(
        /** @type {ScrollObserver} */
        autoplay.linked
      )) {
        autoplay.link(this);
      }
      return this;
    }
    /** @return {this} */
    resetTime() {
      const timeScale = 1 / (this._speed * engine._speed);
      this._startTime = now() - (this._currentTime + this._delay) * timeScale;
      return this;
    }
    /** @return {this} */
    pause() {
      if (this.paused) return this;
      this.paused = true;
      this.onPause(this);
      return this;
    }
    /** @return {this} */
    resume() {
      if (!this.paused) return this;
      this.paused = false;
      if (this.duration <= minValue && !this._hasChildren) {
        tick(this, minValue, 0, 0, tickModes.FORCE);
      } else {
        if (!this._running) {
          addChild(engine, this, sortByPriority);
          engine._hasChildren = true;
          this._running = true;
        }
        this.resetTime();
        this._startTime -= 12;
        engine.wake();
      }
      return this;
    }
    /** @return {this} */
    restart() {
      return this.reset().resume();
    }
    /**
     * @param  {Number} time
     * @param  {Boolean|Number} [muteCallbacks]
     * @param  {Boolean|Number} [internalRender]
     * @return {this}
     */
    seek(time, muteCallbacks = 0, internalRender = 0) {
      reviveTimer(this);
      this.completed = false;
      const isPaused = this.paused;
      this.paused = true;
      tick(this, time + this._delay, ~~muteCallbacks, ~~internalRender, tickModes.AUTO);
      return isPaused ? this : this.resume();
    }
    /** @return {this} */
    alternate() {
      const reversed = this._reversed;
      const count = this.iterationCount;
      const duration = this.iterationDuration;
      const iterations = count === Infinity ? floor(maxValue / duration) : count;
      this._reversed = +(this._alternate && !(iterations % 2) ? reversed : !reversed);
      if (count === Infinity) {
        this.iterationProgress = this._reversed ? 1 - this.iterationProgress : this.iterationProgress;
      } else {
        this.seek(duration * iterations - this._currentTime);
      }
      this.resetTime();
      return this;
    }
    /** @return {this} */
    play() {
      if (this._reversed) this.alternate();
      return this.resume();
    }
    /** @return {this} */
    reverse() {
      if (!this._reversed) this.alternate();
      return this.resume();
    }
    // TODO: Move all the animation / tweens / children related code to Animation / Timeline
    /** @return {this} */
    cancel() {
      if (this._hasChildren) {
        forEachChildren(this, (child) => child.cancel(), true);
      } else {
        forEachChildren(this, removeTweenSliblings);
      }
      this._cancelled = 1;
      return this.pause();
    }
    /**
     * @param  {Number} newDuration
     * @return {this}
     */
    stretch(newDuration) {
      const currentDuration = this.duration;
      const normlizedDuration = normalizeTime(newDuration);
      if (currentDuration === normlizedDuration) return this;
      const timeScale = newDuration / currentDuration;
      const isSetter = newDuration <= minValue;
      this.duration = isSetter ? minValue : normlizedDuration;
      this.iterationDuration = isSetter ? minValue : normalizeTime(this.iterationDuration * timeScale);
      this._offset *= timeScale;
      this._delay *= timeScale;
      this._loopDelay *= timeScale;
      return this;
    }
    /**
      * Cancels the timer by seeking it back to 0 and reverting the attached scroller if necessary
      * @return {this}
      */
    revert() {
      tick(this, 0, 1, 0, tickModes.AUTO);
      const ap = (
        /** @type {ScrollObserver} */
        this._autoplay
      );
      if (ap && ap.linked && ap.linked === this) ap.revert();
      return this.cancel();
    }
    /**
      * Imediatly completes the timer, cancels it and triggers the onComplete callback
      * @param  {Boolean|Number} [muteCallbacks]
      * @return {this}
      */
    complete(muteCallbacks = 0) {
      return this.seek(this.duration, muteCallbacks).cancel();
    }
    /**
     * @typedef {this & {then: null}} ResolvedTimer
     */
    /**
     * @param  {Callback<ResolvedTimer>} [callback]
     * @return Promise<this>
     */
    then(callback = noop) {
      const then = this.then;
      const onResolve = () => {
        this.then = null;
        callback(
          /** @type {ResolvedTimer} */
          this
        );
        this.then = then;
        this._resolve = noop;
      };
      return new Promise((r) => {
        this._resolve = () => r(onResolve());
        if (this.completed) this._resolve();
        return this;
      });
    }
  };

  // node_modules/animejs/dist/modules/core/targets.js
  function getNodeList(v) {
    const n = isStr(v) ? scope.root.querySelectorAll(v) : v;
    if (n instanceof NodeList || n instanceof HTMLCollection) return n;
  }
  function parseTargets(targets) {
    if (isNil(targets)) return (
      /** @type {TargetsArray} */
      []
    );
    if (!isBrowser) return (
      /** @type {JSTargetsArray} */
      isArr(targets) && targets.flat(Infinity) || [targets]
    );
    if (isArr(targets)) {
      const flattened = targets.flat(Infinity);
      const parsed = [];
      for (let i = 0, l = flattened.length; i < l; i++) {
        const item = flattened[i];
        if (!isNil(item)) {
          const nodeList2 = getNodeList(item);
          if (nodeList2) {
            for (let j = 0, jl = nodeList2.length; j < jl; j++) {
              const subItem = nodeList2[j];
              if (!isNil(subItem)) {
                let isDuplicate = false;
                for (let k = 0, kl = parsed.length; k < kl; k++) {
                  if (parsed[k] === subItem) {
                    isDuplicate = true;
                    break;
                  }
                }
                if (!isDuplicate) {
                  parsed.push(subItem);
                }
              }
            }
          } else {
            let isDuplicate = false;
            for (let j = 0, jl = parsed.length; j < jl; j++) {
              if (parsed[j] === item) {
                isDuplicate = true;
                break;
              }
            }
            if (!isDuplicate) {
              parsed.push(item);
            }
          }
        }
      }
      return parsed;
    }
    const nodeList = getNodeList(targets);
    if (nodeList) return (
      /** @type {DOMTargetsArray} */
      Array.from(nodeList)
    );
    return (
      /** @type {TargetsArray} */
      [targets]
    );
  }
  function registerTargets(targets) {
    const parsedTargetsArray = parseTargets(targets);
    const parsedTargetsLength = parsedTargetsArray.length;
    for (let i = 0; i < parsedTargetsLength; i++) {
      const target = parsedTargetsArray[i];
      if (!target[isRegisteredTargetSymbol]) {
        target[isRegisteredTargetSymbol] = true;
        const isSvgType = isSvg(target);
        const isDom = (
          /** @type {DOMTarget} */
          target.nodeType || isSvgType
        );
        if (isDom) {
          target[isDomSymbol] = true;
          target[isSvgSymbol] = isSvgType;
          target[transformsSymbol] = {};
        }
      }
    }
    return parsedTargetsArray;
  }

  // node_modules/animejs/dist/modules/core/units.js
  var angleUnitsMap = { "deg": 1, "rad": 180 / PI, "turn": 360 };
  var convertedValuesCache = {};
  var convertValueUnit = (el, decomposedValue, unit, force = false) => {
    const currentUnit = decomposedValue.u;
    const currentNumber = decomposedValue.n;
    if (decomposedValue.t === valueTypes.UNIT && currentUnit === unit) {
      return decomposedValue;
    }
    const cachedKey = currentNumber + currentUnit + unit;
    const cached = convertedValuesCache[cachedKey];
    if (!isUnd(cached) && !force) {
      decomposedValue.n = cached;
    } else {
      let convertedValue;
      if (currentUnit in angleUnitsMap) {
        convertedValue = currentNumber * angleUnitsMap[currentUnit] / angleUnitsMap[unit];
      } else {
        const baseline = 100;
        const tempEl = (
          /** @type {DOMTarget} */
          el.cloneNode()
        );
        const parentNode = el.parentNode;
        const parentEl = parentNode && parentNode !== doc ? parentNode : doc.body;
        parentEl.appendChild(tempEl);
        const elStyle = tempEl.style;
        elStyle.width = baseline + currentUnit;
        const currentUnitWidth = (
          /** @type {HTMLElement} */
          tempEl.offsetWidth || baseline
        );
        elStyle.width = baseline + unit;
        const newUnitWidth = (
          /** @type {HTMLElement} */
          tempEl.offsetWidth || baseline
        );
        const factor = currentUnitWidth / newUnitWidth;
        parentEl.removeChild(tempEl);
        convertedValue = factor * currentNumber;
      }
      decomposedValue.n = convertedValue;
      convertedValuesCache[cachedKey] = convertedValue;
    }
    decomposedValue.t === valueTypes.UNIT;
    decomposedValue.u = unit;
    return decomposedValue;
  };

  // node_modules/animejs/dist/modules/easings/none.js
  var none = (t) => t;

  // node_modules/animejs/dist/modules/easings/eases/parser.js
  var easeInPower = (p = 1.68) => (t) => pow(t, +p);
  var easeTypes = {
    in: (easeIn) => (t) => easeIn(t),
    out: (easeIn) => (t) => 1 - easeIn(1 - t),
    inOut: (easeIn) => (t) => t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn(t * -2 + 2) / 2,
    outIn: (easeIn) => (t) => t < 0.5 ? (1 - easeIn(1 - t * 2)) / 2 : (easeIn(t * 2 - 1) + 1) / 2
  };
  var halfPI = PI / 2;
  var doublePI = PI * 2;
  var easeInFunctions = {
    [emptyString]: easeInPower,
    Quad: easeInPower(2),
    Cubic: easeInPower(3),
    Quart: easeInPower(4),
    Quint: easeInPower(5),
    /** @type {EasingFunction} */
    Sine: (t) => 1 - cos(t * halfPI),
    /** @type {EasingFunction} */
    Circ: (t) => 1 - sqrt(1 - t * t),
    /** @type {EasingFunction} */
    Expo: (t) => t ? pow(2, 10 * t - 10) : 0,
    /** @type {EasingFunction} */
    Bounce: (t) => {
      let pow2, b = 4;
      while (t < ((pow2 = pow(2, --b)) - 1) / 11) ;
      return 1 / pow(4, 3 - b) - 7.5625 * pow((pow2 * 3 - 2) / 22 - t, 2);
    },
    /** @type {BackEasing} */
    Back: (overshoot = 1.7) => (t) => (+overshoot + 1) * t * t * t - +overshoot * t * t,
    /** @type {ElasticEasing} */
    Elastic: (amplitude = 1, period = 0.3) => {
      const a = clamp(+amplitude, 1, 10);
      const p = clamp(+period, minValue, 2);
      const s = p / doublePI * asin(1 / a);
      const e = doublePI / p;
      return (t) => t === 0 || t === 1 ? t : -a * pow(2, -10 * (1 - t)) * sin((1 - t - s) * e);
    }
  };
  var eases = /* @__PURE__ */ (() => {
    const list = { linear: none, none };
    for (let type in easeTypes) {
      for (let name in easeInFunctions) {
        const easeIn = easeInFunctions[name];
        const easeType = easeTypes[type];
        list[type + name] = /** @type {EasingFunctionWithParams|EasingFunction} */
        name === emptyString || name === "Back" || name === "Elastic" ? (a, b) => easeType(
          /** @type {EasingFunctionWithParams} */
          easeIn(a, b)
        ) : easeType(
          /** @type {EasingFunction} */
          easeIn
        );
      }
    }
    return (
      /** @type {EasesFunctions} */
      list
    );
  })();
  var easesLookups = { linear: none, none };
  var parseEaseString = (string) => {
    if (easesLookups[string]) return easesLookups[string];
    if (string.indexOf("(") <= -1) {
      const hasParams = easeTypes[string] || string.includes("Back") || string.includes("Elastic");
      const parsedFn = (
        /** @type {EasingFunction} */
        hasParams ? (
          /** @type {EasingFunctionWithParams} */
          eases[string]()
        ) : eases[string]
      );
      return parsedFn ? easesLookups[string] = parsedFn : none;
    } else {
      const split2 = string.slice(0, -1).split("(");
      const parsedFn = (
        /** @type {EasingFunctionWithParams} */
        eases[split2[0]]
      );
      return parsedFn ? easesLookups[string] = parsedFn(...split2[1].split(",")) : none;
    }
  };
  var deprecated = ["steps(", "irregular(", "linear(", "cubicBezier("];
  var parseEase = (ease) => {
    if (isStr(ease)) {
      for (let i = 0, l = deprecated.length; i < l; i++) {
        if (stringStartsWith(ease, deprecated[i])) {
          console.warn(`String syntax for \`ease: "${ease}"\` has been removed from the core and replaced by importing and passing the easing function directly: \`ease: ${ease}\``);
          return none;
        }
      }
    }
    const easeFunc = isFnc(ease) ? ease : isStr(ease) ? parseEaseString(
      /** @type {String} */
      ease
    ) : none;
    return easeFunc;
  };

  // node_modules/animejs/dist/modules/animation/animation.js
  var fromTargetObject = createDecomposedValueTargetObject();
  var toTargetObject = createDecomposedValueTargetObject();
  var inlineStylesStore = {};
  var toFunctionStore = { func: null };
  var fromFunctionStore = { func: null };
  var keyframesTargetArray = [null];
  var fastSetValuesArray = [null, null];
  var keyObjectTarget = { to: null };
  var tweenId = 0;
  var JSAnimationId = 0;
  var keyframes;
  var key;
  var generateKeyframes = (keyframes2, parameters) => {
    const properties = {};
    if (isArr(keyframes2)) {
      const propertyNames = [].concat(.../** @type {DurationKeyframes} */
      keyframes2.map((key2) => Object.keys(key2))).filter(isKey);
      for (let i = 0, l = propertyNames.length; i < l; i++) {
        const propName = propertyNames[i];
        const propArray = (
          /** @type {DurationKeyframes} */
          keyframes2.map((key2) => {
            const newKey = {};
            for (let p in key2) {
              const keyValue = (
                /** @type {TweenPropValue} */
                key2[p]
              );
              if (isKey(p)) {
                if (p === propName) {
                  newKey.to = keyValue;
                }
              } else {
                newKey[p] = keyValue;
              }
            }
            return newKey;
          })
        );
        properties[propName] = /** @type {ArraySyntaxValue} */
        propArray;
      }
    } else {
      const totalDuration = (
        /** @type {Number} */
        setValue(parameters.duration, globals.defaults.duration)
      );
      const keys = Object.keys(keyframes2).map((key2) => {
        return { o: parseFloat(key2) / 100, p: keyframes2[key2] };
      }).sort((a, b) => a.o - b.o);
      keys.forEach((key2) => {
        const offset = key2.o;
        const prop = key2.p;
        for (let name in prop) {
          if (isKey(name)) {
            let propArray = (
              /** @type {Array} */
              properties[name]
            );
            if (!propArray) propArray = properties[name] = [];
            const duration = offset * totalDuration;
            let length = propArray.length;
            let prevKey = propArray[length - 1];
            const keyObj = { to: prop[name] };
            let durProgress = 0;
            for (let i = 0; i < length; i++) {
              durProgress += propArray[i].duration;
            }
            if (length === 1) {
              keyObj.from = prevKey.to;
            }
            if (prop.ease) {
              keyObj.ease = prop.ease;
            }
            keyObj.duration = duration - (length ? durProgress : 0);
            propArray.push(keyObj);
          }
        }
        return key2;
      });
      for (let name in properties) {
        const propArray = (
          /** @type {Array} */
          properties[name]
        );
        let prevEase;
        for (let i = 0, l = propArray.length; i < l; i++) {
          const prop = propArray[i];
          const currentEase = prop.ease;
          prop.ease = prevEase ? prevEase : void 0;
          prevEase = currentEase;
        }
        if (!propArray[0].duration) {
          propArray.shift();
        }
      }
    }
    return properties;
  };
  var JSAnimation = class extends Timer {
    /**
     * @param {TargetsParam} targets
     * @param {AnimationParams} parameters
     * @param {Timeline} [parent]
     * @param {Number} [parentPosition]
     * @param {Boolean} [fastSet=false]
     * @param {Number} [index=0]
     * @param {TargetsArray} [allTargets]
     */
    constructor(targets, parameters, parent, parentPosition, fastSet = false, index = 0, allTargets) {
      super(
        /** @type {TimerParams & AnimationParams} */
        parameters,
        parent,
        parentPosition
      );
      this._head;
      this._tail;
      ++JSAnimationId;
      const parsedTargets = registerTargets(targets);
      const targetsLength = parsedTargets.length;
      const kfParams = (
        /** @type {AnimationParams} */
        parameters.keyframes
      );
      const params = (
        /** @type {AnimationParams} */
        kfParams ? mergeObjects(generateKeyframes(
          /** @type {DurationKeyframes} */
          kfParams,
          parameters
        ), parameters) : parameters
      );
      const {
        id,
        delay,
        duration,
        ease,
        playbackEase,
        modifier,
        composition,
        onRender
      } = params;
      const animDefaults = parent ? parent.defaults : globals.defaults;
      const animEase = setValue(ease, animDefaults.ease);
      const animPlaybackEase = setValue(playbackEase, animDefaults.playbackEase);
      const parsedAnimPlaybackEase = animPlaybackEase ? parseEase(animPlaybackEase) : null;
      const hasSpring = !isUnd(
        /** @type {Spring} */
        animEase.ease
      );
      const tEasing = hasSpring ? (
        /** @type {Spring} */
        animEase.ease
      ) : setValue(ease, parsedAnimPlaybackEase ? "linear" : animDefaults.ease);
      const tDuration = hasSpring ? (
        /** @type {Spring} */
        animEase.settlingDuration
      ) : setValue(duration, animDefaults.duration);
      const tDelay = setValue(delay, animDefaults.delay);
      const tModifier = modifier || animDefaults.modifier;
      const tComposition = isUnd(composition) && targetsLength >= K ? compositionTypes.none : !isUnd(composition) ? composition : animDefaults.composition;
      const absoluteOffsetTime = this._offset + (parent ? parent._offset : 0);
      if (hasSpring) animEase.parent = this;
      let iterationDuration = NaN;
      let iterationDelay = NaN;
      let animationAnimationLength = 0;
      let shouldTriggerRender = 0;
      for (let targetIndex = 0; targetIndex < targetsLength; targetIndex++) {
        const target = parsedTargets[targetIndex];
        const ti = index || targetIndex;
        const tl = allTargets || parsedTargets;
        let lastTransformGroupIndex = NaN;
        let lastTransformGroupLength = NaN;
        for (let p in params) {
          if (isKey(p)) {
            const tweenType = getTweenType(target, p);
            const adapterProp = resolveAdapterEntry(target, p);
            const propName = sanitizePropertyName(p, target, tweenType);
            let propValue = params[p];
            const isPropValueArray = isArr(propValue);
            if (fastSet && !isPropValueArray) {
              fastSetValuesArray[0] = propValue;
              fastSetValuesArray[1] = propValue;
              propValue = fastSetValuesArray;
            }
            if (isPropValueArray) {
              const arrayLength = (
                /** @type {Array} */
                propValue.length
              );
              const isNotObjectValue = !isObj(propValue[0]);
              if (arrayLength === 2 && isNotObjectValue) {
                keyObjectTarget.to = /** @type {TweenParamValue} */
                /** @type {unknown} */
                propValue;
                keyframesTargetArray[0] = keyObjectTarget;
                keyframes = keyframesTargetArray;
              } else if (arrayLength > 2 && isNotObjectValue) {
                keyframes = [];
                propValue.forEach((v, i) => {
                  if (!i) {
                    fastSetValuesArray[0] = v;
                  } else if (i === 1) {
                    fastSetValuesArray[1] = v;
                    keyframes.push(fastSetValuesArray);
                  } else {
                    keyframes.push(v);
                  }
                });
              } else {
                keyframes = /** @type {Array.<TweenKeyValue>} */
                propValue;
              }
            } else {
              keyframesTargetArray[0] = propValue;
              keyframes = keyframesTargetArray;
            }
            let siblings = null;
            let prevTween = null;
            let firstTweenChangeStartTime = NaN;
            let lastTweenChangeEndTime = 0;
            let tweenIndex = 0;
            for (let l = keyframes.length; tweenIndex < l; tweenIndex++) {
              const keyframe = keyframes[tweenIndex];
              if (isObj(keyframe)) {
                key = keyframe;
              } else {
                keyObjectTarget.to = /** @type {TweenParamValue} */
                keyframe;
                key = keyObjectTarget;
              }
              toFunctionStore.func = null;
              fromFunctionStore.func = null;
              const computedComposition = getFunctionValue(setValue(key.composition, tComposition), target, ti, tl, null, null);
              const tweenComposition = isNum(computedComposition) ? computedComposition : compositionTypes[computedComposition];
              if (!siblings && tweenComposition !== compositionTypes.none) siblings = getTweenSiblings(target, propName);
              const tailTween = siblings ? siblings._tail : null;
              const prevSiblingTween = parent && tailTween && tailTween.parent.parent === parent ? tailTween : prevTween;
              const computedToValue = getFunctionValue(key.to, target, ti, tl, toFunctionStore, prevSiblingTween);
              let tweenToValue;
              if (isObj(computedToValue) && !isUnd(computedToValue.to)) {
                key = computedToValue;
                tweenToValue = computedToValue.to;
              } else {
                tweenToValue = computedToValue;
              }
              const tweenFromValue = getFunctionValue(key.from, target, ti, tl, fromFunctionStore, prevSiblingTween);
              const easeToParse = key.ease || tEasing;
              const easeFunctionResult = getFunctionValue(easeToParse, target, ti, tl, null, prevSiblingTween);
              const keyEasing = isFnc(easeFunctionResult) || isStr(easeFunctionResult) ? easeFunctionResult : easeToParse;
              const hasSpring2 = !isUnd(keyEasing) && !isUnd(
                /** @type {Spring} */
                keyEasing.ease
              );
              const tweenEasing = hasSpring2 ? (
                /** @type {Spring} */
                keyEasing.ease
              ) : keyEasing;
              const tweenDuration = hasSpring2 ? (
                /** @type {Spring} */
                keyEasing.settlingDuration
              ) : getFunctionValue(setValue(key.duration, l > 1 ? getFunctionValue(tDuration, target, ti, tl, null, prevSiblingTween) / l : tDuration), target, ti, tl, null, prevSiblingTween);
              const tweenDelay = getFunctionValue(setValue(key.delay, !tweenIndex ? tDelay : 0), target, ti, tl, null, prevSiblingTween);
              const tweenModifier = key.modifier || tModifier;
              const hasFromvalue = !isUnd(tweenFromValue);
              const hasToValue = !isUnd(tweenToValue);
              const isFromToArray = isArr(tweenToValue);
              const isFromToValue = isFromToArray || hasFromvalue && hasToValue;
              const tweenUpdateStartLocal = prevTween ? lastTweenChangeEndTime : 0;
              const tweenStartTime = prevTween ? lastTweenChangeEndTime + tweenDelay : tweenDelay;
              const absoluteStartTime = round(absoluteOffsetTime + tweenStartTime, 12);
              const absoluteUpdateStartTime = round(absoluteOffsetTime + tweenUpdateStartLocal, 12);
              if (!shouldTriggerRender && (hasFromvalue || isFromToArray)) shouldTriggerRender = 1;
              let prevSibling = prevTween;
              if (tweenComposition !== compositionTypes.none) {
                let nextSibling = siblings._head;
                while (nextSibling && nextSibling._absoluteStartTime <= absoluteStartTime) {
                  if (!nextSibling._isOverridden) prevSibling = nextSibling;
                  nextSibling = nextSibling._nextRep;
                  if (nextSibling && nextSibling._absoluteStartTime >= absoluteStartTime) {
                    while (nextSibling) {
                      overrideTween(nextSibling);
                      nextSibling = nextSibling._nextRep;
                    }
                  }
                }
              }
              if (isFromToValue) {
                decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[0], target, ti, tl, fromFunctionStore, prevSiblingTween) : tweenFromValue, fromTargetObject);
                decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[1], target, ti, tl, toFunctionStore, prevSiblingTween) : tweenToValue, toTargetObject);
                const originalValue = getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore);
                if (fromTargetObject.t === valueTypes.NUMBER) {
                  if (prevSibling) {
                    if (prevSibling._valueType === valueTypes.UNIT) {
                      fromTargetObject.t = valueTypes.UNIT;
                      fromTargetObject.u = prevSibling._unit;
                    }
                  } else {
                    decomposeRawValue(
                      originalValue,
                      decomposedOriginalValue
                    );
                    if (decomposedOriginalValue.t === valueTypes.UNIT) {
                      fromTargetObject.t = valueTypes.UNIT;
                      fromTargetObject.u = decomposedOriginalValue.u;
                    }
                  }
                }
              } else {
                if (hasToValue) {
                  decomposeRawValue(tweenToValue, toTargetObject);
                } else {
                  if (prevTween) {
                    decomposeTweenValue(prevTween, toTargetObject);
                  } else {
                    decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value : getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore), toTargetObject);
                  }
                }
                if (hasFromvalue) {
                  decomposeRawValue(tweenFromValue, fromTargetObject);
                } else {
                  if (prevTween) {
                    decomposeTweenValue(prevTween, fromTargetObject);
                  } else {
                    decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value : getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore), fromTargetObject);
                  }
                }
              }
              if (fromTargetObject.o) {
                fromTargetObject.n = getRelativeValue(
                  !prevSibling ? decomposeRawValue(
                    getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore),
                    decomposedOriginalValue
                  ).n : prevSibling._toNumber,
                  fromTargetObject.n,
                  fromTargetObject.o
                );
              }
              if (toTargetObject.o) {
                toTargetObject.n = getRelativeValue(fromTargetObject.n, toTargetObject.n, toTargetObject.o);
              }
              if (fromTargetObject.t !== toTargetObject.t) {
                if (fromTargetObject.t === valueTypes.COMPLEX || toTargetObject.t === valueTypes.COMPLEX) {
                  const complexValue = fromTargetObject.t === valueTypes.COMPLEX ? fromTargetObject : toTargetObject;
                  const notComplexValue = fromTargetObject.t === valueTypes.COMPLEX ? toTargetObject : fromTargetObject;
                  notComplexValue.t = valueTypes.COMPLEX;
                  notComplexValue.s = cloneArray(complexValue.s);
                  notComplexValue.d = complexValue.d.map(() => notComplexValue.n);
                } else if (fromTargetObject.t === valueTypes.UNIT || toTargetObject.t === valueTypes.UNIT) {
                  const unitValue = fromTargetObject.t === valueTypes.UNIT ? fromTargetObject : toTargetObject;
                  const notUnitValue = fromTargetObject.t === valueTypes.UNIT ? toTargetObject : fromTargetObject;
                  notUnitValue.t = valueTypes.UNIT;
                  notUnitValue.u = unitValue.u;
                } else if (fromTargetObject.t === valueTypes.COLOR || toTargetObject.t === valueTypes.COLOR) {
                  const colorValue = fromTargetObject.t === valueTypes.COLOR ? fromTargetObject : toTargetObject;
                  const notColorValue = fromTargetObject.t === valueTypes.COLOR ? toTargetObject : fromTargetObject;
                  notColorValue.t = valueTypes.COLOR;
                  notColorValue.d = colorValue.d.map(() => 0);
                }
              }
              if (fromTargetObject.u !== toTargetObject.u) {
                let valueToConvert = toTargetObject.u ? fromTargetObject : toTargetObject;
                valueToConvert = convertValueUnit(
                  /** @type {DOMTarget} */
                  target,
                  valueToConvert,
                  toTargetObject.u ? toTargetObject.u : fromTargetObject.u,
                  false
                );
              }
              if (toTargetObject.d && fromTargetObject.d && toTargetObject.d.length !== fromTargetObject.d.length) {
                const longestValue = fromTargetObject.d.length > toTargetObject.d.length ? fromTargetObject : toTargetObject;
                const shortestValue = longestValue === fromTargetObject ? toTargetObject : fromTargetObject;
                shortestValue.d = longestValue.d.map((_, i) => isUnd(shortestValue.d[i]) ? 0 : shortestValue.d[i]);
                shortestValue.s = cloneArray(longestValue.s);
              }
              const tweenUpdateDuration = round(+tweenDuration || minValue, 12);
              let inlineValue = inlineStylesStore[propName];
              if (!isNil(inlineValue)) inlineStylesStore[propName] = null;
              const tweenSetter = adapterProp ? adapterProp.set : null;
              lastTweenChangeEndTime = round(tweenStartTime + tweenUpdateDuration, 12);
              const fromD = fromTargetObject.d;
              const toD = toTargetObject.d;
              const toS = toTargetObject.s;
              const tween = {
                parent: this,
                id: tweenId++,
                property: propName,
                target,
                _value: null,
                _toFunc: toFunctionStore.func,
                _fromFunc: fromFunctionStore.func,
                _ease: parseEase(tweenEasing),
                _fromNumbers: fromD ? cloneArray(fromD) : emptyArray,
                _toNumbers: toD ? cloneArray(toD) : emptyArray,
                _strings: toS ? cloneArray(toS) : emptyArray,
                _fromNumber: fromTargetObject.n,
                _toNumber: toTargetObject.n,
                _numbers: fromD ? cloneArray(fromD) : emptyArray,
                // For additive tween and animatables
                _number: fromTargetObject.n,
                // For additive tween and animatables
                _unit: toTargetObject.u,
                _modifier: tweenModifier,
                _currentTime: 0,
                _startTime: tweenStartTime,
                _delay: +tweenDelay,
                _updateDuration: tweenUpdateDuration,
                _changeDuration: tweenUpdateDuration,
                _absoluteStartTime: absoluteStartTime,
                _absoluteUpdateStartTime: absoluteUpdateStartTime,
                _absoluteEndTime: round(absoluteOffsetTime + lastTweenChangeEndTime, 12),
                _hasFromValue: hasFromvalue || isFromToArray ? 1 : 0,
                // NOTE: Investigate bit packing to stores ENUM / BOOL
                _tweenType: tweenType,
                _setter: tweenSetter,
                _valueType: toTargetObject.t,
                _composition: tweenComposition,
                _isOverlapped: 0,
                _isOverridden: 0,
                _renderTransforms: 0,
                _inlineValue: inlineValue,
                _prevRep: null,
                // For replaced tween
                _nextRep: null,
                // For replaced tween
                _prevAdd: null,
                // For additive tween
                _nextAdd: null,
                // For additive tween
                _prev: null,
                _next: null
              };
              if (tweenComposition !== compositionTypes.none) {
                composeTween(tween, siblings);
              }
              const vt = tween._valueType;
              if (vt === valueTypes.COMPLEX) {
                tween._value = composeComplexValue(tween, 1, -1);
              } else if (vt === valueTypes.UNIT) {
                tween._value = `${tweenModifier(tween._toNumber)}${tween._unit}`;
              } else if (vt === valueTypes.COLOR) {
                const d = toTargetObject.d;
                tween._value = `rgba(${round(d[0], 0)},${round(d[1], 0)},${round(d[2], 0)},${d[3]})`;
              } else {
                tween._value = tweenModifier(tween._toNumber);
              }
              if (isNaN(firstTweenChangeStartTime)) {
                firstTweenChangeStartTime = tween._startTime;
              }
              prevTween = tween;
              animationAnimationLength++;
              addChild(this, tween);
            }
            if (isNaN(iterationDelay) || firstTweenChangeStartTime < iterationDelay) {
              iterationDelay = firstTweenChangeStartTime;
            }
            if (isNaN(iterationDuration) || lastTweenChangeEndTime > iterationDuration) {
              iterationDuration = lastTweenChangeEndTime;
            }
            if (tweenType === tweenTypes.TRANSFORM) {
              lastTransformGroupIndex = animationAnimationLength - tweenIndex;
              lastTransformGroupLength = animationAnimationLength;
            }
          }
        }
        if (!isNaN(lastTransformGroupIndex)) {
          let i = 0;
          forEachChildren(this, (tween) => {
            if (i >= lastTransformGroupIndex && i < lastTransformGroupLength) {
              tween._renderTransforms = 1;
              if (tween._composition === compositionTypes.blend) {
                forEachChildren(additive.animation, (additiveTween) => {
                  if (additiveTween.id === tween.id) {
                    additiveTween._renderTransforms = 1;
                  }
                });
              }
            }
            i++;
          });
        }
      }
      if (!targetsLength) {
        console.warn(`No target found. Make sure the element you're trying to animate is accessible before creating your animation.`);
      }
      if (iterationDelay) {
        forEachChildren(this, (tween) => {
          if (!(tween._startTime - tween._delay)) {
            tween._delay -= iterationDelay;
          }
          tween._startTime -= iterationDelay;
        });
        iterationDuration -= iterationDelay;
      } else {
        iterationDelay = 0;
      }
      if (!iterationDuration) {
        iterationDuration = minValue;
        this.iterationCount = 0;
      }
      this.targets = parsedTargets;
      this.id = !isUnd(id) ? id : JSAnimationId;
      this.duration = iterationDuration === minValue ? minValue : clampInfinity((iterationDuration + this._loopDelay) * this.iterationCount - this._loopDelay) || minValue;
      this.onRender = onRender || animDefaults.onRender;
      this._ease = parsedAnimPlaybackEase;
      this._delay = iterationDelay;
      this.iterationDuration = iterationDuration;
      if (!this._autoplay && shouldTriggerRender) this.onRender(this);
    }
    /**
     * @param  {Number} newDuration
     * @return {this}
     */
    stretch(newDuration) {
      const currentDuration = this.duration;
      if (currentDuration === normalizeTime(newDuration)) return this;
      const timeScale = newDuration / currentDuration;
      forEachChildren(this, (tween) => {
        tween._updateDuration = normalizeTime(tween._updateDuration * timeScale);
        tween._changeDuration = normalizeTime(tween._changeDuration * timeScale);
        tween._currentTime *= timeScale;
        tween._delay *= timeScale;
        tween._startTime *= timeScale;
        tween._absoluteStartTime *= timeScale;
        tween._absoluteUpdateStartTime *= timeScale;
        tween._absoluteEndTime *= timeScale;
      });
      return super.stretch(newDuration);
    }
    /**
     * @return {this}
     */
    refresh() {
      forEachChildren(this, (tween) => {
        const toFunc = tween._toFunc;
        const fromFunc = tween._fromFunc;
        if (toFunc || fromFunc) {
          if (fromFunc) {
            decomposeRawValue(fromFunc(), fromTargetObject);
            if (fromTargetObject.u !== tween._unit && tween.target[isDomSymbol]) {
              convertValueUnit(
                /** @type {DOMTarget} */
                tween.target,
                fromTargetObject,
                tween._unit,
                true
              );
            }
            tween._fromNumbers = cloneArray(fromTargetObject.d);
            tween._fromNumber = fromTargetObject.n;
          } else if (toFunc) {
            decomposeRawValue(getOriginalAnimatableValue(tween.target, tween.property, tween._tweenType), decomposedOriginalValue);
            tween._fromNumbers = cloneArray(decomposedOriginalValue.d);
            tween._fromNumber = decomposedOriginalValue.n;
          }
          if (toFunc) {
            decomposeRawValue(toFunc(), toTargetObject);
            tween._toNumbers = cloneArray(toTargetObject.d);
            tween._strings = cloneArray(toTargetObject.s);
            tween._toNumber = toTargetObject.o ? getRelativeValue(tween._fromNumber, toTargetObject.n, toTargetObject.o) : toTargetObject.n;
          }
        }
      });
      if (this.duration === minValue) this.restart();
      return this;
    }
    /**
     * Cancel the animation and revert all the values affected by this animation to their original state
     * @return {this}
     */
    revert() {
      super.revert();
      return revertValues(this);
    }
    /**
     * @typedef {this & {then: null}} ResolvedJSAnimation
     */
    /**
     * @param  {Callback<ResolvedJSAnimation>} [callback]
     * @return Promise<this>
     */
    then(callback) {
      return super.then(callback);
    }
  };
  var animate = (targets, parameters) => {
    if (globals.editor) {
      return globals.editor.addAnimation(targets, parameters);
    } else {
      return new JSAnimation(targets, parameters, null, 0, false).init();
    }
  };

  // node_modules/animejs/dist/modules/timeline/position.js
  var getPrevChildOffset = (timeline, timePosition) => {
    if (stringStartsWith(timePosition, "<")) {
      const goToPrevAnimationOffset = timePosition[1] === "<";
      const prevAnimation = (
        /** @type {Tickable} */
        timeline._tail
      );
      const prevOffset = prevAnimation ? prevAnimation._offset + prevAnimation._delay : 0;
      return goToPrevAnimationOffset ? prevOffset : prevOffset + prevAnimation.duration;
    }
  };
  var parseTimelinePosition = (timeline, timePosition) => {
    let tlDuration = timeline.iterationDuration;
    if (tlDuration === minValue) tlDuration = 0;
    if (isUnd(timePosition)) return tlDuration;
    if (isNum(+timePosition)) return +timePosition;
    const timePosStr = (
      /** @type {String} */
      timePosition
    );
    const tlLabels = timeline ? timeline.labels : null;
    const hasLabels = !isNil(tlLabels);
    const prevOffset = getPrevChildOffset(timeline, timePosStr);
    const hasSibling = !isUnd(prevOffset);
    const matchedRelativeOperator = relativeValuesExecRgx.exec(timePosStr);
    if (matchedRelativeOperator) {
      const fullOperator = matchedRelativeOperator[0];
      const split2 = timePosStr.split(fullOperator);
      const labelOffset = hasLabels && split2[0] ? tlLabels[split2[0]] : tlDuration;
      const parsedOffset = hasSibling ? prevOffset : hasLabels ? labelOffset : tlDuration;
      const parsedNumericalOffset = +split2[1];
      return getRelativeValue(parsedOffset, parsedNumericalOffset, fullOperator[0]);
    } else {
      return hasSibling ? prevOffset : hasLabels ? !isUnd(tlLabels[timePosStr]) ? tlLabels[timePosStr] : tlDuration : tlDuration;
    }
  };

  // node_modules/animejs/dist/modules/utils/time.js
  var keepTime = (constructor) => {
    let tracked;
    return (
      /** @type {(...args: any[]) => T extends void ? () => void : T} */
      /** @type {*} */
      ((...args) => {
        let currentIteration, currentIterationProgress, reversed, alternate, startTime;
        if (tracked) {
          currentIteration = tracked.currentIteration;
          currentIterationProgress = tracked.iterationProgress;
          reversed = tracked.reversed;
          alternate = tracked._alternate;
          startTime = tracked._startTime;
          tracked.revert();
        }
        const cleanup = constructor(...args);
        if (cleanup && !isFnc(cleanup) && cleanup.revert) tracked = cleanup;
        if (!isUnd(currentIterationProgress)) {
          tracked.currentIteration = currentIteration;
          tracked.iterationProgress = (alternate ? !(currentIteration % 2) ? reversed : !reversed : reversed) ? 1 - currentIterationProgress : currentIterationProgress;
          tracked._startTime = startTime;
        }
        return cleanup || noop;
      })
    );
  };

  // node_modules/animejs/dist/modules/utils/random.js
  var random = (min = 0, max = 1, decimalLength = 0) => {
    const m = 10 ** decimalLength;
    return Math.floor((Math.random() * (max - min + 1 / m) + min) * m) / m;
  };
  var _seed = 0;
  var createSeededRandom = (seed, seededMin = 0, seededMax = 1, seededDecimalLength = 0) => {
    let t = seed === void 0 ? _seed++ : seed;
    return (min = seededMin, max = seededMax, decimalLength = seededDecimalLength) => {
      t += 1831565813;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      const m = 10 ** decimalLength;
      return Math.floor((((t ^ t >>> 14) >>> 0) / 4294967296 * (max - min + 1 / m) + min) * m) / m;
    };
  };
  var shuffle = (items, rnd = random) => {
    let m = items.length, t, i;
    while (m) {
      i = rnd(0, --m);
      t = items[m];
      items[m] = items[i];
      items[i] = t;
    }
    return items;
  };

  // node_modules/animejs/dist/modules/utils/stagger.js
  var stagger = (val, params = {}) => {
    let values = [];
    let maxValue2 = 0;
    let cachedOffset;
    let jitterSamples = null;
    const from = params.from;
    const reversed = params.reversed;
    const ease = params.ease;
    const hasEasing = !isUnd(ease);
    const hasSpring = hasEasing && !isUnd(
      /** @type {Spring} */
      ease.ease
    );
    const staggerEase = hasSpring ? (
      /** @type {Spring} */
      ease.ease
    ) : hasEasing ? parseEase(ease) : null;
    const grid = params.grid;
    const autoGrid = grid === true;
    const axis = params.axis;
    const customTotal = params.total;
    const fromFirst = isUnd(from) || from === 0 || from === "first";
    const fromCenter = from === "center";
    const fromLast = from === "last";
    const fromRandom = from === "random";
    const fromArr = isArr(from);
    const isRange = isArr(val);
    const useProp = params.use;
    const val1 = isRange ? parseNumber(val[0]) : parseNumber(val);
    const val2 = isRange ? parseNumber(val[1]) : 0;
    const unitMatch = unitsExecRgx.exec((isRange ? val[1] : val) + emptyString);
    const start = params.start || 0 + (isRange ? val1 : 0);
    const seed = params.seed;
    const hasSeed = !isUnd(seed) && seed !== false;
    const rng = hasSeed ? createSeededRandom(seed === true ? 0 : (
      /** @type {Number} */
      seed
    )) : random;
    const jitter = params.jitter;
    const hasJitter = !isUnd(jitter);
    const jitterIsArr = isArr(jitter);
    const jitterStart = jitterIsArr ? (
      /** @type {[Number,Number]} */
      jitter[0]
    ) : (
      /** @type {Number} */
      jitter || 0
    );
    const jitterEnd = jitterIsArr ? (
      /** @type {[Number,Number]} */
      jitter[1]
    ) : (
      /** @type {Number} */
      jitter || 0
    );
    let fromIndex = fromFirst ? 0 : isNum(from) ? from : 0;
    return (target, i, t, _, tl) => {
      const [registeredTarget] = registerTargets(target);
      const total = isUnd(customTotal) ? t.length : customTotal;
      const customIndex = !isUnd(useProp) ? isFnc(useProp) ? useProp(registeredTarget, i, total) : getOriginalAnimatableValue(registeredTarget, useProp) : false;
      const customIdx = isNum(customIndex) || isStr(customIndex) && isNum(+customIndex) ? +customIndex : i;
      const staggerIndex = customIdx >= 0 && customIdx < total ? customIdx : i;
      if (fromCenter) fromIndex = (total - 1) / 2;
      if (fromLast) fromIndex = total - 1;
      if (!values.length) {
        if (autoGrid) {
          let hasPositions = true;
          let has3D = false;
          let minPosX = Infinity;
          let minPosY = Infinity;
          let minPosZ = Infinity;
          let maxPosX = -Infinity;
          let maxPosY = -Infinity;
          let maxPosZ = -Infinity;
          const pxArr = [];
          const pyArr = [];
          const pzArr = [];
          for (let index = 0; index < total; index++) {
            const el = t[index];
            let px = 0;
            let py = 0;
            let pz = 0;
            let found = false;
            if (el && isFnc(el.getBoundingClientRect)) {
              const rect = el.getBoundingClientRect();
              px = rect.left + rect.width / 2;
              py = rect.top + rect.height / 2;
              found = true;
            } else {
              const obj = (
                /** @type {JSTarget} */
                el
              );
              if (obj && isNum(obj.x) && isNum(obj.y)) {
                px = obj.x;
                py = obj.y;
                if (isNum(obj.z)) {
                  pz = obj.z;
                  has3D = true;
                }
                found = true;
              }
            }
            if (!found) {
              hasPositions = false;
              break;
            }
            pxArr.push(px);
            pyArr.push(py);
            pzArr.push(pz);
            if (px < minPosX) minPosX = px;
            if (py < minPosY) minPosY = py;
            if (pz < minPosZ) minPosZ = pz;
            if (px > maxPosX) maxPosX = px;
            if (py > maxPosY) maxPosY = py;
            if (pz > maxPosZ) maxPosZ = pz;
          }
          if (hasPositions) {
            let fX = pxArr[0];
            let fY = pyArr[0];
            let fZ = pzArr[0];
            if (fromArr) {
              fX = minPosX + from[0] * (maxPosX - minPosX);
              fY = minPosY + from[1] * (maxPosY - minPosY);
              fZ = has3D ? minPosZ + (from.length >= 3 ? from[2] : 0.5) * (maxPosZ - minPosZ) : 0;
            } else if (fromCenter) {
              fX = (minPosX + maxPosX) / 2;
              fY = (minPosY + maxPosY) / 2;
              fZ = (minPosZ + maxPosZ) / 2;
            } else if (fromLast) {
              fX = pxArr[total - 1];
              fY = pyArr[total - 1];
              fZ = pzArr[total - 1];
            } else if (isNum(from)) {
              fX = pxArr[from];
              fY = pyArr[from];
              fZ = pzArr[from];
            }
            for (let index = 0; index < total; index++) {
              const distanceX = fX - pxArr[index];
              const distanceY = fY - pyArr[index];
              const distanceZ = fZ - pzArr[index];
              let value = sqrt(distanceX * distanceX + distanceY * distanceY + (has3D ? distanceZ * distanceZ : 0));
              if (axis === "x") value = -distanceX;
              if (axis === "y") value = -distanceY;
              if (axis === "z") value = -distanceZ;
              values.push(value);
            }
            let minDist = Infinity;
            for (let index = 0; index < total; index++) {
              const absVal = abs(values[index]);
              if (absVal > 0 && absVal < minDist) minDist = absVal;
            }
            if (minDist > 0 && minDist < Infinity) {
              for (let index = 0; index < total; index++) {
                values[index] = values[index] / minDist;
              }
            }
          } else {
            for (let index = 0; index < total; index++) {
              values.push(abs(fromIndex - index));
            }
          }
        } else {
          for (let index = 0; index < total; index++) {
            if (!grid) {
              values.push(abs(fromIndex - index));
            } else {
              const dims = grid.length;
              const wh = grid[0] * grid[1];
              let fromX, fromY, fromZ;
              if (fromArr) {
                fromX = from[0] * (grid[0] - 1);
                fromY = from[1] * (grid[1] - 1);
                fromZ = dims === 3 ? (from.length >= 3 ? from[2] : 0.5) * (grid[2] - 1) : 0;
              } else if (fromCenter) {
                fromX = (grid[0] - 1) / 2;
                fromY = (grid[1] - 1) / 2;
                fromZ = dims === 3 ? (grid[2] - 1) / 2 : 0;
              } else {
                fromX = fromIndex % grid[0];
                fromY = floor(fromIndex / grid[0]) % grid[1];
                fromZ = dims === 3 ? floor(fromIndex / wh) : 0;
              }
              const toX = index % grid[0];
              const toY = floor(index / grid[0]) % grid[1];
              const toZ = dims === 3 ? floor(index / wh) : 0;
              const distanceX = fromX - toX;
              const distanceY = fromY - toY;
              const distanceZ = fromZ - toZ;
              let value = sqrt(distanceX * distanceX + distanceY * distanceY + (dims === 3 ? distanceZ * distanceZ : 0));
              if (axis === "x") value = -distanceX;
              if (axis === "y") value = -distanceY;
              if (axis === "z") value = -distanceZ;
              values.push(value);
            }
          }
        }
        maxValue2 = values[0];
        for (let k = 1; k < total; k++) if (values[k] > maxValue2) maxValue2 = values[k];
        if (staggerEase || reversed) {
          for (let k = 0; k < total; k++) {
            let v = values[k];
            if (staggerEase) v = staggerEase(v / maxValue2) * maxValue2;
            if (reversed) v = axis ? -v : abs(maxValue2 - v);
            values[k] = v;
          }
        }
        if (hasJitter) {
          jitterSamples = new Array(total);
          for (let k = 0; k < total; k++) jitterSamples[k] = rng(-1, 1, 4);
        }
        if (fromRandom) values = shuffle(values, rng);
      }
      const spacing = isRange ? (val2 - val1) / maxValue2 : val1;
      if (isUnd(cachedOffset)) {
        cachedOffset = tl ? parseTimelinePosition(tl, isUnd(params.start) ? tl.iterationDuration : start) : (
          /** @type {Number} */
          start
        );
      }
      let output = cachedOffset + (spacing * round(values[staggerIndex], 2) || 0);
      if (hasJitter) {
        const progress = maxValue2 ? values[staggerIndex] / maxValue2 : 0;
        const mag = jitterStart + (jitterEnd - jitterStart) * progress;
        output = /** @type {Number} */
        output + jitterSamples[staggerIndex] * mag;
      }
      if (params.modifier) output = params.modifier(
        /** @type {Number} */
        output
      );
      if (unitMatch) output = `${output}${unitMatch[2]}`;
      return output;
    };
  };

  // node_modules/animejs/dist/modules/text/split.js
  var segmenter = typeof Intl !== "undefined" && Intl.Segmenter;
  var valueRgx = /\{value\}/g;
  var indexRgx = /\{i\}/g;
  var whiteSpaceGroupRgx = /(\s+)/;
  var whiteSpaceRgx = /^\s+$/;
  var lineType = "line";
  var wordType = "word";
  var charType = "char";
  var dataLine = `data-line`;
  var wordSegmenter = null;
  var graphemeSegmenter = null;
  var $splitTemplate = null;
  var isSegmentWordLike = (seg) => {
    return seg.isWordLike || seg.segment === " " || // Consider spaces as words first, then handle them diffrently later
    isNum(+seg.segment);
  };
  var setAriaHidden = ($el) => $el.setAttribute("aria-hidden", "true");
  var getAllTopLevelElements = ($el, type) => [.../** @type {*} */
  $el.querySelectorAll(`[data-${type}]:not([data-${type}] [data-${type}])`)];
  var debugColors = { line: "#00D672", word: "#FF4B4B", char: "#5A87FF" };
  var filterEmptyElements = ($el) => {
    if (!$el.childElementCount && !$el.textContent.trim()) {
      const $parent = $el.parentElement;
      $el.remove();
      if ($parent) filterEmptyElements($parent);
    }
  };
  var filterLineElements = ($el, lineIndex, bin) => {
    const dataLineAttr = $el.getAttribute(dataLine);
    if (dataLineAttr !== null && +dataLineAttr !== lineIndex || $el.tagName === "BR") {
      bin.add($el);
      const prev = $el.previousSibling;
      const next = $el.nextSibling;
      if (prev && prev.nodeType === 3 && whiteSpaceRgx.test(prev.textContent)) {
        bin.add(prev);
      }
      if (next && next.nodeType === 3 && whiteSpaceRgx.test(next.textContent)) {
        bin.add(next);
      }
    }
    let i = $el.childElementCount;
    while (i--) filterLineElements(
      /** @type {HTMLElement} */
      $el.children[i],
      lineIndex,
      bin
    );
    return bin;
  };
  var generateTemplate = (type, params = {}) => {
    let template = ``;
    if (!params) params = {};
    const classString = isStr(params.class) ? ` class="${params.class}"` : "";
    const cloneType = setValue(params.clone, false);
    const wrapType = setValue(params.wrap, false);
    const overflow = wrapType ? wrapType === true ? "clip" : wrapType : cloneType ? "clip" : false;
    if (wrapType) template += `<span${overflow ? ` style="overflow:${overflow};"` : ""}>`;
    template += `<span${classString}${cloneType ? ` style="position:relative;"` : ""} data-${type}="{i}">`;
    if (cloneType) {
      const left = cloneType === "left" ? "-100%" : cloneType === "right" ? "100%" : "0";
      const top = cloneType === "top" ? "-100%" : cloneType === "bottom" ? "100%" : "0";
      template += `<span>{value}</span>`;
      template += `<span inert style="position:absolute;top:${top};left:${left};white-space:nowrap;">{value}</span>`;
    } else {
      template += `{value}`;
    }
    template += `</span>`;
    if (wrapType) template += `</span>`;
    return template;
  };
  var processHTMLTemplate = (htmlTemplate, store, node, $parentFragment, type, debug, lineIndex, wordIndex, charIndex) => {
    const isLine = type === lineType;
    const isChar = type === charType;
    const className = `_${type}_`;
    const template = isFnc(htmlTemplate) ? htmlTemplate(node) : htmlTemplate;
    const displayStyle = isLine ? "block" : "inline-block";
    $splitTemplate.innerHTML = template.replace(valueRgx, `<i class="${className}"></i>`).replace(indexRgx, `${isChar ? charIndex : isLine ? lineIndex : wordIndex}`);
    const $content = $splitTemplate.content;
    const $highestParent = (
      /** @type {HTMLElement} */
      $content.firstElementChild
    );
    const $split = (
      /** @type {HTMLElement} */
      $content.querySelector(`[data-${type}]`) || $highestParent
    );
    const $replacables = (
      /** @type {NodeListOf<HTMLElement>} */
      $content.querySelectorAll(`i.${className}`)
    );
    const replacablesLength = $replacables.length;
    if (replacablesLength) {
      $highestParent.style.display = displayStyle;
      $split.style.display = displayStyle;
      $split.setAttribute(dataLine, `${lineIndex}`);
      if (!isLine) {
        $split.setAttribute("data-word", `${wordIndex}`);
        if (isChar) $split.setAttribute("data-char", `${charIndex}`);
      }
      let i = replacablesLength;
      while (i--) {
        const $replace = $replacables[i];
        const $closestParent = $replace.parentElement;
        $closestParent.style.display = displayStyle;
        if (isLine) {
          $closestParent.innerHTML = /** @type {HTMLElement} */
          node.innerHTML;
        } else {
          $closestParent.replaceChild(node.cloneNode(true), $replace);
        }
      }
      store.push($split);
      $parentFragment.appendChild($content);
    } else {
      console.warn(`The expression "{value}" is missing from the provided template.`);
    }
    if (debug) $highestParent.style.outline = `1px dotted ${debugColors[type]}`;
    return $highestParent;
  };
  var TextSplitter = class {
    /**
     * @param  {Element|NodeList|String|Array<Element>} target
     * @param  {TextSplitterParams} [parameters]
     */
    constructor(target, parameters = {}) {
      if (!wordSegmenter) wordSegmenter = segmenter ? new segmenter([], { granularity: wordType }) : {
        segment: (text) => {
          const segments = [];
          const words2 = text.split(whiteSpaceGroupRgx);
          for (let i = 0, l = words2.length; i < l; i++) {
            const segment = words2[i];
            segments.push({
              segment,
              isWordLike: !whiteSpaceRgx.test(segment)
              // Consider non-whitespace as word-like
            });
          }
          return segments;
        }
      };
      if (!graphemeSegmenter) graphemeSegmenter = segmenter ? new segmenter([], { granularity: "grapheme" }) : {
        segment: (text) => [...text].map((char) => ({ segment: char }))
      };
      if (!$splitTemplate && isBrowser) $splitTemplate = doc.createElement("template");
      if (scope.current) scope.current.register(this);
      const { words, chars, lines, accessible, includeSpaces, debug } = parameters;
      const $target = (
        /** @type {HTMLElement} */
        (target = isArr(target) ? target[0] : target) && /** @type {Node} */
        target.nodeType ? target : (getNodeList(target) || [])[0]
      );
      const lineParams = lines === true ? {} : lines;
      const wordParams = words === true || isUnd(words) ? {} : words;
      const charParams = chars === true ? {} : chars;
      this.debug = setValue(debug, false);
      this.includeSpaces = setValue(includeSpaces, false);
      this.accessible = setValue(accessible, true);
      this.linesOnly = lineParams && (!wordParams && !charParams);
      this.lineTemplate = isObj(lineParams) ? generateTemplate(
        lineType,
        /** @type {SplitTemplateParams} */
        lineParams
      ) : lineParams;
      this.wordTemplate = isObj(wordParams) || this.linesOnly ? generateTemplate(
        wordType,
        /** @type {SplitTemplateParams} */
        wordParams
      ) : wordParams;
      this.charTemplate = isObj(charParams) ? generateTemplate(
        charType,
        /** @type {SplitTemplateParams} */
        charParams
      ) : charParams;
      this.$target = $target;
      this.html = $target && $target.innerHTML;
      this.lines = [];
      this.words = [];
      this.chars = [];
      this.effects = [];
      this.effectsCleanups = [];
      this.cache = null;
      this.ready = false;
      this.width = 0;
      this.resizeTimeout = null;
      const handleSplit = () => this.html && (lineParams || wordParams || charParams) && this.split();
      this.resizeObserver = new ResizeObserver(() => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          const currentWidth = (
            /** @type {HTMLElement} */
            $target.offsetWidth
          );
          if (currentWidth === this.width) return;
          this.width = currentWidth;
          handleSplit();
        }, 150);
      });
      if (this.lineTemplate && !this.ready) {
        doc.fonts.ready.then(handleSplit);
      } else {
        handleSplit();
      }
      $target ? this.resizeObserver.observe($target) : console.warn("No Text Splitter target found.");
    }
    /**
     * @param  {(...args: any[]) => Tickable | (() => void) | void} effect
     * @return this
     */
    addEffect(effect) {
      if (!isFnc(effect)) {
        console.warn("Effect must return a function.");
        return this;
      }
      const refreshableEffect = keepTime(effect);
      this.effects.push(refreshableEffect);
      if (this.ready) this.effectsCleanups[this.effects.length - 1] = refreshableEffect(this);
      return this;
    }
    revert() {
      clearTimeout(this.resizeTimeout);
      this.lines.length = this.words.length = this.chars.length = 0;
      this.resizeObserver.disconnect();
      this.effectsCleanups.forEach((cleanup) => isFnc(cleanup) ? cleanup(this) : cleanup.revert && cleanup.revert());
      this.$target.innerHTML = this.html;
      return this;
    }
    /**
     * Recursively processes a node and its children
     * @param {Node} node
     */
    splitNode(node) {
      const wordTemplate = this.wordTemplate;
      const charTemplate = this.charTemplate;
      const includeSpaces = this.includeSpaces;
      const debug = this.debug;
      const nodeType = node.nodeType;
      if (nodeType === 3) {
        const nodeText = node.nodeValue;
        if (nodeText.trim()) {
          const tempWords = [];
          const words = this.words;
          const chars = this.chars;
          const wordSegments = wordSegmenter.segment(nodeText);
          const $wordsFragment = doc.createDocumentFragment();
          let prevSeg = null;
          for (const wordSegment of wordSegments) {
            const segment = wordSegment.segment;
            const isWordLike = isSegmentWordLike(wordSegment);
            if (!prevSeg || isWordLike && (prevSeg && isSegmentWordLike(prevSeg))) {
              tempWords.push(segment);
            } else {
              const lastWordIndex = tempWords.length - 1;
              const lastWord = tempWords[lastWordIndex];
              if (!whiteSpaceGroupRgx.test(lastWord) && !whiteSpaceGroupRgx.test(segment)) {
                tempWords[lastWordIndex] += segment;
              } else {
                tempWords.push(segment);
              }
            }
            prevSeg = wordSegment;
          }
          for (let i = 0, l = tempWords.length; i < l; i++) {
            const word = tempWords[i];
            if (!word.trim()) {
              if (i && includeSpaces) continue;
              $wordsFragment.appendChild(doc.createTextNode(word));
            } else {
              const nextWord = tempWords[i + 1];
              const hasWordFollowingSpace = includeSpaces && nextWord && !nextWord.trim();
              const wordToProcess = word;
              const charSegments = charTemplate ? graphemeSegmenter.segment(wordToProcess) : null;
              const $charsFragment = charTemplate ? doc.createDocumentFragment() : doc.createTextNode(hasWordFollowingSpace ? word + "\xA0" : word);
              if (charTemplate) {
                const charSegmentsArray = [...charSegments];
                for (let j = 0, jl = charSegmentsArray.length; j < jl; j++) {
                  const charSegment = charSegmentsArray[j];
                  const isLastChar = j === jl - 1;
                  const charText = isLastChar && hasWordFollowingSpace ? charSegment.segment + "\xA0" : charSegment.segment;
                  const $charNode = doc.createTextNode(charText);
                  processHTMLTemplate(
                    charTemplate,
                    chars,
                    $charNode,
                    /** @type {DocumentFragment} */
                    $charsFragment,
                    charType,
                    debug,
                    -1,
                    words.length,
                    chars.length
                  );
                }
              }
              if (wordTemplate) {
                processHTMLTemplate(wordTemplate, words, $charsFragment, $wordsFragment, wordType, debug, -1, words.length, chars.length);
              } else if (charTemplate) {
                $wordsFragment.appendChild($charsFragment);
              } else {
                $wordsFragment.appendChild(doc.createTextNode(word));
              }
              if (hasWordFollowingSpace) i++;
            }
          }
          node.parentNode.replaceChild($wordsFragment, node);
        }
      } else if (nodeType === 1) {
        const childNodes = (
          /** @type {Array<Node>} */
          [.../** @type {*} */
          node.childNodes]
        );
        for (let i = 0, l = childNodes.length; i < l; i++) this.splitNode(childNodes[i]);
      }
    }
    /**
     * @param {Boolean} clearCache
     * @return {this}
     */
    split(clearCache = false) {
      const $el = this.$target;
      const isCached = !!this.cache && !clearCache;
      const lineTemplate = this.lineTemplate;
      const wordTemplate = this.wordTemplate;
      const charTemplate = this.charTemplate;
      const fontsReady = doc.fonts.status !== "loading";
      const canSplitLines = lineTemplate && fontsReady;
      this.ready = !lineTemplate || fontsReady;
      if (canSplitLines || clearCache) {
        this.effectsCleanups.forEach((cleanup) => isFnc(cleanup) && cleanup(this));
      }
      if (!isCached) {
        if (clearCache) {
          $el.innerHTML = this.html;
          this.words.length = this.chars.length = 0;
        }
        this.splitNode($el);
        this.cache = $el.innerHTML;
      }
      if (canSplitLines) {
        if (isCached) $el.innerHTML = this.cache;
        this.lines.length = 0;
        if (wordTemplate) this.words = getAllTopLevelElements($el, wordType);
      }
      if (charTemplate && (canSplitLines || wordTemplate)) {
        this.chars = getAllTopLevelElements($el, charType);
      }
      const elementsArray = this.words.length ? this.words : this.chars;
      let y, linesCount = 0;
      for (let i = 0, l = elementsArray.length; i < l; i++) {
        const $el2 = elementsArray[i];
        const { top, height } = $el2.getBoundingClientRect();
        if (!isUnd(y) && top - y > height * 0.5) linesCount++;
        $el2.setAttribute(dataLine, `${linesCount}`);
        const nested = $el2.querySelectorAll(`[${dataLine}]`);
        let c = nested.length;
        while (c--) nested[c].setAttribute(dataLine, `${linesCount}`);
        y = top;
      }
      if (canSplitLines) {
        const linesFragment = doc.createDocumentFragment();
        const parents = /* @__PURE__ */ new Set();
        const clones = [];
        for (let lineIndex = 0; lineIndex < linesCount + 1; lineIndex++) {
          const $clone = (
            /** @type {HTMLElement} */
            $el.cloneNode(true)
          );
          filterLineElements($clone, lineIndex, /* @__PURE__ */ new Set()).forEach(($el2) => {
            const $parent = $el2.parentNode;
            if ($parent) {
              if ($el2.nodeType === 1) parents.add(
                /** @type {HTMLElement} */
                $parent
              );
              $parent.removeChild($el2);
            }
          });
          clones.push($clone);
        }
        parents.forEach(filterEmptyElements);
        for (let cloneIndex = 0, clonesLength = clones.length; cloneIndex < clonesLength; cloneIndex++) {
          processHTMLTemplate(lineTemplate, this.lines, clones[cloneIndex], linesFragment, lineType, this.debug, cloneIndex);
        }
        $el.innerHTML = "";
        $el.appendChild(linesFragment);
        if (wordTemplate) this.words = getAllTopLevelElements($el, wordType);
        if (charTemplate) this.chars = getAllTopLevelElements($el, charType);
      }
      if (this.linesOnly) {
        const words = this.words;
        let w = words.length;
        while (w--) {
          const $word = words[w];
          $word.replaceWith($word.textContent);
        }
        words.length = 0;
      }
      if (this.accessible && (canSplitLines || !isCached)) {
        const $accessible = doc.createElement("span");
        $accessible.style.cssText = `position:absolute;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);width:1px;height:1px;white-space:nowrap;`;
        $accessible.innerHTML = this.html;
        $el.insertBefore($accessible, $el.firstChild);
        this.lines.forEach(setAriaHidden);
        this.words.forEach(setAriaHidden);
        this.chars.forEach(setAriaHidden);
      }
      this.width = /** @type {HTMLElement} */
      $el.offsetWidth;
      if (canSplitLines || clearCache) {
        this.effects.forEach((effect, i) => this.effectsCleanups[i] = effect(this));
      }
      return this;
    }
    refresh() {
      this.split(true);
    }
  };
  var splitText = (target, parameters) => new TextSplitter(target, parameters);

  // node_modules/animejs/dist/modules/text/scramble.js
  var expandCharRanges = (str) => {
    let result = "";
    for (let i = 0, l = str.length; i < l; i++) {
      if (i + 2 < l && str[i + 1] === "-" && str.charCodeAt(i) < str.charCodeAt(i + 2)) {
        const start = str.charCodeAt(i);
        const end = str.charCodeAt(i + 2);
        for (let c = start; c <= end; c++) result += String.fromCharCode(c);
        i += 2;
      } else {
        result += str[i];
      }
    }
    return result;
  };
  var charSets = {
    lowercase: "a-z",
    uppercase: "A-Z",
    numbers: "0-9",
    symbols: "!%#_|*+=",
    braille: "\u2800-\u28FF",
    blocks: "\u2580-\u259F",
    shades: "\u2591-\u2593"
  };
  var originalTexts = /* @__PURE__ */ new WeakMap();
  var scrambleText = (params = {}) => {
    if (!params) params = {};
    const charsParam = params.chars;
    const easeFn = parseEase(params.ease || "linear");
    const text = params.text;
    const fromParam = params.from;
    const reversed = params.reversed || false;
    const perturbation = params.perturbation || 0;
    const cursorParam = params.cursor;
    const cursorChars = cursorParam === true ? "_" : typeof cursorParam === "number" ? String.fromCharCode(cursorParam) : typeof cursorParam === "string" ? cursorParam : "";
    const cursorLen = cursorChars.length;
    const seed = params.seed || 0;
    const override = params.override !== void 0 ? params.override : true;
    const revealRate = params.revealRate || 60;
    const interval = 1e3 * globals.timeScale / revealRate;
    const settleDuration = params.settleDuration || 300 * globals.timeScale;
    const settleRate = params.settleRate || 30;
    const durationParam = params.duration;
    const revealDelayParam = params.revealDelay;
    const delayParam = params.delay;
    const onChange = params.onChange || noop;
    return (target, index, targets, prevTween) => {
      const rawChars = typeof charsParam === "function" ? charsParam(target, index, targets) : charsParam || "a-zA-Z0-9!%#_";
      const characters = expandCharRanges(charSets[rawChars] || rawChars);
      const totalChars = characters.length - 1;
      const duration = typeof durationParam === "function" ? durationParam(target, index, targets) : durationParam;
      const revealDelay = typeof revealDelayParam === "function" ? revealDelayParam(target, index, targets) : revealDelayParam || 0;
      const delay = typeof delayParam === "function" ? delayParam(target, index, targets) : delayParam || 0;
      const rng = seed ? createSeededRandom(seed) : createSeededRandom();
      if (!originalTexts.has(target)) originalTexts.set(target, target.textContent);
      const startingText = prevTween ? prevTween._value : target.textContent;
      const targetText = text !== void 0 ? typeof text === "function" ? text(target, index, targets) : text : prevTween ? prevTween._value : originalTexts.get(target);
      const settledText = targetText === " " || targetText === "&nbsp;" ? "\xA0" : targetText;
      const startLength = startingText === "\xA0" ? 0 : startingText.length;
      const endLength = settledText.length;
      const overrideChars = override === true ? characters : typeof override === "string" && override.length > 0 ? expandCharRanges(charSets[
        /** @type {String} */
        override
      ] || /** @type {String} */
      override) : null;
      const totalOverrideChars = overrideChars ? overrideChars.length - 1 : 0;
      const overrideChar = override === " " ? "\xA0" : null;
      const animLength = override === "" ? endLength : Math.max(startLength, endLength);
      const animDuration = duration > 0 ? duration : (animLength - 1) * interval + settleDuration;
      const computedDuration = round((animDuration + revealDelay) / globals.timeScale, 0) * globals.timeScale;
      const revealDelayRatio = revealDelay > 0 ? round(revealDelay / computedDuration, 12) : 0;
      const resolvedFrom = fromParam === void 0 || fromParam === "auto" ? endLength < startLength ? "right" : "left" : fromParam;
      const charOrder = new Int32Array(animLength);
      if (resolvedFrom === "random") {
        for (let i = 0; i < animLength; i++) charOrder[i] = i;
        for (let i = animLength - 1; i > 0; i--) {
          const j = rng(0, i);
          const t = charOrder[i];
          charOrder[i] = charOrder[j];
          charOrder[j] = t;
        }
      } else {
        const ref = resolvedFrom === "right" ? (override === "" || !startLength ? animLength : startLength) - 1 : resolvedFrom === "center" ? ((override === "" || !startLength ? animLength : startLength) - 1) / 2 : typeof resolvedFrom === "number" ? resolvedFrom : 0;
        const abs2 = Math.abs;
        const indices = new Array(animLength);
        for (let i = 0; i < animLength; i++) indices[i] = i;
        indices.sort((a, b) => abs2(a - ref) - abs2(b - ref));
        for (let i = 0; i < animLength; i++) charOrder[indices[i]] = i;
      }
      if (reversed) {
        const last = animLength - 1;
        for (let i = 0; i < animLength; i++) charOrder[i] = last - charOrder[i];
      }
      const settleRatio = round(settleDuration / animDuration, 12);
      const settleSpacing = round((1 - settleRatio) / animLength, 12);
      const cursorZone = cursorLen * settleSpacing;
      const stepRatio = round(1e3 * globals.timeScale / (settleRate * computedDuration), 12);
      const charStarts = new Float32Array(animLength);
      const charEnds = new Float32Array(animLength);
      const scale = perturbation > 0 ? perturbation * settleRatio : 0;
      for (let c = 0; c < animLength; c++) {
        const so = scale > 0 ? (rng(0, 2e3) - 1e3) / 1e3 * scale : 0;
        const eo = scale > 0 ? (rng(0, 2e3) - 1e3) / 1e3 * scale : 0;
        charStarts[c] = charOrder[c] * settleSpacing + so;
        charEnds[c] = Math.ceil((charStarts[c] + settleRatio + eo) / stepRatio) * stepRatio;
      }
      if (endLength < animLength && resolvedFrom !== "left" && resolvedFrom !== "right" && resolvedFrom !== "random") {
        let maxExtraEnd = 0;
        for (let c = endLength; c < animLength; c++) {
          if (charEnds[c] > maxExtraEnd) maxExtraEnd = charEnds[c];
        }
        const targets2 = new Array(endLength);
        for (let c = 0; c < endLength; c++) targets2[c] = c;
        targets2.sort((a, b) => charOrder[a] - charOrder[b]);
        const targetSpacing = (1 - maxExtraEnd) / endLength;
        for (let i = 0; i < endLength; i++) {
          const revealTime = maxExtraEnd + i * targetSpacing;
          if (revealTime > charEnds[targets2[i]]) {
            charEnds[targets2[i]] = revealTime;
          }
        }
      }
      const charCache = new Array(animLength);
      for (let c = 0; c < animLength; c++) {
        charCache[c] = characters[rng(0, totalChars)];
      }
      const overrideCache = overrideChars ? overrideChars === characters ? charCache : new Array(animLength) : null;
      if (overrideCache && overrideCache !== charCache) {
        for (let c = 0; c < animLength; c++) {
          overrideCache[c] = overrideChar || /** @type {String} */
          overrideChars[rng(0, overrideChars.length - 1)];
        }
      }
      let fillStartText = startingText;
      if (!prevTween) {
        if (override === "") {
          fillStartText = "";
        } else if (overrideChars) {
          fillStartText = "";
          for (let c = 0; c < startLength; c++) {
            fillStartText += startingText[c] === " " ? " " : (
              /** @type {Array<String>} */
              overrideCache[c]
            );
          }
        }
      }
      let lastValue = -1;
      let lastStep = -1;
      let scrambled = "";
      const hasOverride = override !== "";
      const hasOverrideChars = !!overrideChars;
      const hasCursor = cursorLen > 0;
      return {
        from: 0,
        to: 1,
        duration: computedDuration,
        delay,
        ease: "linear",
        modifier: (v) => {
          if (v === lastValue) return scrambled;
          lastValue = v;
          if (delay > 0 && v <= 0) {
            scrambled = startingText;
            return startingText;
          }
          if (v <= 0) {
            scrambled = fillStartText;
            return fillStartText;
          }
          if (v >= 1) {
            scrambled = settledText;
            return settledText;
          }
          scrambled = "";
          const currentStep = v / stepRatio | 0;
          const refreshChars = currentStep !== lastStep;
          if (refreshChars) lastStep = currentStep;
          const linear = revealDelayRatio > 0 ? (v - revealDelayRatio) / (1 - revealDelayRatio) : v;
          const t = linear > 0 ? easeFn(linear) : 0;
          for (let c = 0; c < animLength; c++) {
            const charStart = charStarts[c];
            const charEnd = charEnds[c];
            if (t >= charEnd) {
              if (c < endLength) scrambled += settledText[c];
              continue;
            }
            if (t <= 0 || t < charStart) {
              if (hasOverride && c < startLength) {
                if (hasOverrideChars) {
                  if (startingText[c] === " ") {
                    scrambled += " ";
                  } else {
                    if (refreshChars) overrideCache[c] = overrideChar || /** @type {String} */
                    overrideChars[rng(0, totalOverrideChars)];
                    scrambled += /** @type {Array<String>} */
                    overrideCache[c];
                  }
                } else {
                  scrambled += startingText[c];
                }
              }
              continue;
            }
            const isSpace = c < endLength && settledText[c] === " " || c < startLength && startingText[c] === " ";
            if (isSpace) {
              scrambled += " ";
            } else if (hasCursor && t - charStart < cursorZone) {
              scrambled += cursorChars[cursorLen - 1 - ((t - charStart) / settleSpacing | 0)];
            } else {
              if (refreshChars) charCache[c] = characters[rng(0, totalChars)];
              scrambled += charCache[c];
            }
          }
          if (refreshChars) onChange(scrambled, t);
          return scrambled;
        }
      };
    };
  };

  // assets/js/controllers/title_anime_controller.js
  var title_anime_controller_default = class extends Controller {
    // This runs when the controller connects to the DOM
    connect() {
      requestAnimationFrame(() => {
        this.animateTitle();
      });
    }
    animateTitle() {
      const elements = this.element.querySelectorAll("h1");
      if (elements.length === 0) {
        console.warn("No h1 elements found for title animation");
        return;
      }
      const { chars } = splitText(elements, { words: false, chars: true });
      animate(chars, {
        y: [
          { to: "-2.75rem", ease: "outExpo", duration: 600 },
          { to: 0, ease: "outBounce", duration: 800, delay: 100 }
        ],
        rotate: {
          from: "-1turn",
          delay: 0
        },
        delay: stagger(50),
        ease: "inOutCirc",
        loopDelay: 1e3,
        loop: false
      });
    }
  };

  // assets/js/controllers/text_anim_controller.js
  var text_anim_controller_default = class extends Controller {
    static targets = ["text"];
    originalText = "";
    connect() {
      this.originalText = this.textTarget.textContent.trim();
      setTimeout(() => {
        this.animateText();
      }, 200);
    }
    animateText() {
      const element = this.textTarget;
      animate(element, {
        innerHTML: scrambleText({
          text: this.originalText,
          duration: 1800,
          easing: "easeOutQuad"
        }),
        complete: () => {
          element.textContent = this.originalText;
        }
      });
    }
  };

  // assets/js/controllers/wrap_text_controller.js
  var wrap_text_controller_default = class extends Controller {
    static targets = ["wrapText"];
    connect() {
      setTimeout(() => {
        this.wrapText();
      }, 200);
    }
    wrapText() {
      const element = this.wrapTextTarget;
      const { chars } = splitText(element, {
        chars: { wrap: true }
      });
      animate(chars, {
        y: ["75%", "20%"],
        duration: 150,
        ease: "out(3)",
        delay: stagger(50),
        loop: false,
        alternate: true
      });
    }
  };

  // assets/js/controllers/loader_controller.js
  var loader_controller_default = class extends Controller {
    static targets = ["wrapper"];
    static values = {
      duration: { type: Number, default: 1500 }
    };
    connect() {
      this.show;
    }
    show() {
      this.wrapperTarget.classList.remove("hidden");
    }
    hide() {
      this.wrapperTarget.classList.add("fade-out");
      setTimeout(() => {
        this.wrapperTarget.style.display = "none";
      }, 100);
    }
  };

  // assets/js/controllers/index.js
  var application = Application.start();
  application.debug = false;
  window.Stimulus = application;
  application.register("title-anime", title_anime_controller_default);
  application.register("text-anim", text_anim_controller_default);
  application.register("wrap-text", wrap_text_controller_default);
  application.register("loader", loader_controller_default);
})();
/*! Bundled license information:

animejs/dist/modules/core/consts.js:
animejs/dist/modules/core/globals.js:
animejs/dist/modules/core/helpers.js:
animejs/dist/modules/core/transforms.js:
animejs/dist/modules/core/colors.js:
animejs/dist/modules/core/values.js:
animejs/dist/modules/core/render.js:
animejs/dist/modules/core/styles.js:
animejs/dist/modules/core/clock.js:
animejs/dist/modules/core/targets.js:
animejs/dist/modules/core/units.js:
  (**
   * Anime.js - core - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/adapters/registry.js:
  (**
   * Anime.js - adapters - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/animation/additive.js:
animejs/dist/modules/animation/composition.js:
animejs/dist/modules/animation/animation.js:
  (**
   * Anime.js - animation - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/engine/engine.js:
  (**
   * Anime.js - engine - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/timer/timer.js:
  (**
   * Anime.js - timer - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/easings/none.js:
animejs/dist/modules/easings/eases/parser.js:
  (**
   * Anime.js - easings - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/timeline/position.js:
  (**
   * Anime.js - timeline - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/utils/time.js:
animejs/dist/modules/utils/random.js:
animejs/dist/modules/utils/stagger.js:
  (**
   * Anime.js - utils - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/text/split.js:
animejs/dist/modules/text/scramble.js:
  (**
   * Anime.js - text - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/index.js:
  (**
   * Anime.js - ESM
   * @version v4.5.0
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)
*/
