"use strict";

// 모든 작성 내용은 이 페이지의 메모리에만 둡니다.
const state = {
  gender: "", services: new Set(), photoUrl: "", photoName: "",
  style: "", customStyle: "", details: {}, avoids: new Set(), memo: ""
};

const $ = (selector) => document.querySelector(selector);
let requestStarted = false;
let requestCompleted = false;
const trackEvent = (name) => window.SSAEIR_ANALYTICS?.track(name);
const serviceNames = {cut: "커트", perm: "펌", downperm: "다운펌"};
const styles = {
  male: ["댄디컷", "크롭컷", "아이비리그컷", "리프컷"],
  female: ["숏컷", "보브컷", "태슬컷", "레이어드컷", "허쉬컷"]
};
const sharedStyles = ["아직 잘 모르겠어요", "직접 입력할게요"];
const avoidItems = [
  {id:"shortAll", label:"전체 길이가 너무 짧아지는 것은 싫어요", services:["cut"]},
  {id:"shortFront", label:"앞머리가 너무 짧아지는 것은 싫어요", services:["cut"]},
  {id:"shortSide", label:"옆머리·귀 주변이 너무 짧아지는 것은 싫어요", services:["cut"]},
  {id:"thinTooMuch", label:"숱을 너무 많이 줄이지 않았으면 좋겠어요", services:["cut"]},
  {id:"shortBack", label:"뒷머리를 높게 올려 짧게 자르지 않았으면 좋겠어요", services:["cut"]},
  {id:"layersTooMuch", label:"층을 너무 많이 넣지 않았으면 좋겠어요", services:["cut"]},
  {id:"curlTooStrong", label:"컬이 너무 강하지 않았으면 좋겠어요", services:["perm"]},
  {id:"volumeTooBig", label:"볼륨이 너무 크지 않았으면 좋겠어요", services:["perm"]}
];

function detailDefinitions() {
  const photo = Boolean(state.photoUrl);
  const defs = [];
  const add = (id, title, choices, lead, service, direct = false) => {
    if (state.services.has(service)) defs.push({id,title,choices,lead,direct});
  };
  if (photo) defs.push({id:"feel", title:"전체적인 느낌", choices:["사진처럼", "비슷한 느낌만"], lead:"전체적인 느낌은", direct:false});
  if (state.services.has("cut")) {
    if (photo) {
      const length = ["사진처럼", "사진보다 조금 길게", "사진보다 조금 짧게", "상담 후 결정"];
      ["앞머리", "옆머리", "뒷머리", "전체 길이"].forEach((title, index) => add(["front", "side", "back", "length"][index], title, length, `${title}는`, "cut"));
      add("layers", "층", ["사진처럼", "사진보다 적게", "사진보다 많이", "상담 후 결정"], "층은", "cut");
    } else {
      add("length", "전체 길이", ["조금만 다듬기", "확실히 짧게", "기르는 중이라 최소한만", "상담 후 결정"], "전체 길이는", "cut");
      add("front", "앞머리", ["현재 길이 유지", "눈썹 위까지", "눈썹 정도까지", "눈썹 아래로", "상담 후 결정"], "앞머리는", "cut");
      add("side", "옆머리", ["귀가 드러나게", "귀를 일부 덮게", "귀를 덮는 길이로", "상담 후 결정"], "옆머리는", "cut");
      add("back", "뒷머리", ["현재 길이 유지", "목덜미가 드러나게", "목덜미를 덮게", "상담 후 결정"], "뒷머리는", "cut");
      add("layers", "층", ["거의 없이", "조금만", "충분히", "상담 후 결정"], "층은", "cut");
    }
    add("thinning", "숱 정리", ["조금만", "적당히", "많이", "상담 후 결정"], "숱은", "cut");
    add("twoBlock", "투블럭", ["투블럭으로 하기", "투블럭 여부 상담 후 결정"], "투블럭은", "cut");
    if (photo) add("styling", "손질", ["사진처럼 스타일링하는 방법 알고 싶음", "평소 손질하기 쉽게"], "손질은", "cut");
  }
  if (state.services.has("perm")) {
    add("curlSize", "컬 크기", photo ? ["사진처럼", "사진보다 크게", "사진보다 작게", "상담 후 결정"] : ["큰 컬", "중간 컬", "작은 컬", "상담 후 결정"], "컬 크기는", "perm");
    add("curlStrength", "컬 강도", photo ? ["사진처럼", "사진보다 약하게", "사진보다 강하게", "상담 후 결정"] : ["은은하게", "적당히", "뚜렷하게", "상담 후 결정"], "컬 강도는", "perm");
    add("volume", "볼륨", photo ? ["사진처럼", "사진보다 줄이기", "사진보다 살리기", "상담 후 결정"] : ["자연스럽게", "충분히 살리기", "줄이기", "상담 후 결정"], "볼륨은", "perm");
    add("permArea", "펌을 적용할 부분", ["전체", "앞머리", "옆머리", "뒷머리", "직접 입력", "상담 후 결정"], "펌은", "perm", true);
  }
  if (state.services.has("downperm")) {
    add("downArea", "다운펌 부위", ["옆머리", "뒷머리", "둘 다", "직접 입력", "상담 후 결정"], "다운펌은", "downperm", true);
    add("downStrength", "다운펌 정도", ["자연스럽게 누르기", "최대한 차분하게 누르기", "상담 후 결정"], "다운펌 정도는", "downperm");
  }
  return defs;
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

function makeChoice(value, checked, type, name, labelText = value) {
  const label = document.createElement("label");
  label.className = "choice";
  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.value = value;
  input.checked = checked;
  const span = document.createElement("span");
  span.textContent = labelText;
  label.append(input, span);
  return label;
}

function renderStyle() {
  const card = $("#style-card");
  card.hidden = !state.services.has("cut");
  if (card.hidden) return;
  const container = $("#style-choices");
  container.replaceChildren();
  [...styles[state.gender], ...sharedStyles].forEach((name) => {
    const choice = makeChoice(name, state.style === name, "radio", "style");
    choice.querySelector("input").addEventListener("change", () => {
      state.style = name;
      $("#custom-style-wrap").hidden = name !== "직접 입력할게요";
    });
    container.append(choice);
  });
  $("#custom-style-wrap").hidden = state.style !== "직접 입력할게요";
  $("#custom-style").value = state.customStyle;
}

function renderDetails() {
  const container = $("#detail-groups");
  container.replaceChildren();
  detailDefinitions().forEach((def) => {
    const stored = state.details[def.id] || {open:false, value:"", priority:"soft", direct:""};
    if (stored.value && !def.choices.includes(stored.value)) {
      stored.value = "";
      stored.direct = "";
      state.details[def.id] = stored;
    }
    const block = document.createElement("section");
    block.className = "detail-block";
    const top = document.createElement("div");
    top.className = "detail-top";
    const heading = document.createElement("h3");
    heading.textContent = def.title;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "detail-toggle";
    toggle.textContent = stored.open ? "접기" : "선택하기";
    toggle.setAttribute("aria-expanded", String(stored.open));
    toggle.setAttribute("aria-controls", `detail-${def.id}`);
    top.append(heading, toggle);
    const body = document.createElement("div");
    body.className = "detail-body";
    body.id = `detail-${def.id}`;
    body.hidden = !stored.open;
    const choices = document.createElement("div");
    choices.className = "choice-grid two";
    def.choices.forEach((value) => {
      const choice = makeChoice(value, stored.value === value, "radio", `detail-value-${def.id}`);
      choice.querySelector("input").addEventListener("change", () => {
        state.details[def.id] = {priority:"soft", direct:"", ...state.details[def.id], open:true, value};
        if (directWrap) directWrap.hidden = value !== "직접 입력";
      });
      choices.append(choice);
    });
    body.append(choices);
    let directWrap = null;
    if (def.direct) {
      directWrap = document.createElement("div");
      directWrap.className = "inline-field";
      directWrap.hidden = stored.value !== "직접 입력";
      const label = document.createElement("label");
      label.htmlFor = `direct-${def.id}`;
      label.textContent = "원하는 부분을 적어주세요";
      const input = document.createElement("input");
      input.type = "text";
      input.id = `direct-${def.id}`;
      input.maxLength = 80;
      input.value = stored.direct;
      input.addEventListener("input", () => { state.details[def.id] = {...state.details[def.id], direct:input.value}; });
      directWrap.append(label, input);
      body.append(directWrap);
    }
    const priority = document.createElement("div");
    priority.className = "priority-box";
    const priorityLabel = document.createElement("span");
    priorityLabel.className = "detail-label";
    priorityLabel.textContent = "이 요청은 얼마나 중요하세요?";
    const priorityChoices = document.createElement("div");
    priorityChoices.className = "choice-grid two";
    [["soft", "되도록 반영해주세요"], ["must", "꼭 지켜주세요"]].forEach(([value, label]) => {
      const choice = makeChoice(value, stored.priority === value, "radio", `priority-${def.id}`, label);
      choice.querySelector("input").addEventListener("change", () => { state.details[def.id] = {...state.details[def.id], priority:value}; });
      priorityChoices.append(choice);
    });
    priority.append(priorityLabel, priorityChoices);
    body.append(priority);
    toggle.addEventListener("click", () => {
      const open = body.hidden;
      body.hidden = !open;
      toggle.textContent = open ? "접기" : "선택하기";
      toggle.setAttribute("aria-expanded", String(open));
      state.details[def.id] = {value:"", priority:"soft", direct:"", ...state.details[def.id], open};
    });
    block.append(top, body);
    container.append(block);
  });
}

function renderAvoids() {
  const container = $("#avoid-choices");
  container.replaceChildren();
  avoidItems.filter((item) => item.services.some((service) => state.services.has(service))).forEach((item) => {
    const choice = makeChoice(item.id, state.avoids.has(item.id), "checkbox", `avoid-${item.id}`, item.label);
    choice.querySelector("input").addEventListener("change", (event) => {
      if (event.target.checked) state.avoids.add(item.id); else state.avoids.delete(item.id);
    });
    container.append(choice);
  });
  container.parentElement.hidden = container.childElementCount === 0;
}

function detailPhrase(def, item) {
  const value = item.value;
  if (!value || (value === "직접 입력" && !item.direct.trim())) return "";
  if (def.id === "feel") return value === "사진처럼" ? "전체적인 느낌은 사진처럼 해주세요." : "전체적인 느낌만 사진과 비슷하게 해주세요.";
  if (def.id === "twoBlock") return value === "투블럭으로 하기" ? "투블럭으로 해주세요." : "투블럭으로 할지는 상담 후 정하고 싶어요.";
  if (def.id === "styling") return value === "평소 손질하기 쉽게" ? "평소 손질하기 쉽게 해주세요." : "사진처럼 스타일링하는 방법을 알려주세요.";
  if (def.id === "permArea") return value === "상담 후 결정" ? "펌을 적용할 부분은 상담 후 정하고 싶어요." : `펌은 ${value === "직접 입력" ? item.direct.trim() : value}에 해주세요.`;
  if (def.id === "downArea") return value === "상담 후 결정" ? "다운펌 부위는 상담 후 정하고 싶어요." : `다운펌은 ${value === "직접 입력" ? item.direct.trim() : value === "둘 다" ? "옆머리와 뒷머리" : value}에 해주세요.`;
  if (def.id === "downStrength") return value === "상담 후 결정" ? "다운펌 정도는 상담 후 정하고 싶어요." : `다운펌은 ${value.replace("누르기", "눌러")} 주세요.`;
  if (value === "상담 후 결정") return `${def.lead} 상담 후 정하고 싶어요.`;
  if (def.id === "thinning") return `숱은 ${value} 정리해 주세요.`;
  if (def.id === "curlSize") return `컬 크기는 ${["큰 컬", "중간 컬", "작은 컬"].includes(value) ? value + "로" : value} 해주세요.`;
  if (def.id === "curlStrength") return `컬 강도는 ${value} 해주세요.`;
  if (def.id === "volume") {
    const words = {"충분히 살리기":"충분히 살려주세요", "줄이기":"줄여주세요", "사진보다 줄이기":"사진보다 줄여주세요", "사진보다 살리기":"사진보다 살려주세요"};
    return `볼륨은 ${words[value] || value + " 해주세요"}.`;
  }
  if (def.id === "layers") return value === "거의 없이" ? "층은 거의 넣지 말아주세요." : `층은 ${value} 넣어주세요.`;
  if (def.id === "length") return value === "조금만 다듬기" || value === "기르는 중이라 최소한만" ? `전체 길이는 ${value === "조금만 다듬기" ? "조금만 다듬어 주세요" : "기르는 중이라 최소한만 다듬어 주세요"}.` : `전체 길이는 ${value} 해주세요.`;
  if (["front", "side", "back"].includes(def.id)) return value === "현재 길이 유지" ? `${def.lead} 현재 길이를 유지해 주세요.` : `${def.lead} ${value} 해주세요.`;
  return `${def.lead} ${value} 해주세요.`;
}

function resultData() {
  const chosenServices = ["cut", "perm", "downperm"].filter((id) => state.services.has(id)).map((id) => serviceNames[id]);
  const serviceLine = chosenServices.length === 1
    ? `${chosenServices[0]}${chosenServices[0] === "커트" ? "를" : "을"} 생각하고 있어요.`
    : `${chosenServices.join(", ")}을 함께 생각하고 있어요.`;
  const chosenStyle = state.style === "직접 입력할게요" ? state.customStyle.trim() : state.style === "아직 잘 모르겠어요" ? "" : state.style;
  const last = chosenStyle.slice(-1);
  const syllable = last.charCodeAt(0);
  const finalConsonant = syllable >= 0xac00 && syllable <= 0xd7a3 ? (syllable - 0xac00) % 28 : 0;
  const styleParticle = finalConsonant && finalConsonant !== 8 ? "으로" : "로";
  const styleLine = state.services.has("cut") && chosenStyle ? `헤어스타일은 ${chosenStyle}${styleParticle} 하고 싶어요.` : "";
  const requests = detailDefinitions().map((def) => {
    const item = state.details[def.id];
    if (!item) return null;
    const phrase = detailPhrase(def, item);
    return phrase ? {phrase, priority:item.priority || "soft"} : null;
  }).filter(Boolean);
  const avoids = avoidItems.filter((item) => state.avoids.has(item.id) && item.services.some((service) => state.services.has(service))).map((item) => item.label);
  const intro = [serviceLine, styleLine, ...requests.map((item) => item.priority === "must" ? `특히 ${item.phrase}` : item.phrase)].filter(Boolean).join(" ");
  const speech = [intro, avoids.map((item) => `${item}.`).join(" "), state.memo.trim()].filter(Boolean).join("\n\n");
  return {speech, important:requests.filter((item) => item.priority === "must").map((item) => item.phrase), avoids, memo:state.memo.trim()};
}

function fillList(sectionId, listId, values) {
  const section = $(sectionId);
  section.hidden = values.length === 0;
  const list = $(listId);
  list.replaceChildren();
  values.forEach((value) => { const li = document.createElement("li"); li.textContent = value; list.append(li); });
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
    trackEvent("copy_success");
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
    trackEvent("image_download_triggered");
  } catch {
    $("#action-status").textContent = "이미지를 저장하지 못했어요. 다른 브라우저에서 다시 시도해 주세요.";
  }
}

document.querySelectorAll('#gender-choices input').forEach((input) => input.addEventListener("change", () => {
  state.gender = input.value;
  state.style = "";
  state.customStyle = "";
}));
document.querySelectorAll('#service-choices input').forEach((input) => input.addEventListener("change", () => {
  if (input.checked) state.services.add(input.value); else state.services.delete(input.value);
}));
$("#photo-input").addEventListener("change", handlePhoto);
$("#photo-clear").addEventListener("click", () => { clearPhoto(); $("#start-error").hidden = true; });
$("#start-next").addEventListener("click", () => {
  if (!state.gender || !state.services.size) {
    $("#start-error").textContent = "성별과 시술을 골라주세요.";
    $("#start-error").hidden = false;
    return;
  }
  $("#start-error").hidden = true;
  if (!requestStarted) {
    requestStarted = true;
    trackEvent("request_start");
  }
  renderStyle(); renderDetails(); renderAvoids(); showStep(2);
});
$("#custom-style").addEventListener("input", (event) => { state.customStyle = event.target.value; });
$("#memo").addEventListener("input", (event) => { state.memo = event.target.value; });
$("#details-back").addEventListener("click", () => showStep(1));
$("#details-next").addEventListener("click", () => {
  if (!resultData().speech.trim()) return;
  renderResult();
  showStep(3);
  if (!requestCompleted) {
    requestCompleted = true;
    trackEvent("request_complete");
  }
});
$("#result-edit").addEventListener("click", () => showStep(2));
$("#result-copy").addEventListener("click", copySpeech);
$("#result-save").addEventListener("click", saveImage);
window.addEventListener("pagehide", clearPhoto);
