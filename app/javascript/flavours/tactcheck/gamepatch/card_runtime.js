const parsePayload = (payload) => {
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};

const setCssVariables = (el, tokens, prefix) => {
  Object.entries(tokens || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}-${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      setCssVariables(el, value, path);
    } else {
      el.style.setProperty(`--gp-${path}`, String(value));
    }
  });
};

const columnWidth = (width) => {
  if (typeof width === 'number') {
    return `${width} 1 0%`;
  }
  if (typeof width === 'string') {
    if (width === 'auto') return '0 0 auto';
    if (width === 'stretch') return '1 1 0%';
  }
  return '1 1 0%';
};

const normalizeTargets = (targets) => {
  if (!targets) return [];
  if (Array.isArray(targets)) {
    return targets
      .map((target) => {
        if (typeof target === 'string') return { id: target };
        if (target && typeof target === 'object') {
          return { id: target.elementId || target.id, isVisible: target.isVisible };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof targets === 'string') return [{ id: targets }];
  if (targets && typeof targets === 'object') {
    return [{ id: targets.elementId || targets.id, isVisible: targets.isVisible }];
  }
  return [];
};

const escapeSelector = (value) => {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(String(value));
  }
  return String(value).replace(/["\\]/g, '\\$&');
};

class GamepatchCardElement extends HTMLElement {
  connectedCallback() {
    this.uid = this.dataset.uid;
    this.api = this.dataset.api;
    this.botId = this.dataset.botId;
    this.botName = this.dataset.botName;
    this.cardInstanceId = this.dataset.cardInstanceId || null;
    this.data = {};
    this.context = {};
    this.state = {};

    const payload = parsePayload(this.dataset.payload);
    if (payload) {
      this.applyPayload(payload);
      return;
    }

    this.render();
  }

  async render() {
    if (!this.api) return;
    try {
      const url = new URL(this.api, window.location.origin);
      if (this.botId) url.searchParams.set('bot_id', this.botId);
      if (this.botName) url.searchParams.set('bot_name', this.botName);

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });
      const payload = await res.json();
      this.applyPayload(payload);
    } catch (error) {
      console.error('Card render failed:', error);
      this.renderError('Unable to load card.');
    }
  }

  applyPayload(payload) {
    if (!payload || typeof payload !== 'object') return;

    if (payload.uid) {
      this.uid = payload.uid;
      this.dataset.uid = payload.uid;
    }

    if (payload.card_instance_id) {
      this.cardInstanceId = String(payload.card_instance_id);
      this.dataset.cardInstanceId = String(payload.card_instance_id);
    }

    this.data = payload.data || {};
    this.context = payload.context || {};
    this.state = payload.state || {};
    this.applyTheme(payload.host_config || {});

    if (payload.definition) {
      this.renderFromDefinition(payload.definition || {});
      return;
    }

    if (payload.fallback_text) {
      this.renderFallback(payload.fallback_text);
    }
  }

  applyTheme(hostConfig) {
    setCssVariables(this, hostConfig, null);
  }

  renderFallback(text) {
    this.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'gp-card';
    const content = document.createElement('div');
    content.className = 'gp-card-text';
    content.textContent = text;
    container.appendChild(content);
    this.appendChild(container);
  }

  renderFromDefinition(definition) {
    this.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'gp-card';

    const body = Array.isArray(definition.body) ? definition.body : [];
    body.forEach((element) => {
      const el = this.renderElement(element);
      if (el) container.appendChild(el);
    });

    const actions = Array.isArray(definition.actions) ? definition.actions : [];
    if (actions.length > 0) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'gp-card-actions';
      actions.forEach((action) => {
        const btn = document.createElement('button');
        btn.className = 'gp-card-btn';
        btn.textContent = this.applyTemplate(action.title || action.id || 'Action');
        btn.dataset.actionId = action.id || '';
        btn.dataset.actionType = action.type || '';
        if (action.url) btn.dataset.actionUrl = this.applyTemplate(action.url);
        if (action.data) btn.dataset.actionData = JSON.stringify(action.data);
        btn.addEventListener('click', () => this.handleAction(action));
        actionsEl.appendChild(btn);
      });
      container.appendChild(actionsEl);
    }

    this.appendChild(container);
  }

  renderError(message) {
    this.innerHTML = `<div class="gp-card-error">${message}</div>`;
  }

  renderElement(element) {
    if (!element || typeof element !== 'object') return null;
    const type = element.type || '';

    if (!this.isElementVisible(element)) return null;

    const elementId = element.id || '';

    if (type === 'Text') {
      const el = document.createElement('div');
      el.className = 'gp-card-text';
      el.textContent = this.applyTemplate(element.text || '');
      if (elementId) el.dataset.elementId = elementId;
      return el;
    }

    if (type === 'Image') {
      const el = document.createElement('img');
      el.className = 'gp-card-image';
      el.src = this.applyTemplate(element.url || '');
      el.alt = this.applyTemplate(element.alt || '');
      if (elementId) el.dataset.elementId = elementId;
      return el;
    }

    if (type === 'Container') {
      const el = document.createElement('div');
      el.className = 'gp-card-container';
      if (elementId) el.dataset.elementId = elementId;
      const items = Array.isArray(element.items) ? element.items : [];
      items.forEach((child) => {
        const childEl = this.renderElement(child);
        if (childEl) el.appendChild(childEl);
      });
      return el;
    }

    if (type === 'ColumnSet') {
      const el = document.createElement('div');
      el.className = 'gp-card-columns';
      if (elementId) el.dataset.elementId = elementId;
      const columns = Array.isArray(element.columns) ? element.columns : [];
      columns.forEach((column) => {
        const columnEl = this.renderElement(column);
        if (columnEl) el.appendChild(columnEl);
      });
      return el;
    }

    if (type === 'Column') {
      const el = document.createElement('div');
      el.className = 'gp-card-column';
      if (elementId) el.dataset.elementId = elementId;
      const width = columnWidth(element.width);
      if (width) el.style.flex = width;
      const items = Array.isArray(element.items) ? element.items : [];
      items.forEach((child) => {
        const childEl = this.renderElement(child);
        if (childEl) el.appendChild(childEl);
      });
      return el;
    }

    if (type === 'Input.Text') {
      const input = document.createElement('input');
      input.className = 'gp-card-input';
      input.type = 'text';
      input.placeholder = this.applyTemplate(element.placeholder || '');
      input.dataset.inputId = element.id || '';
      if (elementId) input.dataset.elementId = elementId;
      return input;
    }

    if (type === 'Input.Date') {
      const input = document.createElement('input');
      input.className = 'gp-card-input';
      input.type = 'date';
      input.dataset.inputId = element.id || '';
      if (elementId) input.dataset.elementId = elementId;
      return input;
    }

    if (type === 'Input.Number') {
      const input = document.createElement('input');
      input.className = 'gp-card-input';
      input.type = 'number';
      if (element.min !== undefined) input.min = element.min;
      if (element.max !== undefined) input.max = element.max;
      input.dataset.inputId = element.id || '';
      if (elementId) input.dataset.elementId = elementId;
      return input;
    }

    if (type === 'Input.ChoiceSet') {
      const select = document.createElement('select');
      select.className = 'gp-card-input';
      select.dataset.inputId = element.id || '';
      if (elementId) select.dataset.elementId = elementId;
      const options = Array.isArray(element.choices) ? element.choices : [];
      options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt.value || opt.title || '';
        option.textContent = this.applyTemplate(opt.title || opt.value || '');
        select.appendChild(option);
      });
      return select;
    }

    return null;
  }

  async ensureInstance() {
    if (this.cardInstanceId) return this.cardInstanceId;
    if (!this.api) return null;

    const url = new URL(`${this.api}/instances`, window.location.origin);
    if (this.botId) url.searchParams.set('bot_id', this.botId);
    if (this.botName) url.searchParams.set('bot_name', this.botName);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    this.cardInstanceId = data.card_instance_id;
    return this.cardInstanceId;
  }

  collectInputs() {
    const inputs = {};
    this.querySelectorAll('[data-input-id]').forEach((input) => {
      const id = input.dataset.inputId;
      if (!id) return;
      inputs[id] = input.value;
    });
    return inputs;
  }

  async handleAction(action) {
    const didOpenUrl = action.type === 'Action.OpenUrl' && action.url;
    const didToggleVisibility =
      action.type === 'Action.ToggleVisibility' && action.targetElements;

    if (action.type === 'Action.OpenUrl' && action.url) {
      window.open(this.applyTemplate(action.url), '_blank', 'noopener');
    }

    if (action.type === 'Action.ToggleVisibility' && action.targetElements) {
      this.applyToggleVisibility(action.targetElements);
    }

    const instanceId = await this.ensureInstance();
    if (!instanceId) return;

    const payload = {
      card_id: this.uid,
      action: {
        id: action.id,
        type: action.type,
        data: action.data,
      },
      inputs: this.collectInputs(),
      context: {},
    };

    const res = await fetch(`${this.api}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_payload: payload, card_instance_id: instanceId }),
    });

    let result = null;
    try {
      result = await res.json();
    } catch (error) {
      result = null;
    }

    if (!res.ok || !result || result.error) {
      const message = result && result.error ? result.error : 'Response failed.';
      this.renderError(message);
      return;
    }

    if (result.open_url && !didOpenUrl) {
      window.open(this.applyTemplate(result.open_url), '_blank', 'noopener');
    }

    if (result.toggle_visibility && !didToggleVisibility) {
      this.applyToggleVisibility(result.toggle_visibility);
    }

    if (result.next_card) {
      const next = result.next_card;
      if (next.uid) {
        this.uid = next.uid;
        this.dataset.uid = next.uid;
      }
      if (next.host_config) {
        this.applyTheme(next.host_config);
      }
      this.data = next.data || this.data;
      this.context = next.context || this.context;
      this.state = next.state || this.state;
      this.renderFromDefinition(next.definition || next);
      return;
    }

    if (result.show_card) {
      const show = result.show_card;
      if (show.host_config) {
        this.applyTheme(show.host_config);
      }
      this.data = show.data || this.data;
      this.context = show.context || this.context;
      this.state = show.state || this.state;
      this.renderFromDefinition(show.definition || show);
      return;
    }

    if (result.execute) {
      this.dispatchEvent(
        new CustomEvent('gamepatch:card:execute', { detail: result, bubbles: true }),
      );
    }

    this.innerHTML = '<div class="gp-card-thanks">Response saved!</div>';
  }

  applyTemplate(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/{{\s*([^}]+)\s*}}/g, (_match, expr) => {
      const resolved = this.resolveValue(expr.trim());
      return resolved === undefined || resolved === null ? '' : String(resolved);
    });
  }

  resolveValue(expr) {
    if (expr.startsWith('input.')) {
      return this.getInputValue(expr.slice(6));
    }
    if (expr.startsWith('data.')) {
      return this.data[expr.slice(5)];
    }
    if (expr.startsWith('context.')) {
      return this.context[expr.slice(8)];
    }
    if (expr.startsWith('state.')) {
      return this.state[expr.slice(6)];
    }
    if (Object.prototype.hasOwnProperty.call(this.data, expr)) return this.data[expr];
    if (Object.prototype.hasOwnProperty.call(this.context, expr)) return this.context[expr];
    if (Object.prototype.hasOwnProperty.call(this.state, expr)) return this.state[expr];
    const inputValue = this.getInputValue(expr);
    return inputValue !== undefined ? inputValue : undefined;
  }

  isElementVisible(element) {
    if (element.isVisible === false) return false;
    if (!element.when) return true;
    return this.evaluateCondition(element.when);
  }

  evaluateCondition(condition) {
    if (typeof condition === 'string') {
      return Boolean(this.resolveValue(condition));
    }
    if (!condition || typeof condition !== 'object') return false;

    let value = null;
    if (condition.input) value = this.resolveValue(`input.${condition.input}`);
    if (condition.context)
      value = this.resolveValue(`context.${condition.context}`);
    if (condition.state) value = this.resolveValue(`state.${condition.state}`);
    if (condition.key) value = this.resolveValue(condition.key);

    const valueString = value === undefined || value === null ? '' : String(value);
    const present = !(
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.length === 0)
    );

    if (condition.equals !== undefined)
      return valueString === String(condition.equals);
    if (condition.in)
      return Array.isArray(condition.in) &&
        condition.in.map(String).includes(valueString);
    if (condition.present !== undefined) return present === Boolean(condition.present);
    return present;
  }

  applyToggleVisibility(targets) {
    const elements = normalizeTargets(targets);
    elements.forEach((target) => {
      const selector = `[data-element-id="${escapeSelector(target.id)}"]`;
      const el = this.querySelector(selector);
      if (!el) return;
      if (target.isVisible === undefined) {
        el.style.display = el.style.display === 'none' ? '' : 'none';
      } else {
        el.style.display = target.isVisible ? '' : 'none';
      }
    });
  }

  getInputValue(inputId) {
    if (!inputId) return undefined;
    const selector = `[data-input-id="${escapeSelector(inputId)}"]`;
    const input = this.querySelector(selector);
    if (!input) return undefined;
    if (input.type === 'checkbox') return input.checked;
    if (input.type === 'radio') {
      const checked = this.querySelector(`${selector}:checked`);
      return checked ? checked.value : undefined;
    }
    return input.value;
  }
}

export const ensureGamepatchCard = () => {
  if (typeof window === 'undefined') return;
  if (window.GamepatchCard) return;
  if (!customElements.get('gamepatch-card')) {
    customElements.define('gamepatch-card', GamepatchCardElement);
  }
  window.GamepatchCard = GamepatchCardElement;
};
