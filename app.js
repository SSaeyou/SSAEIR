"use strict";

// 사진과 작성 내용은 현재 페이지의 메모리에서만 처리합니다.
const state = {
  gender: "", services: new Set(), photoUrl: "", photoName: "",
  style: "", customStyle: "", details: {}, avoids: new Set(), memo: ""
};
const $ = (selector) => document.querySelector(selector);
const serviceNames = {cut: "커트", perm: "펌", downperm: "다운펌"};
const styleNames = {
  male: ["댄디컷", "크롭컷", "아이비리그컷", "리프컷"],
  female: ["숏컷", "보브컷", "태슬컷", "레이어드컷", "허쉬컷"]
};
let openPanel = "";
let previousContext = "";

// label은 화면용, speech는 미용실에서 읽을 문장용입니다.
const choice = (key, label, speech, graphic = "", caption = "") => ({key, label, speech, graphic, caption});
const avoidGroups = [
  {id:"commonCut", title:"공통 · 커트", service:"cut", items:[
    {id:"tooShort", label:"너무 짧게 자르지 않기", speech:"전체 길이를 너무 짧게 자르지는 말아주세요.", topic:"cutLength", short:"너무 짧게 자르지는 말아주세요."},
    {id:"shorterThanWanted", label:"원하는 길이보다 짧아지지 않기", speech:"말씀드린 길이보다 짧아지지 않게 해주세요.", topic:"cutLength", short:"말씀드린 길이보다 짧아지지 않게 해주세요."}
  ]},
  {id:"commonEase", title:"공통 · 손질과 느낌", services:["cut","perm","downperm"], items:[
    {id:"hardStyling", label:"손질이 너무 어렵지 않게 하기", speech:"평소에 손질하기 어렵지 않게 해주세요."},
    {id:"unnatural", label:"자연스럽지 않은 느낌 피하기", speech:"전체적으로 인위적인 느낌은 피해주세요."}
  ]},
  {id:"commonPerm", title:"공통 · 펌", service:"perm", items:[
    {id:"bigVolume", label:"과한 볼륨 피하기", speech:"볼륨이 과하게 커지지는 않게 해주세요."}
  ]},
  {id:"maleCut", title:"남성 · 커트", service:"cut", gender:"male", items:[
    {id:"maleSideLift", label:"옆머리가 너무 뜨지 않게 하기", speech:"옆머리가 너무 뜨지 않게 정리해 주세요.", topic:"side", short:"너무 뜨지 않게 정리해 주세요."},
    {id:"highFade", label:"높은 상고 피하기", speech:"뒷머리를 높은 상고로 올리지는 말아주세요.", topic:"back", short:"높은 상고로 올리지는 말아주세요."},
    {id:"maleShortFront", label:"앞머리를 너무 짧게 자르지 않기", speech:"앞머리를 너무 짧게 자르지는 말아주세요.", topic:"frontShape", short:"너무 짧게 자르지는 말아주세요."},
    {id:"maleShortBack", label:"뒷머리를 너무 짧게 자르지 않기", speech:"뒷머리를 너무 짧게 자르지는 말아주세요.", topic:"back", short:"너무 짧게 자르지는 말아주세요."},
    {id:"hardTwoBlock", label:"투블럭 경계를 너무 선명하게 하지 않기", speech:"투블럭 경계가 너무 선명하지 않게 해주세요.", topic:"twoBlock", short:"경계가 너무 선명하지 않게 해주세요."},
    {id:"maleThin", label:"숱을 너무 많이 치지 않기", speech:"숱을 너무 많이 치지는 말아주세요.", topic:"thinning", short:"너무 많이 치지는 말아주세요."}
  ]},
  {id:"femaleCut", title:"여성 · 커트", service:"cut", gender:"female", items:[
    {id:"manyLayers", label:"층을 너무 많이 내지 않기", speech:"층을 너무 많이 내지는 말아주세요.", topic:"layers", short:"너무 많이 내지는 말아주세요."},
    {id:"lightEnds", label:"끝부분이 너무 가벼워지지 않게 하기", speech:"머리 끝이 너무 가벼워지지 않게 해주세요."},
    {id:"femaleShortFront", label:"앞머리를 너무 짧게 자르지 않기", speech:"앞머리를 너무 짧게 자르지는 말아주세요.", topic:"frontShape", short:"너무 짧게 자르지는 말아주세요."},
    {id:"shortFace", label:"얼굴 옆 라인을 너무 짧게 자르지 않기", speech:"얼굴 옆 라인은 너무 짧게 자르지 말아주세요.", topic:"faceLine", short:"너무 짧게 자르지 말아주세요."},
    {id:"endsFlip", label:"머리 끝이 뻗치지 않게 하기", speech:"머리 끝이 쉽게 뻗치지 않게 정리해 주세요."},
    {id:"femaleThin", label:"숱을 과하게 줄이지 않기", speech:"숱을 과하게 줄이지는 말아주세요.", topic:"thinning", short:"과하게 줄이지는 말아주세요."}
  ]},
  {id:"malePerm", title:"남성 · 펌", service:"perm", gender:"male", items:[
    {id:"maleStrongCurl", label:"컬이 너무 강하지 않게 하기", speech:"컬이 너무 강하지 않게 해주세요."},
    {id:"maleTinyCurl", label:"컬이 너무 작지 않게 하기", speech:"컬이 너무 작아지지 않게 해주세요."},
    {id:"maleBigPerm", label:"볼륨이 과하게 커지지 않게 하기", speech:"펌 볼륨이 과하게 커지지 않게 해주세요."},
    {id:"maleDamage", label:"모발 손상이 심해지지 않게 하기", speech:"모발 손상이 심해지지 않도록 살펴주세요."}
  ]},
  {id:"femalePerm", title:"여성 · 펌", service:"perm", gender:"female", items:[
    {id:"femaleStrongCurl", label:"컬이 너무 강하지 않게 하기", speech:"컬이 너무 강하지 않게 해주세요."},
    {id:"femaleTinyCurl", label:"컬이 너무 작지 않게 하기", speech:"컬이 너무 작아지지 않게 해주세요."},
    {id:"rootTooHigh", label:"뿌리 볼륨이 과하게 뜨지 않게 하기", speech:"뿌리 볼륨이 과하게 뜨지 않게 해주세요."},
    {id:"puffyEnds", label:"머리 끝이 너무 부해지지 않게 하기", speech:"머리 끝이 너무 부해지지 않게 해주세요."},
    {id:"femaleHardStyling", label:"손질이 어려운 스타일 피하기", speech:"평소에 손질하기 어려운 스타일은 피해주세요."},
    {id:"femaleDamage", label:"모발 손상이 심해지지 않게 하기", speech:"모발 손상이 심해지지 않도록 살펴주세요."}
  ]},
  {id:"downperm", title:"다운펌", service:"downperm", items:[
    {id:"strongDown", label:"다운펌을 너무 강하게 하지 않기", speech:"다운펌은 너무 강하게 하지 말아주세요."},
    {id:"flatSide", label:"옆머리가 너무 눌어붙지 않게 하기", speech:"옆머리가 너무 눌어붙지 않게 해주세요."},
    {id:"downDamage", label:"모발 손상이 심해지지 않게 하기", speech:"모발 손상이 심해지지 않도록 살펴주세요."}
  ]}
];

function detailDefinitions() {
  const defs = [];
  const add = (service, id, title, options) => defs.push({service, id, title, options});
  const firstService = ["cut","perm","downperm"].find((id) => state.services.has(id));
  if (state.photoUrl && firstService) add(firstService, "photoFeel", "사진의 전체적인 느낌", [
    choice("similar", "비슷한 느낌", "전체적인 느낌은 사진과 비슷하게 해주세요."),
    choice("reference", "참고만 할게요", "사진은 참고만 하고 제 머리에 맞게 상담하고 싶어요.")
  ]);
  if (state.services.has("cut")) {
    add("cut", "style", "헤어스타일", [...styleNames[state.gender].map((name) => choice(name, name, name)), choice("unknown", "잘 모르겠어요", ""), choice("custom", "직접 입력", "")]);
    add("cut", "cutLength", "커트 길이", [
      choice("short", "짧게", "전체 길이는 짧게 정리해 주세요.", "length", "짧은 길이"),
      choice("medium", "중간", "전체 길이는 중간 정도로 남겨주세요.", "length", "중간 길이"),
      choice("long", "길게", "전체 길이는 길게 남겨주세요.", "length", "긴 길이"),
      ...(state.photoUrl ? [choice("photo", "사진처럼", "전체 길이는 사진과 비슷하게 해주세요.")] : [])
    ]);
    add("cut", "frontShape", "앞머리 형태", [
      choice("down", "자연스럽게 내리기", "앞머리는 자연스럽게 내려주세요.", "fringe", "앞으로 내린 형태"),
      choice("side", "옆으로 넘기기", "앞머리는 옆으로 자연스럽게 넘겨주세요.", "fringe", "옆으로 흐르는 형태"),
      choice("light", "가볍게", "앞머리는 가볍게 정리해 주세요.", "fringe", "가벼운 앞머리"),
      ...(state.photoUrl ? [choice("photo", "사진처럼", "앞머리는 사진과 비슷하게 해주세요.")] : [])
    ]);
    add("cut", "side", "옆머리", [
      choice("showEar", "귀가 보이게", "옆머리는 귀가 보이게 정리해 주세요."),
      choice("halfEar", "귀를 조금 덮게", "옆머리는 귀를 조금 덮게 남겨주세요."),
      choice("coverEar", "귀를 덮게", "옆머리는 귀를 덮는 길이로 남겨주세요.")
    ]);
    add("cut", "back", "뒷머리", [
      choice("short", "목덜미가 보이게", "뒷머리는 목덜미가 보이게 정리해 주세요."),
      choice("keep", "길이를 남기기", "뒷머리는 길이를 어느 정도 남겨주세요.")
    ]);
    add("cut", "layers", "레이어 정도", [
      choice("none", "층 거의 없이", "층은 거의 내지 말아주세요.", "layers", "층이 적은 형태"),
      choice("light", "층 조금", "층은 조금만 내주세요.", "layers", "층이 약간 있는 형태"),
      choice("many", "층 충분히", "층을 충분히 내주세요.", "layers", "층이 많은 형태")
    ]);
    add("cut", "thinning", "숱 정리", [
      choice("little", "조금만", "숱은 조금만 정리해 주세요."),
      choice("normal", "적당히", "숱은 적당히 정리해 주세요.")
    ]);
    if (state.gender === "male") add("cut", "twoBlock", "투블럭", [
      choice("soft", "부드러운 경계", "투블럭은 경계가 부드럽게 이어지도록 해주세요."),
      choice("none", "투블럭 없이", "투블럭은 하지 말아주세요.")
    ]);
    if (state.gender === "female") add("cut", "faceLine", "얼굴 옆 라인", [
      choice("keep", "길이 남기기", "얼굴 옆 라인은 길이를 남겨주세요."),
      choice("soft", "자연스럽게", "얼굴 옆 라인은 자연스럽게 이어주세요.")
    ]);
  }
  if (state.services.has("perm")) {
    add("perm", "permArea", "펌할 부분", [
      choice("all", "전체", "펌은 전체적으로 해주세요."),
      choice("front", "앞머리", "앞머리 쪽에 펌을 해주세요."),
      choice("side", "옆머리", "옆머리 쪽에 펌을 해주세요."),
      choice("back", "뒷머리", "뒷머리 쪽에 펌을 해주세요.")
    ]);
    add("perm", "curlSize", "컬 크기", [
      choice("small", "작은 컬", "작은 컬", "curl", "촘촘한 컬"),
      choice("medium", "중간 컬", "중간 컬", "curl", "중간 크기 컬"),
      choice("large", "큰 컬", "큰 컬", "curl", "넓고 느슨한 컬")
    ]);
    add("perm", "curlStrength", "컬 강도", [
      choice("natural", "자연스러움", "자연스럽게 보이도록", "strength", "부드러운 컬"),
      choice("normal", "보통", "적당히 보이도록", "strength", "중간 강도 컬"),
      choice("clear", "뚜렷함", "분명하게 보이도록", "strength", "뚜렷한 컬")
    ]);
    add("perm", "volumePosition", "볼륨 위치", [
      choice("root", "뿌리", "뿌리 쪽", "volume", "정수리·뿌리"),
      choice("side", "옆머리", "옆머리 쪽", "volume", "옆머리"),
      choice("end", "끝부분", "머리 끝 쪽", "volume", "끝부분")
    ]);
    add("perm", "volumeLevel", "볼륨 정도", [
      choice("natural", "자연스럽게 살리기", "자연스럽게 살려주세요."),
      choice("more", "충분히 살리기", "충분히 살려주세요."),
      choice("less", "볼륨 줄이기", "조금 줄여주세요.")
    ]);
  }
  if (state.services.has("downperm")) {
    add("downperm", "downArea", "다운펌할 부분", [
      choice("side", "옆머리", "옆머리에 다운펌을 해주세요."),
      choice("back", "뒷머리", "뒷머리에 다운펌을 해주세요."),
      choice("both", "옆머리와 뒷머리", "옆머리와 뒷머리에 다운펌을 해주세요.")
    ]);
    add("downperm", "downStrength", "눌림 정도", [
      choice("natural", "자연스럽게", "다운펌은 자연스럽게 눌러주세요."),
      choice("firm", "차분하게", "다운펌은 차분하게 눌러주세요.")
    ]);
    add("downperm", "sideLift", "옆머리 뜨는 정도", [
      choice("low", "조금 뜸", "옆머리가 조금 떠서 자연스럽게 정리하고 싶어요.", "lift", "뜨는 정도가 약함"),
      choice("medium", "보통", "옆머리가 떠서 차분히 정리하고 싶어요.", "lift", "뜨는 정도가 보통"),
      choice("high", "많이 뜸", "옆머리가 많이 떠서 차분히 눌러주세요.", "lift", "뜨는 정도가 큼")
    ]);
  }
  return defs;
}

function availableAvoidGroups() {
  return avoidGroups.filter((group) => (!group.gender || group.gender === state.gender) &&
    (!group.service || state.services.has(group.service)) &&
    (!group.services || group.services.some((service) => state.services.has(service))));
}
function availableAvoids() { return availableAvoidGroups().flatMap((group) => group.items); }
function selectedOption(def) {
  const value = def.id === "style" ? state.style : state.details[def.id]?.value;
  return def.options.find((option) => option.key === value);
}
function styleText() {
  if (state.style === "custom") return state.customStyle.trim();
  return styleNames[state.gender]?.includes(state.style) ? state.style : "";
}
function particle(word) {
  const code = word.charCodeAt(word.length - 1);
  const jong = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 : 0;
  return jong && jong !== 8 ? "으로" : "로";
}
function graphicSvg(kind, key) {
  const index = {short:0, medium:1, long:2, small:0, large:2, natural:0, normal:1, clear:2,
    down:0, side:1, light:2, none:0, many:2, root:0, end:2, low:0, high:2}[key] ?? 1;
  const line = (d, width = 4) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  let art = "";
  if (kind === "length") art = `<circle cx="44" cy="20" r="10" fill="none" stroke="currentColor" stroke-width="3"/>` + line(`M30 23 V${38 + index * 12} M58 23 V${38 + index * 12}`) + line(`M30 ${38 + index * 12} Q44 ${47 + index * 12} 58 ${38 + index * 12}`, 3);
  if (kind === "curl" || kind === "strength") {
    const amp = kind === "strength" ? 7 + index * 5 : 12;
    const waves = kind === "curl" ? 5 - index : 4;
    let d = "M8 38";
    for (let n = 0; n < waves; n++) d += ` Q${8 + (n + .5) * 72 / waves} ${38 - amp} ${8 + (n + 1) * 72 / waves} 38`;
    art = line(d, 4) + line("M8 54 H80", 2);
  }
  if (kind === "fringe") art = `<circle cx="44" cy="34" r="22" fill="none" stroke="currentColor" stroke-width="3"/>` +
    line(index === 1 ? "M24 25 Q46 17 63 34" : index === 2 ? "M22 27 Q33 17 43 28 Q54 18 65 27" : "M23 25 Q44 35 65 25");
  if (kind === "layers") art = [0,1,2].map((n) => line(`M${20 + n * 7} ${22 + n * 14} H${68 - n * 7}`, n <= index ? 5 : 2)).join("");
  if (kind === "volume") art = `<circle cx="44" cy="37" r="19" fill="none" stroke="currentColor" stroke-width="3"/>` +
    line(index === 0 ? "M30 15 Q44 1 58 15" : index === 1 ? "M20 25 Q5 37 20 49 M68 25 Q83 37 68 49" : "M28 58 Q44 70 60 58");
  if (kind === "lift") art = `<circle cx="44" cy="34" r="19" fill="none" stroke="currentColor" stroke-width="3"/>` +
    line(`M64 24 L${69 + index * 5} ${20 - index * 3} M64 45 L${69 + index * 5} ${49 + index * 3}`);
  return `<svg viewBox="0 0 88 70" aria-hidden="true" focusable="false">${art}</svg>`;
}
function makeChoice(option, checked, type, name) {
  const label = document.createElement("label");
  label.className = "choice" + (option.graphic ? " choice-illustrated" : "");
  const input = document.createElement("input");
  input.type = type; input.name = name; input.value = option.key; input.checked = checked;
  const face = document.createElement("span");
  face.className = "choice-face";
  if (option.graphic) {
    const art = document.createElement("span");
    art.className = "choice-graphic";
    art.innerHTML = graphicSvg(option.graphic, option.key);
    face.append(art);
  }
  const text = document.createElement("span");
  text.className = "choice-copy";
  const labelText = document.createElement("strong");
  labelText.textContent = option.label;
  text.append(labelText);
  if (option.caption) {
    const caption = document.createElement("small");
    caption.textContent = option.caption;
    text.append(caption);
  }
  face.append(text);
  label.append(input, face);
  return label;
}
function showStep(number) {
  ["start", "details", "result"].forEach((name, index) => { $(`#step-${name}`).hidden = index + 1 !== number; });
  document.querySelectorAll("[data-step-indicator]").forEach((item) => {
    const current = Number(item.dataset.stepIndicator) === number;
    item.classList.toggle("is-current", current);
    if (current) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  $(`#step-${["start", "details", "result"][number-1]} h1`).focus({preventScroll:true});
}
function renderAll() { renderDetails(); renderAvoids(); }
function setPanel(key) {
  openPanel = openPanel === key ? "" : key;
  renderAll();
  document.querySelector(`[data-panel="${key}"]`)?.focus();
}
function renderDetails() {
  const container = $("#detail-groups");
  container.replaceChildren();
  $("#selection-summary").textContent = `${state.gender === "male" ? "남성" : "여성"} · ${["cut","perm","downperm"].filter((id) => state.services.has(id)).map((id) => serviceNames[id]).join(" + ")}`;
  for (const service of ["cut", "perm", "downperm"]) {
    if (!state.services.has(service)) continue;
    const card = document.createElement("section"); card.className = "card service-card";
    const title = document.createElement("h2"); title.textContent = `${serviceNames[service]} 요청`; card.append(title);
    for (const def of detailDefinitions().filter((item) => item.service === service)) {
      const panel = document.createElement("div"); panel.className = "detail-block";
      const top = document.createElement("div"); top.className = "detail-top";
      const heading = document.createElement("h3"); heading.textContent = def.title;
      const option = selectedOption(def);
      const value = document.createElement("span"); value.className = "detail-summary";
      value.textContent = option ? (def.id === "style" && option.key === "custom" ? styleText() || "직접 입력 중" : option.label) : "선택하지 않음";
      const toggle = document.createElement("button");
      toggle.type = "button"; toggle.className = "detail-toggle";
      toggle.textContent = openPanel === `detail-${def.id}` ? "접기" : option ? "변경" : "선택하기";
      toggle.dataset.panel = `detail-${def.id}`;
      toggle.setAttribute("aria-expanded", String(openPanel === `detail-${def.id}`));
      toggle.setAttribute("aria-controls", `detail-${def.id}`);
      toggle.addEventListener("click", () => setPanel(`detail-${def.id}`));
      top.append(heading, value, toggle);
      if (option && option.key !== "unknown") {
        const priority = document.createElement("button"); priority.type = "button";
        priority.className = "priority-toggle";
        priority.textContent = state.details[def.id]?.priority === "must" ? "꼭 전달 ✓" : "꼭 전달";
        priority.setAttribute("aria-pressed", String(state.details[def.id]?.priority === "must"));
        priority.addEventListener("click", () => {
          const stored = state.details[def.id] || {};
          stored.priority = stored.priority === "must" ? "soft" : "must";
          state.details[def.id] = stored;
          priority.textContent = stored.priority === "must" ? "꼭 전달 ✓" : "꼭 전달";
          priority.setAttribute("aria-pressed", String(stored.priority === "must"));
        });
        top.append(priority);
      }
      panel.append(top);
      const body = document.createElement("div"); body.id = `detail-${def.id}`;
      body.className = "detail-body"; body.hidden = openPanel !== `detail-${def.id}`;
      const choices = document.createElement("div"); choices.className = "choice-grid two";
      for (const entry of def.options) {
        const current = def.id === "style" ? state.style : state.details[def.id]?.value;
        const item = makeChoice(entry, current === entry.key, "radio", `detail-${def.id}`);
        item.querySelector("input").addEventListener("change", () => {
          if (def.id === "style") state.style = entry.key;
          state.details[def.id] = {...state.details[def.id], value:entry.key, priority:state.details[def.id]?.priority || "soft"};
          openPanel = entry.key === "custom" ? `detail-${def.id}` : "";
          renderAll();
          if (entry.key === "custom") $("#custom-style")?.focus();
          else document.querySelector(`[data-panel="detail-${def.id}"]`)?.focus();
        });
        choices.append(item);
      }
      body.append(choices);
      if (def.id === "style" && state.style === "custom") {
        const wrap = document.createElement("div"); wrap.className = "inline-field";
        const label = document.createElement("label"); label.htmlFor = "custom-style"; label.textContent = "원하는 헤어스타일을 적어주세요";
        const input = document.createElement("input"); input.type = "text"; input.id = "custom-style";
        input.maxLength = 80; input.value = state.customStyle;
        input.addEventListener("input", () => { state.customStyle = input.value; value.textContent = input.value.trim() || "직접 입력 중"; });
        const done = document.createElement("button"); done.type = "button"; done.className = "button button-secondary"; done.textContent = "선택 완료";
        done.addEventListener("click", () => { if (!input.value.trim()) { input.focus(); return; } openPanel = ""; renderAll(); document.querySelector('[data-panel="detail-style"]')?.focus(); });
        wrap.append(label, input, done); body.append(wrap);
      }
      panel.append(body); card.append(panel);
    }
    container.append(card);
  }
}
function renderAvoids() {
  const container = $("#avoid-groups"); container.replaceChildren();
  for (const group of availableAvoidGroups()) {
    const panel = document.createElement("div"); panel.className = "detail-block";
    const top = document.createElement("div"); top.className = "detail-top";
    const heading = document.createElement("h3"); heading.textContent = group.title;
    const summary = document.createElement("span"); summary.className = "detail-summary";
    const chosen = group.items.filter((item) => state.avoids.has(item.id));
    summary.textContent = chosen.length ? chosen.map((item) => item.label).join(" · ") : "선택하지 않음";
    const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "detail-toggle";
    toggle.textContent = openPanel === `avoid-${group.id}` ? "접기" : chosen.length ? "변경" : "선택하기";
    toggle.dataset.panel = `avoid-${group.id}`;
    toggle.setAttribute("aria-expanded", String(openPanel === `avoid-${group.id}`));
    toggle.setAttribute("aria-controls", `avoid-${group.id}`);
    toggle.addEventListener("click", () => setPanel(`avoid-${group.id}`));
    top.append(heading, summary, toggle); panel.append(top);
    const body = document.createElement("div"); body.id = `avoid-${group.id}`;
    body.className = "detail-body"; body.hidden = openPanel !== `avoid-${group.id}`;
    const choices = document.createElement("div"); choices.className = "choice-grid one";
    for (const item of group.items) {
      const entry = makeChoice({key:item.id, label:item.label}, state.avoids.has(item.id), "checkbox", `avoid-${group.id}`);
      entry.querySelector("input").addEventListener("change", (event) => {
        if (event.target.checked) state.avoids.add(item.id); else state.avoids.delete(item.id);
        summary.textContent = group.items.filter((candidate) => state.avoids.has(candidate.id)).map((candidate) => candidate.label).join(" · ") || "선택하지 않음";
      });
      choices.append(entry);
    }
    body.append(choices);
    const done = document.createElement("button"); done.type = "button"; done.className = "button button-secondary"; done.textContent = "선택 완료";
    done.addEventListener("click", () => { openPanel = ""; renderAll(); document.querySelector(`[data-panel="avoid-${group.id}"]`)?.focus(); });
    body.append(done); panel.append(body); container.append(panel);
  }
}
function resultData() {
  const defs = detailDefinitions();
  const picked = Object.fromEntries(defs.map((def) => [def.id, selectedOption(def)]));
  const selectedAvoids = availableAvoids().filter((item) => state.avoids.has(item.id));
  const sentences = [];
  const important = [];
  const usedAvoids = new Set();
  const style = styleText();
  if (state.services.has("cut")) {
    const cutIntro = style ? `커트는 ${style}${particle(style)} 정리하고 싶어요.` : "커트를 하고 싶어요.";
    sentences.push(cutIntro);
    if (state.details.style?.priority === "must" && style) important.push(cutIntro);
  }
  if (state.services.has("perm")) sentences.push(state.services.has("cut") ? "펌도 함께 하고 싶어요." : "펌을 하고 싶어요.");
  if (state.services.has("downperm")) sentences.push(state.services.has("cut") || state.services.has("perm") ? "다운펌도 함께 하고 싶어요." : "다운펌을 하고 싶어요.");
  const add = (id, speech) => {
    if (!speech) return;
    const related = selectedAvoids.find((item) => item.topic === id && !usedAvoids.has(item.id));
    const combined = related && speech.endsWith("주세요.") && !speech.endsWith("말아주세요.") ? speech.slice(0, -4) + "주시고, " + related.short : speech;
    if (related && combined !== speech) usedAvoids.add(related.id);
    sentences.push(combined);
    if (state.details[id]?.priority === "must") important.push(speech);
  };
  if (picked.photoFeel) add("photoFeel", picked.photoFeel.speech);
  for (const id of ["cutLength","frontShape","side","back","layers","thinning","twoBlock","faceLine","permArea"]) add(id, picked[id]?.speech);
  const curl = picked.curlSize && picked.curlStrength ? `${picked.curlSize.speech}이 ${picked.curlStrength.speech} 해주세요.` :
    picked.curlSize ? `${picked.curlSize.speech}로 해주세요.` : picked.curlStrength ? `컬이 ${picked.curlStrength.speech} 해주세요.` : "";
  add("curlSize", curl);
  if (state.details.curlStrength?.priority === "must" && curl) important.push(curl);
  const volume = picked.volumePosition && picked.volumeLevel ? `${picked.volumePosition.speech} 볼륨은 ${picked.volumeLevel.speech}` :
    picked.volumePosition ? `${picked.volumePosition.speech} 볼륨을 살려주세요.` : picked.volumeLevel ? `볼륨은 ${picked.volumeLevel.speech}` : "";
  add("volumePosition", volume);
  if (state.details.volumeLevel?.priority === "must" && volume) important.push(volume);
  for (const id of ["downArea","downStrength","sideLift"]) add(id, picked[id]?.speech);
  for (const item of selectedAvoids) if (!usedAvoids.has(item.id)) sentences.push(item.speech);
  const memo = state.memo.trim();
  if (memo) sentences.push(memo);
  return {speech:sentences.join(" ").replace(/[ \t]+/g, " ").trim(), important:[...new Set(important)], avoids:selectedAvoids.map((item) => item.speech), memo};
}
function fillList(sectionId, listId, values) {
  const section = $(sectionId); section.hidden = values.length === 0;
  const list = $(listId); list.replaceChildren();
  for (const value of values) { const li = document.createElement("li"); li.textContent = value; list.append(li); }
}
function renderResult() {
  const data = resultData();
  $("#result-speech").textContent = data.speech;
  fillList("#result-important-section", "#result-important", data.important);
  fillList("#result-avoid-section", "#result-avoid", data.avoids);
  $("#result-memo-section").hidden = !data.memo;
  $("#result-memo").textContent = data.memo;
  $("#result-photo-section").hidden = !state.photoUrl;
  if (state.photoUrl) $("#result-photo").src = state.photoUrl; else $("#result-photo").removeAttribute("src");
  $("#action-status").textContent = "";
}
function clearPhoto() {
  if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
  state.photoUrl = "";
  state.photoName = "";
  $("#photo-input").value = "";
  $("#photo-preview").removeAttribute("src");
  $("#photo-preview-wrap").hidden = true;
  $("#result-photo").removeAttribute("src");
}

function handlePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const validType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  const validExt = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!validType || !validExt || file.size > 15 * 1024 * 1024) {
    event.target.value = "";
    $("#start-error").textContent = "JPEG, PNG, WebP 파일 한 장을 15MB 이하로 선택해 주세요. HEIC·HEIF 사진은 JPEG로 변환해 주세요.";
    $("#start-error").hidden = false;
    return;
  }
  const candidate = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    clearPhoto();
    state.photoUrl = candidate;
    state.photoName = file.name;
    $("#photo-preview").src = candidate;
    $("#photo-name").textContent = file.name;
    $("#photo-preview-wrap").hidden = false;
    $("#photo-clear").hidden = false;
    $("#start-error").hidden = true;
  };
  image.onerror = () => {
    URL.revokeObjectURL(candidate);
    event.target.value = "";
    $("#start-error").textContent = "이 사진을 열 수 없어요. JPEG, PNG, WebP 파일을 다시 선택해 주세요.";
    $("#start-error").hidden = false;
  };
  image.src = candidate;
}

async function copySpeech() {
  const speech = resultData().speech;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(speech);
    else {
      const field = document.createElement("textarea");
      field.value = speech;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const success = document.execCommand("copy");
      field.remove();
      if (!success) throw new Error("copy failed");
    }
    $("#action-status").textContent = "문장을 복사했어요.";
  } catch {
    $("#action-status").textContent = "복사하지 못했어요. 요청문을 길게 눌러 직접 복사해 주세요.";
  }
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph) { lines.push(""); continue; }
    let line = "";
    for (const word of paragraph.split(/(\s+)/)) {
      if (!word) continue;
      if (ctx.measureText(line + word).width <= maxWidth) { line += word; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ""; }
      if (!word.trim()) continue;
      if (ctx.measureText(word).width <= maxWidth) { line = word; continue; }
      for (const char of word) {
        if (ctx.measureText(line + char).width > maxWidth && line) { lines.push(line); line = char; }
        else line += char;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

function saveImage() {
  try {
    const data = resultData();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    const width = 1080, pad = 82, contentWidth = width - pad * 2;
    ctx.font = '42px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    const speechLines = wrapText(ctx, data.speech, contentWidth);
    const blocks = [];
    const addBlock = (heading, values) => {
      if (!values.length) return;
      ctx.font = '30px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
      const lines = values.flatMap((value) => wrapText(ctx, value, contentWidth - 26));
      blocks.push({heading, lines});
    };
    addBlock("꼭 말할 내용", data.important);
    addBlock("피하고 싶은 부분", data.avoids);
    if (data.memo) addBlock("추가 메모", [data.memo]);
    const speechHeight = speechLines.length * 64;
    const blocksHeight = blocks.reduce((sum, block) => sum + 142 + block.lines.length * 47, 0);
    canvas.width = width;
    canvas.height = Math.max(720, 308 + speechHeight + blocksHeight + 82);
    ctx.fillStyle = "#0d1110";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let y = 104;
    ctx.fillStyle = "#dfc483";
    ctx.font = "bold 28px Georgia, serif";
    ctx.fillText("SSAEIR", pad, y);
    y += 76;
    ctx.fillStyle = "#f5f4ed";
    ctx.font = 'bold 43px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillText("미용실에서 이렇게 말해볼까요?", pad, y);
    y += 70;
    ctx.fillStyle = "#f4dc9d";
    ctx.font = 'bold 30px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillText("말하기 편한 요청문", pad, y);
    y += 58;
    ctx.fillStyle = "#ffffff";
    ctx.font = '42px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    speechLines.forEach((line) => { if (line) ctx.fillText(line, pad, y); y += 64; });
    for (const block of blocks) {
      y += 44;
      ctx.strokeStyle = "#52705a";
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(width-pad, y); ctx.stroke();
      y += 52;
      ctx.fillStyle = "#f4dc9d";
      ctx.font = 'bold 30px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
      ctx.fillText(block.heading, pad, y);
      y += 46;
      ctx.fillStyle = "#f5f4ed";
      ctx.font = '30px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
      block.lines.forEach((line) => { if (line) ctx.fillText(line, pad + 12, y); y += 47; });
    }
    const link = document.createElement("a");
    link.download = "ssaeir-request.png";
    link.href = canvas.toDataURL("image/png");
    document.body.append(link);
    link.click();
    link.remove();
    $("#action-status").textContent = "사진을 제외한 결과 이미지 다운로드를 시작했어요. 실제 저장 여부는 브라우저에서 확인해 주세요.";
  } catch {
    $("#action-status").textContent = "이미지를 저장하지 못했어요. 다른 브라우저에서 다시 시도해 주세요.";
  }
}

function resetStyleState() {
  state.style = "";
  state.customStyle = "";
  state.details = {};
  state.avoids.clear();
  state.memo = "";
  $("#memo").value = "";
  openPanel = "";
  $("#result-speech").textContent = "";
  $("#action-status").textContent = "";
  for (const id of ["result-important-section","result-avoid-section","result-memo-section","result-photo-section"]) $("#" + id).hidden = true;
}
function resetAll() {
  clearPhoto();
  state.gender = "";
  state.services.clear();
  resetStyleState();
  previousContext = "";
  document.querySelectorAll('#gender-choices input, #service-choices input').forEach((input) => { input.checked = false; });
  $("#start-error").hidden = true;
  showStep(1);
}
function confirmReset(message, action) { if (window.confirm(message)) action(); }

document.querySelectorAll('#gender-choices input').forEach((input) => input.addEventListener("change", () => { state.gender = input.value; }));
document.querySelectorAll('#service-choices input').forEach((input) => input.addEventListener("change", () => {
  if (input.checked) state.services.add(input.value); else state.services.delete(input.value);
}));
$("#photo-input").addEventListener("change", handlePhoto);
$("#photo-clear").addEventListener("click", () => { clearPhoto(); $("#start-error").hidden = true; });
$("#start-reset").addEventListener("click", () => confirmReset("사진과 모든 선택 내용을 지우고 처음부터 다시 하시겠어요?", resetAll));
$("#start-next").addEventListener("click", () => {
  if (!state.gender || !state.services.size) {
    $("#start-error").textContent = "성별과 시술을 골라주세요.";
    $("#start-error").hidden = false;
    return;
  }
  $("#start-error").hidden = true;
  const context = `${state.gender}:${[...state.services].sort().join(",")}`;
  if (previousContext && previousContext !== context) resetStyleState();
  previousContext = context;
  renderAll();
  showStep(2);
});
$("#memo").addEventListener("input", (event) => { state.memo = event.target.value; });
$("#details-reset").addEventListener("click", () => confirmReset("스타일 선택, 피하고 싶은 부분, 메모와 중요도를 지우시겠어요? 성별·시술·사진은 유지됩니다.", () => {
  resetStyleState(); renderAll(); showStep(2);
}));
$("#details-back").addEventListener("click", () => showStep(1));
$("#details-next").addEventListener("click", () => {
  const data = resultData();
  if (!data.speech) return;
  renderResult();
  showStep(3);
});
$("#result-edit").addEventListener("click", () => { renderAll(); showStep(2); });
$("#result-reset").addEventListener("click", () => confirmReset("사진과 모든 선택 내용을 지우고 새 요청서를 만드시겠어요?", resetAll));
$("#result-copy").addEventListener("click", copySpeech);
$("#result-save").addEventListener("click", saveImage);
window.addEventListener("pagehide", clearPhoto);