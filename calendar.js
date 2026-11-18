"use strict";
(() => {
  const source = window.EVENT_CALENDAR_DATA || { parents: [], children: [] };
  const parents = (source.parents || []).filter(p => p && typeof p.id === "string" && typeof p.name === "string");
  const byParentId = new Map(parents.map(p => [p.id, p]));
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const dateMs = s => Date.parse(`${s}T00:00:00Z`);
  const validDate = s => {
    if (typeof s !== "string" || !datePattern.test(s)) return false;
    const time = dateMs(s);
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === s;
  };
  const children = (source.children || []).filter(c => c && byParentId.has(c.parentId) && validDate(c.startDate) && validDate(c.endDate) && dateMs(c.startDate) <= dateMs(c.endDate) && typeof c.title === "string");
  const pad = n => String(n).padStart(2, "0");
  const keyUTC = date => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const addDays = (key, count) => keyUTC(new Date(dateMs(key) + count * 86400000));
  const monthKey = (y, m) => `${y}-${pad(m)}`;
  const todayDate = new Date();
  const todayKey = `${todayDate.getFullYear()}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}`;
  let year = todayDate.getFullYear();
  let month = todayDate.getMonth() + 1;
  let activeParent = "all";
  let lastFocus = null;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt !== undefined) n.textContent = String(txt); return n; };
  const displayColor = parent => /^#[0-9a-f]{6}$/i.test(parent.color || "") ? parent.color : "#627da1";
  const dateLabel = key => { const [y, m, d] = key.split("-").map(Number); return `${m}/${d}`; };
  const fullDateLabel = key => { const [y, m, d] = key.split("-").map(Number); return `${y}年${m}月${d}日`; };
  const childDateLabel = c => {
    const range = c.startDate === c.endDate ? fullDateLabel(c.startDate) : `${fullDateLabel(c.startDate)}〜${fullDateLabel(c.endDate)}`;
    return range + (c.startTime ? `  ${c.startTime}${c.endTime ? `〜${c.endTime}` : ""}` : "");
  };
  const conciseDate = c => dateLabel(c.startDate) + (c.endDate !== c.startDate ? `〜${dateLabel(c.endDate)}` : "") + (c.startTime ? ` ${c.startTime}` : "");
  const startOfMonth = () => `${year}-${pad(month)}-01`;
  const nextMonthStart = () => month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  const monthEnd = () => addDays(nextMonthStart(), -1);
  const overlaps = (c, a, b) => c.startDate <= b && c.endDate >= a;
  const sortedChildren = arr => [...arr].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate) || a.title.localeCompare(b.title, "ja"));
  const visibleChildren = () => children.filter(c => activeParent === "all" || c.parentId === activeParent);

  function showModal(title, tag) {
    lastFocus = document.activeElement;
    $("modalTitle").textContent = title;
    $("modalTag").textContent = tag;
    $("modalContent").replaceChildren();
    $("modal").hidden = false;
    document.body.style.overflow = "hidden";
    $("closeModal").focus();
  }
  function closeModal() {
    if ($("modal").hidden) return;
    $("modal").hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.isConnected && typeof lastFocus.focus === "function") lastFocus.focus();
  }
  function modalSection(heading, content) {
    const section = el("section", "modal-section");
    section.append(el("h3", "", heading));
    if (typeof content === "string") section.append(el("p", "", content));
    else section.append(content);
    $("modalContent").append(section);
  }
  function openParent(parentId) {
    const p = byParentId.get(parentId);
    if (!p) return;
    showModal(p.name, "親イベント");
    modalSection("イベント概要", p.description || "説明は登録されていません。");
    const list = el("div", "modal-event-list");
    const associated = sortedChildren(children.filter(c => c.parentId === parentId));
    if (!associated.length) list.append(el("p", "", "登録された日程はありません。"));
    for (const c of associated) {
      const item = el("div", "modal-event");
      item.append(el("strong", "", c.title), el("span", "", childDateLabel(c)));
      list.append(item);
    }
    modalSection("関連する日程", list);
  }
  function openChild(childId) {
    const c = children.find(item => item.id === childId);
    if (!c) return;
    const p = byParentId.get(c.parentId);
    showModal(c.title, "子イベント");
    modalSection("日時", childDateLabel(c));
    if (c.description) modalSection("詳細", c.description);
    const go = el("button", "modal-parent-button", `親イベント「${p.name}」の詳細を見る`);
    go.type = "button";
    go.addEventListener("click", () => openParent(p.id));
    $("modalContent").append(go);
  }
  function openDay(dayKey) {
    const items = sortedChildren(visibleChildren().filter(c => c.startDate <= dayKey && c.endDate >= dayKey));
    showModal(`${fullDateLabel(dayKey)}の予定`, "日別イベント一覧");
    const list = el("div", "modal-event-list");
    for (const c of items) {
      const p = byParentId.get(c.parentId);
      const btn = el("button", "modal-event");
      btn.type = "button"; btn.style.color = "inherit"; btn.style.textAlign = "left"; btn.style.cursor = "pointer";
      btn.append(el("strong", "", c.title), el("span", "", `${p.name} · ${childDateLabel(c)}`));
      btn.addEventListener("click", () => openChild(c.id));
      list.append(btn);
    }
    modalSection("登録されている予定", list);
  }
  function drawFilters() {
    const host = $("filters"); host.replaceChildren();
    const options = [{id:"all", name:"すべて"}, ...parents];
    for (const p of options) {
      const btn = el("button", "chip"); btn.type = "button";
      btn.setAttribute("aria-pressed", String(activeParent === p.id));
      if (p.id !== "all") { const dot = el("span", "chip-dot"); dot.style.setProperty("--dot", displayColor(p)); btn.append(dot); }
      btn.append(document.createTextNode(p.name));
      btn.addEventListener("click", () => { activeParent = p.id; render(); });
      host.append(btn);
    }
  }
  function drawCalendar() {
    $("monthTitle").textContent = `${year}年${month}月`;
    $("monthPicker").value = monthKey(year, month);
    const first = startOfMonth();
    const last = monthEnd();
    const mondayOffset = (new Date(dateMs(first)).getUTCDay() + 6) % 7;
    const gridStart = addDays(first, -mondayOffset);
    const lastDow = (new Date(dateMs(last)).getUTCDay() + 6) % 7;
    const gridEnd = addDays(last, 6 - lastDow);
    const host = $("calendarWeeks"); host.replaceChildren();
    let current = gridStart;
    while (current <= gridEnd) {
      const weekStart = current, weekEnd = addDays(weekStart, 6);
      const week = el("section", "week");
      const dayRow = el("div", "week-days");
      for (let i = 0; i < 7; i++) {
        const dayKey = addDays(weekStart, i);
        const dayNumber = Number(dayKey.slice(-2));
        const btn = el("button", "day-button"); btn.type = "button";
        if (dayKey.slice(0, 7) !== monthKey(year, month)) btn.classList.add("is-outside");
        if (i === 5) btn.classList.add("is-sat");
        if (i === 6) btn.classList.add("is-sun");
        if (dayKey === todayKey) btn.classList.add("is-today");
        btn.setAttribute("aria-label", `${fullDateLabel(dayKey)}の予定を見る`);
        btn.append(el("span", "number", dayNumber));
        btn.addEventListener("click", () => openDay(dayKey));
        dayRow.append(btn);
      }
      week.append(dayRow);
      const lanes = el("div", "event-lanes");
      const events = visibleChildren().filter(c => overlaps(c, weekStart, weekEnd));
      // 長い期間の予定を先に並べ、可能な限り横長の帯を作る
      events.sort((a,b) => a.startDate.localeCompare(b.startDate) || (dateMs(b.endDate) - dateMs(b.startDate)) - (dateMs(a.endDate) - dateMs(a.startDate)) || a.title.localeCompare(b.title,"ja"));
      const rows = [];
      const hiddenPerDay = [0,0,0,0,0,0,0];
      const MAX_ROWS = 4;
      for (const c of events) {
        const start = Math.max(0, Math.round((dateMs(c.startDate) - dateMs(weekStart)) / 86400000));
        const end = Math.min(6, Math.round((dateMs(c.endDate) - dateMs(weekStart)) / 86400000));
        let r = 0;
        while (r < rows.length && rows[r].some((taken, d) => d >= start && d <= end && taken)) r++;
        if (r >= MAX_ROWS) { for (let d = start; d <= end; d++) hiddenPerDay[d]++; continue; }
        if (!rows[r]) rows[r] = Array(7).fill(false);
        for (let d = start; d <= end; d++) rows[r][d] = true;
        const p = byParentId.get(c.parentId);
        const btn = el("button", "event-bar", c.title); btn.type = "button";
        btn.style.setProperty("--event-color", displayColor(p));
        btn.style.gridColumn = `${start + 1} / ${end + 2}`;
        btn.style.gridRow = String(r + 1);
        if (c.startDate < weekStart) btn.classList.add("is-continued");
        if (c.endDate > weekEnd) btn.classList.add("is-continuing");
        btn.title = `${c.title}：${childDateLabel(c)}`;
        btn.setAttribute("aria-label", `${c.title}：${childDateLabel(c)}の詳細を見る`);
        btn.addEventListener("click", () => openChild(c.id));
        lanes.append(btn);
      }
      if (hiddenPerDay.some(Boolean)) {
        for (let d = 0; d < 7; d++) {
          if (!hiddenPerDay[d]) continue;
          const date = addDays(weekStart, d);
          const btn = el("button", "more-button", `+${hiddenPerDay[d]}件`);
          btn.type = "button"; btn.style.gridColumn = String(d + 1); btn.style.gridRow = String(MAX_ROWS + 1);
          btn.setAttribute("aria-label", `${fullDateLabel(date)}の追加の予定 ${hiddenPerDay[d]}件を見る`);
          btn.addEventListener("click", () => openDay(date));
          lanes.append(btn);
        }
      }
      week.append(lanes); host.append(week);
      current = addDays(current, 7);
    }
  }
  function drawList() {
    const min = startOfMonth(), max = monthEnd();
    const current = sortedChildren(visibleChildren().filter(c => overlaps(c, min, max)));
    const grouped = parents.map(p => ({p, events:current.filter(c => c.parentId === p.id)})).filter(g => g.events.length);
    grouped.sort((a,b) => a.events[0].startDate.localeCompare(b.events[0].startDate));
    const host = $("monthList"); host.replaceChildren();
    $("eventCount").textContent = `${current.length} 件`;
    $("listTitle").textContent = `${month}月のイベント一覧`;
    if (!grouped.length) { host.append(el("div", "empty-list", "この月の予定はまだありません。")); return; }
    for (const {p, events} of grouped) {
      const card = el("article", "group-card");
      const head = el("button", "group-head"); head.type = "button";
      const accent = el("span", "group-accent"); accent.style.setProperty("--group-color",displayColor(p));
      const info = el("span", "group-info");
      info.append(el("span", "group-name", p.name));
      const description = el("div", "group-desc", p.description || "イベント概要を見る");
      info.append(description);
      head.append(accent, info, el("span", "group-arrow", "›"));
      head.setAttribute("aria-label", `${p.name}の概要を見る`);
      head.addEventListener("click", () => openParent(p.id));
      card.append(head);
      const list = el("div", "child-list");
      for (const c of events) {
        const row = el("button", "child-row"); row.type = "button";
        row.append(el("span", "child-date", conciseDate(c)), el("span", "child-title", c.title), el("span", "child-arrow", "›"));
        row.addEventListener("click", () => openChild(c.id));
        list.append(row);
      }
      card.append(list); host.append(card);
    }
  }
  function setMonth(y, m) {
    if (!Number.isInteger(y) || !Number.isInteger(m)) return;
    const dt = new Date(Date.UTC(y, m - 1, 1));
    year = dt.getUTCFullYear(); month = dt.getUTCMonth() + 1;
    render();
  }
  function render() { drawFilters(); drawCalendar(); drawList(); }
  $("prevMonth").addEventListener("click", () => setMonth(year, month - 1));
  $("nextMonth").addEventListener("click", () => setMonth(year, month + 1));
  $("goToday").addEventListener("click", () => setMonth(todayDate.getFullYear(), todayDate.getMonth() + 1));
  $("monthPicker").addEventListener("change", e => {
    if (/^\d{4}-\d{2}$/.test(e.target.value)) {
      const [y,m] = e.target.value.split("-").map(Number); setMonth(y,m);
    }
  });
  $("closeModal").addEventListener("click", closeModal);
  $("modal").addEventListener("click", e => { if (e.target.hasAttribute("data-close")) closeModal(); });
  document.addEventListener("keydown", e => {
    if ($("modal").hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const controls = [...$("modal").querySelectorAll("button:not([disabled])")];
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length-1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  render();
})();
