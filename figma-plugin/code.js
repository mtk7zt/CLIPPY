const C = {
  ink: "#06111E",
  ink2: "#091827",
  panel: "#14283C",
  panel2: "#203B53",
  line: "#49637D",
  text: "#F6F9FF",
  muted: "#A7B5C8",
  blue: "#3B8CFF",
  blue2: "#0A5BD7",
  green: "#52D273",
  amber: "#FFBD3D",
  red: "#FF5F57"
};

let activeFont = "Inter";

function rgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255
  };
}

function solid(hex, opacity = 1) {
  return { type: "SOLID", color: rgb(hex), opacity };
}

function frame(name, x, y, width, height, fill = null, radius = 0) {
  const node = figma.createFrame();
  node.name = name;
  node.x = x;
  node.y = y;
  node.resize(width, height);
  node.fills = fill ? [solid(fill)] : [];
  node.cornerRadius = radius;
  node.clipsContent = true;
  return node;
}

function rect(parent, name, x, y, width, height, fill, radius = 0, stroke = null) {
  const node = figma.createRectangle();
  node.name = name;
  node.x = x;
  node.y = y;
  node.resize(width, height);
  node.fills = fill ? [solid(fill)] : [];
  node.cornerRadius = radius;
  if (stroke) {
    node.strokes = [solid(stroke, 0.66)];
    node.strokeWeight = 1;
    node.strokeAlign = "INSIDE";
  }
  parent.appendChild(node);
  return node;
}

async function label(parent, name, value, x, y, size, color = C.text, weight = "Regular", width = null, align = "LEFT") {
  const node = figma.createText();
  node.name = name;
  node.fontName = { family: activeFont, style: weight };
  node.characters = value;
  node.fontSize = size;
  node.fills = [solid(color)];
  node.x = x;
  node.y = y;
  node.textAlignHorizontal = align;
  node.lineHeight = { unit: "PERCENT", value: 125 };
  if (width) {
    node.textAutoResize = "HEIGHT";
    node.resize(width, node.height);
  } else {
    node.textAutoResize = "WIDTH_AND_HEIGHT";
  }
  parent.appendChild(node);
  return node;
}

function glass(parent, name, x, y, width, height, radius = 20) {
  // Glass surfaces contain editable content, so they must be frames rather than rectangles.
  const node = frame(name, x, y, width, height, C.panel, Math.max(radius, 20));
  node.strokes = [solid(C.line, 0.66)];
  node.strokeWeight = 1;
  node.strokeAlign = "INSIDE";
  node.fills = [
    {
      type: "GRADIENT_LINEAR",
      gradientTransform: [[0.85, 0.22, -0.04], [-0.22, 0.85, 0.18]],
      gradientStops: [
        { position: 0, color: { ...rgb("#34516A"), a: 0.82 } },
        { position: 0.45, color: { ...rgb(C.panel2), a: 0.78 } },
        { position: 1, color: { ...rgb(C.ink2), a: 0.88 } }
      ]
    }
  ];
  node.effects = [
    { type: "INNER_SHADOW", color: { r: 1, g: 1, b: 1, a: 0.11 }, offset: { x: 0, y: 1 }, radius: 1, spread: 0, visible: true, blendMode: "NORMAL" },
    { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.28 }, offset: { x: 0, y: 12 }, radius: 32, spread: -10, visible: true, blendMode: "NORMAL" }
  ];
  parent.appendChild(node);
  return node;
}

function assertScreenContent(screen, requiredText, minimumNodeCount) {
  const textValues = screen
    .findAll(node => node.type === "TEXT")
    .map(node => node.characters.trim());
  const missingText = requiredText.filter(value => !textValues.includes(value));
  const nodeCount = screen.findAll(() => true).length;
  if (missingText.length || nodeCount < minimumNodeCount) {
    throw new Error(
      `${screen.name} is incomplete. Missing text: ${missingText.join(", ") || "none"}; ` +
      `editable node count: ${nodeCount}/${minimumNodeCount}`
    );
  }
}

function icon(parent, name, glyph, x, y, size, color = C.blue) {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${glyph}</svg>`;
  const node = figma.createNodeFromSvg(svg);
  node.name = name;
  node.resize(size, size);
  node.x = x;
  node.y = y;
  parent.appendChild(node);
  return node;
}

const paths = {
  clip: `<path d="M8.5 12.5 14.8 6.2a3 3 0 1 1 4.2 4.2L10.2 19.2a5 5 0 0 1-7.1-7.1L12 3.2" stroke="${C.blue}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  phone: `<rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke="${C.blue}" stroke-width="1.8"/><path d="M10.5 5h3" stroke="${C.blue}" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="18.5" r=".8" fill="${C.blue}"/>`,
  laptop: `<path d="M5 5.5h14v9.5H5z" stroke="${C.blue}" stroke-width="1.8"/><path d="M3 18.5h18M8 15l-1.2 3.5M16 15l1.2 3.5" stroke="${C.blue}" stroke-width="1.8" stroke-linecap="round"/>`,
  file: `<path d="M7 2.5h7l4 4V21H7z" stroke="${C.text}" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 2.5v4h4" stroke="${C.text}" stroke-width="1.7"/>`,
  shield: `<path d="M12 2.8 19 6v5.2c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6z" stroke="${C.green}" stroke-width="1.7"/><path d="m8.7 12.2 2.1 2.1 4.5-4.7" stroke="${C.green}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`,
  clipboard: `<path d="M8 5.5H5.5V21h13V5.5H16" stroke="${C.text}" stroke-width="1.7"/><rect x="8" y="2.5" width="8" height="5" rx="1.5" stroke="${C.text}" stroke-width="1.7"/><path d="M8.5 12h7M8.5 16h5" stroke="${C.text}" stroke-width="1.5" stroke-linecap="round"/>`,
  message: `<path d="M4 5.5h16v10H9l-5 4v-14Z" stroke="${C.text}" stroke-width="1.7" stroke-linejoin="round"/><circle cx="9" cy="10.5" r="1" fill="${C.text}"/><circle cx="12" cy="10.5" r="1" fill="${C.text}"/><circle cx="15" cy="10.5" r="1" fill="${C.text}"/>`,
  info: `<circle cx="12" cy="12" r="9" stroke="${C.text}" stroke-width="1.7"/><path d="M12 10.5v6" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1" fill="${C.text}"/>`,
  gear: `<circle cx="12" cy="12" r="3.2" stroke="${C.text}" stroke-width="1.7"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/>`
};

function createToken(name, collection, type, modes, values, scopes, cssName) {
  const variable = figma.variables.createVariable(name, collection, type);
  variable.scopes = scopes;
  modes.forEach((mode, index) => variable.setValueForMode(mode.modeId, type === "COLOR" ? rgb(values[index]) : values[index]));
  variable.setVariableCodeSyntax("WEB", `var(--${cssName})`);
  variable.setVariableCodeSyntax("iOS", cssName.replace(/-/g, "."));
  return variable;
}

function applyColor(node, field, variable, fallback) {
  const paint = figma.variables.setBoundVariableForPaint(solid(fallback), "color", variable);
  node[field] = [paint];
}

function autoLayout(node, direction, gap, padding, alignment = "CENTER") {
  node.layoutMode = direction;
  node.itemSpacing = gap;
  node.paddingTop = padding.top;
  node.paddingRight = padding.right;
  node.paddingBottom = padding.bottom;
  node.paddingLeft = padding.left;
  node.primaryAxisSizingMode = "FIXED";
  node.counterAxisSizingMode = "FIXED";
  node.counterAxisAlignItems = alignment;
}

function bindLayoutTokens(node, gap, padding, radius) {
  if (gap) node.setBoundVariable("itemSpacing", gap);
  if (padding) {
    node.setBoundVariable("paddingTop", padding);
    node.setBoundVariable("paddingRight", padding);
    node.setBoundVariable("paddingBottom", padding);
    node.setBoundVariable("paddingLeft", padding);
  }
  if (radius) node.setBoundVariable("cornerRadius", radius);
}

function exposeText(component, textNode, propertyName, defaultValue) {
  if (typeof component.addComponentProperty !== "function") return null;
  const key = component.addComponentProperty(propertyName, "TEXT", defaultValue);
  textNode.componentPropertyReferences = { ...(textNode.componentPropertyReferences || {}), characters: key };
  return key;
}

function exposeVisibility(component, node, propertyName, defaultValue = true) {
  if (typeof component.addComponentProperty !== "function") return null;
  const key = component.addComponentProperty(propertyName, "BOOLEAN", defaultValue);
  node.componentPropertyReferences = { ...(node.componentPropertyReferences || {}), visible: key };
  return key;
}

function exposeInstanceSwap(component, instance, propertyName, defaultComponent) {
  if (typeof component.addComponentProperty !== "function") return null;
  const key = component.addComponentProperty(propertyName, "INSTANCE_SWAP", defaultComponent.id);
  instance.componentPropertyReferences = { ...(instance.componentPropertyReferences || {}), mainComponent: key };
  return key;
}

function buildIconComponent(componentPage) {
  const component = figma.createComponent();
  component.name = "Clippy/Icon";
  component.description = "Default 24px icon slot. Swap with iOS kit glyph components when available.";
  component.resize(24, 24);
  component.fills = [];
  const glyph = icon(component, "Glyph", paths.phone, 0, 0, 24);
  glyph.x = 0;
  glyph.y = 0;
  componentPage.appendChild(component);
  return component;
}

async function buildButtonComponent(componentPage, vars, iconMaster) {
  const component = figma.createComponent();
  component.name = "Clippy/Button";
  component.description = "44px minimum iOS action. Maps to .button-primary in the Clippy web shell.";
  component.resize(132, 44);
  autoLayout(component, "HORIZONTAL", 8, { top: 0, right: 18, bottom: 0, left: 18 });
  component.setBoundVariable("itemSpacing", vars.space8);
  component.setBoundVariable("cornerRadius", vars.radius20);
  component.primaryAxisAlignItems = "CENTER";
  component.cornerRadius = 20;
  component.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: { ...rgb(C.blue), a: 1 } },
      { position: 1, color: { ...rgb(C.blue2), a: 1 } }
    ]
  }];
  component.effects = [{ type: "INNER_SHADOW", color: { r: 1, g: 1, b: 1, a: 0.24 }, offset: { x: 0, y: 1 }, radius: 0, spread: 0, visible: true, blendMode: "NORMAL" }];
  const buttonIcon = iconMaster.createInstance();
  buttonIcon.name = "Icon";
  buttonIcon.resize(20, 20);
  component.appendChild(buttonIcon);
  exposeVisibility(component, buttonIcon, "Show Icon", false);
  exposeInstanceSwap(component, buttonIcon, "Icon", iconMaster);
  const title = await label(component, "Label", "Connect", 0, 0, 15, C.text, "Medium");
  const labelProperty = exposeText(component, title, "Label", "Connect");
  componentPage.appendChild(component);
  return { component, title, labelProperty };
}

async function buildPillComponent(componentPage, vars) {
  const component = figma.createComponent();
  component.name = "Clippy/Status Pill";
  component.description = "Positive connection status. Offline variants must use immediate red semantics.";
  component.resize(108, 28);
  autoLayout(component, "HORIZONTAL", 7, { top: 0, right: 10, bottom: 0, left: 10 });
  component.setBoundVariable("cornerRadius", vars.radius14);
  component.primaryAxisAlignItems = "CENTER";
  component.cornerRadius = 14;
  applyColor(component, "fills", vars.surface, "#123B2C");
  component.strokes = [solid("#2F7455", 0.8)];
  component.strokeWeight = 1;
  const dot = await label(component, "Dot", "●", 0, 0, 12, C.green, "Regular");
  const title = await label(component, "Label", "Connected", 0, 0, 13, C.green, "Medium");
  exposeVisibility(component, dot, "Show Dot", true);
  exposeText(component, title, "Label", "Connected");
  componentPage.appendChild(component);
  return component;
}

async function buildCardComponent(componentPage, vars) {
  const component = figma.createComponent();
  component.name = "Clippy/Card";
  component.description = "Liquid Glass content surface for dashboard groups and iOS sheets.";
  component.resize(300, 112);
  autoLayout(component, "VERTICAL", 8, { top: 16, right: 16, bottom: 16, left: 16 }, "MIN");
  bindLayoutTokens(component, vars.space8, vars.space16, vars.radius16);
  component.cornerRadius = 16;
  applyColor(component, "fills", vars.surface, C.panel);
  component.strokes = [figma.variables.setBoundVariableForPaint(solid(C.line), "color", vars.border)];
  component.strokeWeight = 1;
  const title = await label(component, "Title", "Card title", 0, 0, 16, C.text, "Semi Bold");
  const body = await label(component, "Body", "Supporting detail", 0, 0, 13, C.muted, "Regular");
  exposeText(component, title, "Title", "Card title");
  exposeText(component, body, "Body", "Supporting detail");
  componentPage.appendChild(component);
  return component;
}

async function buildTextFieldComponent(componentPage, vars) {
  const component = figma.createComponent();
  component.name = "Clippy/Text Field";
  component.description = "Manual IPv4 or host entry. Remains visible whenever discovery is unavailable.";
  component.resize(220, 44);
  autoLayout(component, "HORIZONTAL", 8, { top: 0, right: 12, bottom: 0, left: 12 });
  component.setBoundVariable("itemSpacing", vars.space8);
  component.setBoundVariable("cornerRadius", vars.radius10);
  component.cornerRadius = 10;
  applyColor(component, "fills", vars.surface, "#172536");
  component.strokes = [figma.variables.setBoundVariableForPaint(solid(C.line), "color", vars.border)];
  component.strokeWeight = 1;
  const value = await label(component, "Value", "192.168.1.42", 0, 0, 14, C.muted, "Regular");
  exposeText(component, value, "Value", "192.168.1.42");
  componentPage.appendChild(component);
  return component;
}

async function buildDeviceRowComponent(componentPage, vars, iconMaster) {
  const component = figma.createComponent();
  component.name = "Clippy/Device Row";
  component.description = "Reusable connected, discovered, remembered, and relay-device row.";
  component.resize(360, 72);
  autoLayout(component, "HORIZONTAL", 12, { top: 12, right: 14, bottom: 12, left: 14 });
  component.setBoundVariable("itemSpacing", vars.space12);
  component.setBoundVariable("cornerRadius", vars.radius14);
  component.cornerRadius = 14;
  applyColor(component, "fills", vars.surface, C.panel);
  component.strokes = [figma.variables.setBoundVariableForPaint(solid(C.line), "color", vars.border)];
  component.strokeWeight = 1;
  const deviceIcon = iconMaster.createInstance();
  deviceIcon.name = "Leading Icon";
  deviceIcon.resize(28, 28);
  component.appendChild(deviceIcon);
  const copy = frame("Copy", 0, 0, 190, 48, null, 0);
  autoLayout(copy, "VERTICAL", 3, { top: 0, right: 0, bottom: 0, left: 0 }, "MIN");
  const title = await label(copy, "Title", "iPhone 15 Pro", 0, 0, 15, C.text, "Semi Bold");
  const detail = await label(copy, "Detail", "192.168.1.42", 0, 0, 12, C.muted, "Regular");
  component.appendChild(copy);
  const action = await label(component, "Action", "Connect", 0, 0, 13, C.blue, "Medium");
  exposeVisibility(component, deviceIcon, "Show Icon", true);
  exposeInstanceSwap(component, deviceIcon, "Icon", iconMaster);
  exposeText(component, title, "Title", "iPhone 15 Pro");
  exposeText(component, detail, "Detail", "192.168.1.42");
  exposeText(component, action, "Action", "Connect");
  componentPage.appendChild(component);
  return component;
}

async function buildNavItemComponent(componentPage, vars, iconMaster) {
  const component = figma.createComponent();
  component.name = "Clippy/Nav Item";
  component.description = "Desktop sidebar destination with an iOS-derived 44px target.";
  component.resize(204, 48);
  autoLayout(component, "HORIZONTAL", 12, { top: 0, right: 14, bottom: 0, left: 14 });
  component.setBoundVariable("itemSpacing", vars.space12);
  component.setBoundVariable("cornerRadius", vars.radius12);
  component.cornerRadius = 12;
  applyColor(component, "fills", vars.surface, "#1B3550");
  const navIcon = iconMaster.createInstance();
  navIcon.name = "Leading Icon";
  component.appendChild(navIcon);
  const title = await label(component, "Label", "Devices", 0, 0, 15, C.blue, "Medium");
  exposeVisibility(component, navIcon, "Show Icon", true);
  exposeInstanceSwap(component, navIcon, "Icon", iconMaster);
  exposeText(component, title, "Label", "Devices");
  componentPage.appendChild(component);
  return component;
}

async function buildTabItemComponent(componentPage, vars, iconMaster) {
  const component = figma.createComponent();
  component.name = "Clippy/Tab Item";
  component.description = "iPhone bottom-navigation item with icon and label.";
  component.resize(76, 58);
  autoLayout(component, "VERTICAL", 4, { top: 6, right: 6, bottom: 4, left: 6 });
  component.setBoundVariable("itemSpacing", vars.space4);
  component.primaryAxisAlignItems = "CENTER";
  const tabIcon = iconMaster.createInstance();
  tabIcon.name = "Icon";
  component.appendChild(tabIcon);
  const title = await label(component, "Label", "Devices", 0, 0, 10, C.blue, "Medium");
  exposeVisibility(component, tabIcon, "Show Icon", true);
  exposeInstanceSwap(component, tabIcon, "Icon", iconMaster);
  exposeText(component, title, "Label", "Devices");
  componentPage.appendChild(component);
  return component;
}

async function navItem(parent, textValue, glyph, y, selected = false) {
  if (selected) rect(parent, `${textValue} / Selected`, 16, y, 204, 48, "#1B3550", 12, C.line);
  icon(parent, `${textValue} / Icon`, glyph, 30, y + 12, 24, selected ? C.blue : C.muted);
  await label(parent, `${textValue} / Label`, textValue, 64, y + 13, 16, selected ? C.blue : C.text, "Regular");
}

async function deviceRow(parent, y, kind, title, sub, status, action, warning = false) {
  glass(parent, `Device Row / ${title}`, 16, y, parent.width - 32, 70, 13);
  icon(parent, `${title} / Icon`, kind === "laptop" ? paths.laptop : paths.phone, 30, y + 19, 28);
  await label(parent, `${title} / Name`, title, 74, y + 13, 16, C.text, "Medium");
  await label(parent, `${title} / Detail`, sub, 74, y + 38, 13, C.muted, "Regular");
  if (status) {
    const w = warning ? 108 : 92;
    rect(parent, `${title} / ${status}`, parent.width - 214, y + 22, w, 28, warning ? "#342A18" : "#162C43", 8, warning ? "#6A5121" : C.line);
    await label(parent, `${title} / Status Label`, status, parent.width - 204, y + 28, 12, warning ? C.amber : "#A9D2FF", "Medium");
  }
  rect(parent, `${title} / Action`, parent.width - 112, y + 16, 80, 38, action === "Connect" ? C.blue2 : "#243549", 10, C.line);
  await label(parent, `${title} / Action Label`, action, parent.width - 108, y + 26, 13, C.text, "Medium", 72, "CENTER");
}

async function buildDesktop(page, vars, components) {
  const auraBlue = figma.createEllipse();
  auraBlue.name = "Clippy / Aura / Blue";
  auraBlue.x = 10;
  auraBlue.y = 10;
  auraBlue.resize(430, 430);
  auraBlue.fills = [solid("#1769DF", 0.26)];
  auraBlue.effects = [{ type: "LAYER_BLUR", radius: 100, visible: true }];
  page.appendChild(auraBlue);
  const auraTeal = figma.createEllipse();
  auraTeal.name = "Clippy / Aura / Teal";
  auraTeal.x = 770;
  auraTeal.y = 520;
  auraTeal.resize(390, 390);
  auraTeal.fills = [solid("#179DA0", 0.2)];
  auraTeal.effects = [{ type: "LAYER_BLUR", radius: 110, visible: true }];
  page.appendChild(auraTeal);
  const root = frame("Clippy / Desktop / Devices", 80, 80, 1000, 760, C.ink, 32);
  applyColor(root, "fills", vars.bg, C.ink);
  root.strokes = [solid("#758AA1", 0.7)];
  root.strokeWeight = 1;
  root.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0.03, b: 0.08, a: 0.65 }, offset: { x: 0, y: 30 }, radius: 60, spread: -18, visible: true, blendMode: "NORMAL" }];
  page.appendChild(root);
  const sidebar = frame("Sidebar", 0, 0, 244, 760, C.ink2, 0);
  sidebar.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[0.9, 0.16, -0.03], [-0.16, 0.9, 0.08]],
    gradientStops: [
      { position: 0, color: { ...rgb("#18334B"), a: 0.92 } },
      { position: 1, color: { ...rgb(C.ink2), a: 0.96 } }
    ]
  }];
  root.appendChild(sidebar);
  rect(root, "Sidebar Divider", 243, 0, 1, 760, C.line);
  rect(root, "Titlebar Divider", 244, 55, 756, 1, C.line);
  [C.red, C.amber, C.green].forEach((color, i) => {
    const dot = figma.createEllipse();
    dot.name = `Window Control ${i + 1}`;
    dot.x = 22 + i * 25;
    dot.y = 21;
    dot.resize(13, 13);
    dot.fills = [solid(color)];
    sidebar.appendChild(dot);
  });
  icon(sidebar, "Clippy Mark", paths.clip, 28, 66, 42);
  await label(sidebar, "Brand", "Clippy", 78, 68, 24, C.text, "Semi Bold");
  await label(sidebar, "Byline", "by Venturis Lab", 78, 98, 13, C.muted, "Regular");
  await navItem(sidebar, "Devices", paths.phone, 132, true);
  await navItem(sidebar, "Clipboard", paths.clipboard, 190);
  await navItem(sidebar, "Files", paths.file, 248);
  await navItem(sidebar, "SMS", paths.message, 306);
  await navItem(sidebar, "Notifications", paths.shield, 364);
  await navItem(sidebar, "Settings", paths.gear, 422);
  await navItem(sidebar, "About", paths.info, 480);
  icon(sidebar, "Privacy Icon", paths.shield, 26, 624, 28);
  await label(sidebar, "Privacy Title", "Privacy-first", 64, 626, 15, C.green, "Medium");
  await label(sidebar, "Privacy Copy", "All data stays on your\ndevices. End-to-end.", 64, 655, 13, C.muted, "Regular");
  await label(root, "Window Title", "Clippy by Venturis Lab", 244, 18, 14, C.muted, "Regular", 756, "CENTER");
  await label(root, "Page Title", "Devices", 274, 76, 34, C.text, "Semi Bold");
  await label(root, "Page Subtitle", "Securely connect your devices. Your data never leaves your network.", 274, 119, 15, C.muted, "Regular");
  const add = components.button.createInstance();
  add.name = "Add Device / Button";
  add.resize(138, 44);
  add.x = 836;
  add.y = 72;
  root.appendChild(add);
  if (components.buttonLabelProperty) {
    add.setProperties({ [components.buttonLabelProperty]: "+  Add Device" });
  }

  const connected = glass(root, "Connected Device Card", 274, 156, 700, 128, 16);
  icon(connected, "iPhone 15 Pro / Device", paths.phone, 20, 24, 62);
  await label(connected, "Device Name", "iPhone 15 Pro", 98, 22, 19, C.text, "Semi Bold");
  await label(connected, "Device Meta", "iOS 17.5  •  192.168.1.42", 98, 52, 14, C.muted, "Regular");
  const connectedPill = components.pill.createInstance();
  connectedPill.name = "Connected / Status";
  connectedPill.x = 98;
  connectedPill.y = 82;
  connected.appendChild(connectedPill);
  rect(connected, "Local LAN / Pill", 214, 82, 88, 28, "#102C4C", 8, C.line);
  await label(connected, "Local LAN / Label", "Local LAN", 229, 88, 12, "#A9D2FF", "Medium");
  icon(connected, "Verified / Icon", paths.shield, 316, 84, 22);
  await label(connected, "Verified / Label", "Verified", 342, 88, 12, C.text, "Medium");
  await label(connected, "Battery", "87%", 630, 56, 14, C.text, "Medium");

  const quick1 = glass(root, "Quick Action / Clipboard", 274, 296, 340, 94, 15);
  icon(quick1, "Clipboard Icon", paths.clipboard, 20, 23, 34);
  await label(quick1, "Clipboard Title", "Clipboard", 70, 17, 17, C.text, "Semi Bold");
  await label(quick1, "Clipboard Copy", "Sync clipboard between devices.", 70, 48, 14, C.muted, "Regular", 230);
  await label(quick1, "Chevron", "›", 305, 30, 28, C.muted, "Regular");
  const quick2 = glass(root, "Quick Action / Send File", 630, 296, 344, 94, 15);
  icon(quick2, "File Icon", paths.file, 20, 23, 34);
  await label(quick2, "Send File Title", "Send File", 70, 17, 17, C.text, "Semi Bold");
  await label(quick2, "Send File Copy", "Send files securely to your device.", 70, 48, 14, C.muted, "Regular", 230);
  await label(quick2, "Chevron", "›", 310, 30, 28, C.muted, "Regular");

  const others = glass(root, "Other Devices", 274, 402, 700, 184, 16);
  await label(others, "Section Title", "Other Devices", 16, 14, 16, C.text, "Semi Bold");
  await deviceRow(others, 42, "laptop", "Venturis-MacBook", "192.168.1.71", "Local LAN", "Connect");
  await deviceRow(others, 114, "phone", "Pixel 7", "Last seen 2h ago", "Relay fallback", "Reconnect", true);

  const manual = glass(root, "Manual Pairing", 274, 590, 334, 112, 15);
  await label(manual, "Manual Pairing Title", "Add Device Manually", 16, 14, 16, C.text, "Semi Bold");
  await label(manual, "Manual Pairing Copy", "Enter the IP address shown in Clippy.", 16, 42, 13, C.muted, "Regular");
  rect(manual, "IP Address / Field", 16, 67, 198, 34, "#172536", 9, C.line);
  await label(manual, "IP Address / Value", "192.168.1.42", 28, 75, 13, C.muted, "Regular");
  rect(manual, "Connect / Button", 224, 67, 94, 34, C.blue2, 9, C.line);
  await label(manual, "Connect / Label", "Connect", 224, 76, 13, C.text, "Medium", 94, "CENTER");
  const discovery = glass(root, "Local Discovery", 620, 590, 354, 112, 15);
  await label(discovery, "Discovery Title", "Local Discovery", 16, 14, 16, C.text, "Semi Bold");
  await label(discovery, "Discovery Copy", "Searching for devices on your local network…", 16, 42, 13, C.muted, "Regular");
  await label(discovery, "Discovery Status", "✓  Discovery active", 16, 74, 14, C.green, "Medium");
  rect(root, "Connection Footer / Divider", 274, 718, 700, 1, C.line);
  icon(root, "Connection Footer / Shield", paths.shield, 274, 727, 22);
  await label(root, "Connection Footer / Status", "Direct connection established", 304, 730, 13, C.muted, "Regular");
  rect(root, "Connection Footer / Help", 944, 725, 28, 28, "#172536", 14, C.line);
  await label(root, "Connection Footer / Help Label", "?", 944, 728, 15, C.text, "Medium", 28, "CENTER");
  return root;
}

async function phoneRow(parent, y, kind, title, sub, badge, action = "›", warning = false) {
  glass(parent, `Device / ${title}`, 18, y, 334, 80, 14);
  icon(parent, `${title} / Icon`, kind === "laptop" ? paths.laptop : paths.phone, 30, y + 24, 30);
  await label(parent, `${title} / Name`, title, 76, y + 14, 15, C.text, "Semi Bold");
  await label(parent, `${title} / Meta`, sub, 76, y + 37, 12, C.muted, "Regular");
  if (badge) {
    rect(parent, `${title} / Badge`, 76, y + 55, warning ? 104 : 74, 20, warning ? "#342A18" : "#15304D", 6);
    await label(parent, `${title} / Badge Label`, badge, 82, y + 59, 10, warning ? C.amber : "#AED6FF", "Medium");
  }
  await label(parent, `${title} / Action`, action, 316, y + 26, 25, action === "Connect" ? C.blue : C.muted, "Medium", 28, "CENTER");
}

async function buildPhone(page, components, vars) {
  const body = frame("Clippy / iPhone / Devices", 1120, 34, 390, 844, "#01050A", 58);
  body.strokes = [solid("#526071")];
  body.strokeWeight = 2;
  body.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.75 }, offset: { x: 0, y: 28 }, radius: 52, spread: -12, visible: true, blendMode: "NORMAL" }];
  page.appendChild(body);
  const screen = frame("iPhone Screen", 10, 10, 370, 824, C.ink, 49);
  applyColor(screen, "fills", vars.bg, C.ink);
  body.appendChild(screen);
  rect(screen, "Dynamic Island", 128, 14, 114, 34, "#000000", 18);
  await label(screen, "Time", "9:41", 28, 20, 15, C.text, "Semi Bold");
  await label(screen, "Status Symbols", "▮▮▮  )))  ▰", 267, 22, 11, C.text, "Semi Bold");
  await label(screen, "Page Title", "Devices", 18, 72, 31, C.text, "Semi Bold");
  rect(screen, "Add / Glass Button", 316, 67, 42, 42, "#17345C", 21);
  await label(screen, "Add / Symbol", "+", 316, 70, 30, C.blue, "Regular", 42, "CENTER");
  const manual = glass(screen, "Manual Pairing", 18, 118, 334, 156, 22);
  await label(manual, "Title", "Add Device Manually", 14, 14, 17, C.text, "Semi Bold");
  await label(manual, "Copy", "Enter the IP address shown in Clippy\non your other device.", 14, 42, 13, C.muted, "Regular", 286);
  rect(manual, "IP Address / Field", 14, 90, 210, 38, "#172536", 9, C.line);
  await label(manual, "IP Address / Value", "192.168.1.42", 24, 100, 14, C.muted, "Regular");
  rect(manual, "Connect / Button", 234, 90, 86, 38, C.blue2, 9, C.line);
  await label(manual, "Connect / Label", "Connect", 234, 100, 14, C.text, "Medium", 86, "CENTER");
  await label(manual, "Helper", "Supports IPv4.", 14, 134, 11, C.muted, "Regular");
  await label(screen, "Connected / Heading", "CONNECTED", 18, 286, 11, C.muted, "Medium");
  await phoneRow(screen, 302, "laptop", "Venturis-MacBook", "192.168.1.71", "Local LAN");
  await label(screen, "Discovered / Heading", "DISCOVERED", 18, 384, 11, C.muted, "Medium");
  await phoneRow(screen, 400, "phone", "iPad Air", "192.168.1.83", "Local LAN", "Connect");
  await label(screen, "Remembered / Heading", "REMEMBERED", 18, 482, 11, C.muted, "Medium");
  await phoneRow(screen, 498, "phone", "Pixel 7", "Last seen 2h ago", "Relay fallback", "›", true);
  const trust = glass(screen, "Trust & Security", 18, 582, 334, 68, 20);
  icon(trust, "Shield", paths.shield, 14, 18, 28);
  await label(trust, "Title", "Trust & Security", 52, 13, 14, C.text, "Semi Bold");
  await label(trust, "Copy", "Trusted, verified, end-to-end encrypted.", 52, 35, 11, C.muted, "Regular", 248);
  await label(trust, "Chevron", "›", 306, 18, 26, C.muted, "Regular");
  await label(screen, "Quick Actions / Heading", "QUICK ACTIONS", 18, 660, 11, C.muted, "Medium");
  const clipboardAction = glass(screen, "Quick Action / Clipboard Inbox", 18, 678, 160, 50, 18);
  icon(clipboardAction, "Clipboard Inbox / Icon", paths.clipboard, 12, 13, 24);
  await label(clipboardAction, "Clipboard Inbox / Title", "Clipboard Inbox", 44, 8, 12, C.text, "Semi Bold");
  await label(clipboardAction, "Clipboard Inbox / Copy", "View recent items", 44, 27, 10, C.muted, "Regular");
  await label(clipboardAction, "Clipboard Inbox / Chevron", "›", 140, 12, 22, C.muted, "Regular");
  const sendAction = glass(screen, "Quick Action / Send File", 192, 678, 160, 50, 18);
  icon(sendAction, "Send File / Icon", paths.file, 12, 13, 24);
  await label(sendAction, "Send File / Title", "Send File", 44, 8, 12, C.text, "Semi Bold");
  await label(sendAction, "Send File / Copy", "Send to device", 44, 27, 10, C.muted, "Regular");
  await label(sendAction, "Send File / Chevron", "›", 140, 12, 22, C.muted, "Regular");
  const tab = frame("Tab Bar / Liquid Glass", 14, 744, 342, 66, "#132438", 23);
  tab.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[0.92, 0.12, -0.02], [-0.12, 0.92, 0.08]],
    gradientStops: [
      { position: 0, color: { ...rgb("#40566D"), a: 0.78 } },
      { position: 1, color: { ...rgb("#0B1828"), a: 0.9 } }
    ]
  }];
  tab.strokes = [solid(C.line, 0.55)];
  tab.strokeWeight = 1;
  screen.appendChild(tab);
  const tabs = [
    ["Devices", paths.phone, true],
    ["Clipboard", paths.clipboard, false],
    ["Files", paths.file, false],
    ["Settings", paths.gear, false]
  ];
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i][2]) rect(tab, `${tabs[i][0]} / Liquid Focus`, 13 + i * 84, 6, 58, 54, "#1D4770", 18, C.line);
    icon(tab, `${tabs[i][0]} / Icon`, tabs[i][1], 30 + i * 84, 9, 22);
    await label(tab, `${tabs[i][0]} / Label`, tabs[i][0], 5 + i * 84, 38, 9, tabs[i][2] ? "#A9D3FF" : C.muted, "Medium", 74, "CENTER");
  }
  rect(screen, "Home Indicator", 128, 808, 114, 5, C.text, 3);
  return body;
}

async function main() {
// Clean only artifacts created by the failed diagnostic and automation attempts.
for (const node of [...figma.currentPage.children]) {
  if (node.name === "Test Frame" || node.name === "n") node.remove();
}

const pages = figma.root.children;
let page = pages.find(p => p.name === "Clippy Keynote");
if (!page) {
  page = figma.createPage();
  page.name = "Clippy Keynote";
}
await figma.setCurrentPageAsync(page);
for (const node of [...page.children]) {
  if (node.name.startsWith("Clippy /") || node.name === "Test Frame" || node.name === "Clippy Components") node.remove();
}
page.backgrounds = [solid("#E6E9EE")];

const availableFonts = await figma.listAvailableFontsAsync();
// Inter is guaranteed in this Figma runtime and has stable style names.
// The hierarchy and metrics are tuned to Apple's large-title conventions.
activeFont = "Inter";
const desiredStyles = ["Regular", "Medium", "Semi Bold"];
for (const style of desiredStyles) {
  const match = availableFonts.find(f => f.fontName.family === activeFont && f.fontName.style === style);
  if (match) await figma.loadFontAsync(match.fontName);
}

const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
let collection = localCollections.find(c => c.name === "Clippy Theme / Venturis Calm" || c.name === "Clippy Theme");
if (!collection) collection = figma.variables.createVariableCollection("Clippy Theme / Venturis Calm");
collection.name = "Clippy Theme / Venturis Calm";
const darkMode = collection.modes[0];
collection.renameMode(darkMode.modeId, "Venturis Calm");
let lightCollection = localCollections.find(c => c.name === "Clippy Theme / Frosted Suite");
if (!lightCollection) lightCollection = figma.variables.createVariableCollection("Clippy Theme / Frosted Suite");
const lightMode = lightCollection.modes[0];
lightCollection.renameMode(lightMode.modeId, "Frosted Suite");
const existingVars = await figma.variables.getLocalVariablesAsync();
const byName = new Map(existingVars.filter(v => v.variableCollectionId === collection.id).map(v => [v.name, v]));
const lightByName = new Map(existingVars.filter(v => v.variableCollectionId === lightCollection.id).map(v => [v.name, v]));
function ensureColor(name, dark, light, css) {
  const variable = byName.get(name) || figma.variables.createVariable(name, collection, "COLOR");
  const lightVariable = lightByName.get(name) || figma.variables.createVariable(name, lightCollection, "COLOR");
  variable.scopes = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  lightVariable.scopes = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  variable.setValueForMode(darkMode.modeId, rgb(dark));
  lightVariable.setValueForMode(lightMode.modeId, rgb(light));
  variable.setVariableCodeSyntax("WEB", `var(--${css})`);
  variable.setVariableCodeSyntax("iOS", css.replace(/-/g, "."));
  lightVariable.setVariableCodeSyntax("WEB", `var(--${css})`);
  lightVariable.setVariableCodeSyntax("iOS", css.replace(/-/g, "."));
  return variable;
}
function ensureFloat(name, value, scope, css) {
  const variable = byName.get(name) || figma.variables.createVariable(name, collection, "FLOAT");
  const lightVariable = lightByName.get(name) || figma.variables.createVariable(name, lightCollection, "FLOAT");
  variable.scopes = [scope];
  lightVariable.scopes = [scope];
  variable.setValueForMode(darkMode.modeId, value);
  lightVariable.setValueForMode(lightMode.modeId, value);
  variable.setVariableCodeSyntax("WEB", `var(--${css})`);
  variable.setVariableCodeSyntax("iOS", css.replace(/-/g, "."));
  lightVariable.setVariableCodeSyntax("WEB", `var(--${css})`);
  lightVariable.setVariableCodeSyntax("iOS", css.replace(/-/g, "."));
  return variable;
}
const vars = {
  bg: ensureColor("color/bg/primary", C.ink, "#F4F7FB", "color-bg-primary"),
  surface: ensureColor("color/surface/glass", C.panel, "#FFFFFF", "color-surface-glass"),
  border: ensureColor("color/border/glass", C.line, "#CBD6E2", "color-border-glass"),
  text: ensureColor("color/text/primary", C.text, "#101828", "color-text-primary"),
  muted: ensureColor("color/text/secondary", C.muted, "#53657A", "color-text-secondary"),
  accent: ensureColor("color/action/accent", C.blue, "#0A65DC", "color-action-accent"),
  success: ensureColor("color/status/connected", C.green, "#16853B", "color-status-connected"),
  warning: ensureColor("color/status/relay", C.amber, "#A76600", "color-status-relay"),
  danger: ensureColor("color/status/disconnected", "#FF5F57", "#D92D20", "color-status-disconnected"),
  space4: ensureFloat("spacing/4", 4, "GAP", "space-4"),
  space8: ensureFloat("spacing/8", 8, "GAP", "space-8"),
  space12: ensureFloat("spacing/12", 12, "GAP", "space-12"),
  space16: ensureFloat("spacing/16", 16, "GAP", "space-16"),
  radius8: ensureFloat("radius/8", 8, "CORNER_RADIUS", "radius-8"),
  radius10: ensureFloat("radius/10", 10, "CORNER_RADIUS", "radius-10"),
  radius12: ensureFloat("radius/12", 12, "CORNER_RADIUS", "radius-12"),
  radius14: ensureFloat("radius/14", 14, "CORNER_RADIUS", "radius-14"),
  radius16: ensureFloat("radius/16", 16, "CORNER_RADIUS", "radius-16"),
  radius20: ensureFloat("radius/20", 20, "CORNER_RADIUS", "radius-20"),
  radius24: ensureFloat("radius/24", 24, "CORNER_RADIUS", "radius-24")
};

const componentPage = frame("Clippy Components", 80, 980, 1430, 430, "#EDF1F6", 28);
page.appendChild(componentPage);
await label(componentPage, "Title", "Clippy UI Kit", 30, 24, 28, "#101828", "Semi Bold");
await label(componentPage, "Subtitle", "Reusable, code-mappable components derived from iOS 27 conventions and Venturis Calm.", 30, 64, 14, "#53657A", "Regular");
await label(componentPage, "Source", "iOS reference: figma.com/community/file/1651309003795292092/ios-and-ipados-27", 840, 30, 12, "#53657A", "Regular", 550, "RIGHT");
await label(componentPage, "Reference Direction", "Liquid controls, AirDrop framing, frosted commerce, and floating dock studies archived in output/references/pinterest/manifest.json", 840, 54, 11, "#53657A", "Regular", 550, "RIGHT");
const iconMaster = buildIconComponent(componentPage);
iconMaster.x = 30;
iconMaster.y = 184;
const buttonParts = await buildButtonComponent(componentPage, vars, iconMaster);
buttonParts.component.x = 30;
buttonParts.component.y = 116;
const pill = await buildPillComponent(componentPage, vars);
pill.x = 184;
pill.y = 124;
const card = await buildCardComponent(componentPage, vars);
card.x = 320;
card.y = 108;
const textField = await buildTextFieldComponent(componentPage, vars);
textField.x = 640;
textField.y = 116;
const deviceRowMaster = await buildDeviceRowComponent(componentPage, vars, iconMaster);
deviceRowMaster.x = 30;
deviceRowMaster.y = 250;
const navItemMaster = await buildNavItemComponent(componentPage, vars, iconMaster);
navItemMaster.x = 420;
navItemMaster.y = 262;
const tabItemMaster = await buildTabItemComponent(componentPage, vars, iconMaster);
tabItemMaster.x = 650;
tabItemMaster.y = 252;
const components = {
  button: buttonParts.component,
  buttonLabelProperty: buttonParts.labelProperty,
  pill,
  card,
  textField,
  deviceRow: deviceRowMaster,
  navItem: navItemMaster,
  tabItem: tabItemMaster
};

const desktop = await buildDesktop(page, vars, components);
const phone = await buildPhone(page, components, vars);

const requiredComponentNames = [
  "Clippy/Button",
  "Clippy/Status Pill",
  "Clippy/Device Row",
  "Clippy/Nav Item",
  "Clippy/Card",
  "Clippy/Text Field",
  "Clippy/Tab Item"
];
const generatedComponents = componentPage.findAll(node => node.type === "COMPONENT");
const missingComponents = requiredComponentNames.filter(name => !generatedComponents.some(node => node.name === name));
const nonAutoLayoutComponents = generatedComponents
  .filter(node => node.name !== "Clippy/Icon" && node.layoutMode === "NONE")
  .map(node => node.name);
const flattenedScreens = [desktop, phone].filter(screenNode =>
  screenNode.findAll(node => Array.isArray(node.fills) && node.fills.some(fill => fill.type === "IMAGE")).length > 0
);
assertScreenContent(desktop, [
  "Devices",
  "Clipboard",
  "Files",
  "SMS",
  "Notifications",
  "Settings",
  "About",
  "iPhone 15 Pro",
  "Other Devices",
  "Venturis-MacBook",
  "Pixel 7",
  "Add Device Manually",
  "Local Discovery",
  "Direct connection established",
  "Privacy-first"
], 60);
assertScreenContent(phone, [
  "Devices",
  "Add Device Manually",
  "CONNECTED",
  "DISCOVERED",
  "REMEMBERED",
  "Venturis-MacBook",
  "iPad Air",
  "Pixel 7",
  "Trust & Security",
  "QUICK ACTIONS",
  "Clipboard Inbox",
  "Send File",
  "Clipboard",
  "Files",
  "Settings"
], 50);
if (missingComponents.length || nonAutoLayoutComponents.length || flattenedScreens.length) {
  throw new Error(`Generation validation failed. Missing: ${missingComponents.join(", ")}; no Auto Layout: ${nonAutoLayoutComponents.join(", ")}; image-backed screens: ${flattenedScreens.map(node => node.name).join(", ")}`);
}

figma.currentPage.selection = [desktop, phone];
figma.viewport.scrollAndZoomIntoView([desktop, phone]);
await figma.saveVersionHistoryAsync("Clippy Keynote design generated", "Editable desktop and iPhone Devices screens with shared tokens and reusable controls.");
figma.closePlugin("Clippy Keynote design created");
}

main().catch(error => {
  console.error(error);
  figma.closePlugin(`Clippy build failed: ${error.message || error}`);
});
