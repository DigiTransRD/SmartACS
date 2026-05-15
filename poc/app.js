(function () {
  "use strict";

  const views = {
    dashboard: {
      title: "儀表板"
    },
    terminal: {
      title: "終端機管理",
      columns: ["狀態", "編號", "名稱", "類型", "IP 位址", "韌體版本", "終端機組", "待同步"],
      rows: [
        ["online", "172", "公司後門", "RFID 控制器", "192.168.10.72", "2.2.18", "總公司", "0"],
        ["online", "173", "研發人臉機", "人臉辨識機", "192.168.10.73", "5.8.03", "研發大樓", "24"],
        ["warning", "174", "倉儲指紋機", "指紋機", "192.168.20.14", "3.4.11", "倉儲區", "7"],
        ["online", "175", "大門控制器", "RFID 控制器", "192.168.10.75", "2.2.18", "總公司", "0"]
      ]
    },
    personnel: {
      title: "人員資料維護",
      columns: ["啟用", "用戶編號", "工號", "姓名", "卡號", "部門", "群組", "指紋", "人臉"],
      rows: [
        ["online", "10001", "A0001", "陳志明", "0008123441", "總務部", "一般員工", "2", "1"],
        ["online", "10002", "A0002", "林佳蓉", "0008123442", "研發部", "研發門禁", "1", "1"],
        ["warning", "10003", "V0011", "王訪客", "0008123501", "訪客", "臨時通行", "0", "0"],
        ["online", "10004", "S0008", "保全夜班", "0008123609", "保全部", "保全群組", "2", "0"]
      ]
    },
    access: {
      title: "門禁與授權",
      columns: ["門狀態", "門編號", "門名稱", "出入口狀態", "安全機制", "分控器", "所在終端機", "門號索引"],
      rows: [
        ["online", "1", "公司大門", "正常開", "正常", "未找到", "[175] 大門控制器", "1"],
        ["online", "2", "公司後門", "正常關", "正常", "未找到", "[172] 公司後門", "1"],
        ["warning", "3", "研發機房", "正常關", "多重驗證", "在線", "[173] 研發人臉機", "2"],
        ["online", "4", "倉儲側門", "正常關", "時區限制", "在線", "[174] 倉儲指紋機", "1"]
      ]
    },
    report: {
      title: "進出記錄與報表",
      columns: ["日期", "時間", "門", "姓名", "卡號", "事件描述", "方向", "驗證方式", "下載時間"],
      rows: [
        ["online", "2026/05/15", "09:02:18", "公司大門", "陳志明", "0008123441", "正常刷卡", "進", "RFID", "09:02:19"],
        ["online", "2026/05/15", "09:05:46", "研發機房", "林佳蓉", "0008123442", "人臉驗證通過", "進", "Face", "09:05:47"],
        ["warning", "2026/05/15", "09:11:03", "公司後門", "王訪客", "0008123501", "臨時通行", "進", "RFID", "09:11:04"],
        ["danger", "2026/05/15", "09:23:12", "倉儲側門", "未知", "-", "未授權卡片", "進", "RFID", "09:23:13"]
      ]
    },
    system: {
      title: "系統工具與介接",
      columns: ["項目", "狀態", "服務", "目標", "最後執行", "說明"],
      rows: [
        ["online", "資料庫連線", "AbiAsstXpand.Data", "MSSQL", "10:15:20", "Schema AutoFix 正常"],
        ["online", "自動備份", "Local Worker", "D:\\Backup\\SmartACS", "02:00:00", "保留 30 天"],
        ["online", "舊 API 相容層", "Self-host API", "/SomacWeb/*", "10:14:58", "Token 驗證啟用"],
        ["warning", "雲端介接", "MQTT / SignalR", "Cloud Bridge", "10:13:41", "1 筆 LINE 通知待重送"]
      ]
    },
    monitor: {
      title: "即時監控",
      columns: ["狀態", "時間", "來源", "門", "事件", "處置", "操作人"],
      rows: [
        ["online", "10:16:01", "公司大門", "公司大門", "門狀態正常", "記錄", "system"],
        ["online", "10:16:08", "研發人臉機", "研發機房", "人臉通行", "記錄", "system"],
        ["warning", "10:16:34", "倉儲指紋機", "倉儲側門", "設備離線", "通知維運", "system"],
        ["danger", "10:17:02", "公司後門", "公司後門", "門未關逾時", "待確認", "system"]
      ]
    }
  };

  const appShell = document.querySelector(".app-shell");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const viewTitle = document.getElementById("viewTitle");
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");
  const dashboardView = document.getElementById("dashboardView");
  const dataView = document.getElementById("dataView");
  const toolRibbon = document.getElementById("toolRibbon");
  const dialog = document.getElementById("entityDialog");
  const dialogTitle = document.getElementById("dialogTitle");
  const dialogBody = document.getElementById("dialogBody");
  const clockText = document.getElementById("clockText");

  let currentView = "dashboard";

  function statusBadge(value) {
    const labels = {
      online: "正常",
      warning: "注意",
      danger: "異常"
    };
    if (!labels[value]) {
      return value;
    }
    return `<span class="badge ${value}"><span class="state-dot ${value}"></span>${labels[value]}</span>`;
  }

  function renderTable(viewKey) {
    const view = views[viewKey];
    tableHead.innerHTML = `<tr>${view.columns.map((column) => `<th>${column}</th>`).join("")}</tr>`;
    tableBody.innerHTML = view.rows.map((row, rowIndex) => `
      <tr class="${rowIndex === 1 ? "selected" : ""}">
        ${row.map((cell, cellIndex) => `<td>${cellIndex === 0 ? statusBadge(cell) : cell}</td>`).join("")}
      </tr>
    `).join("");
  }

  function setActiveModule(viewKey) {
    currentView = viewKey;
    viewTitle.textContent = views[viewKey].title;
    document.querySelectorAll("[data-rail-module]").forEach((button) => {
      button.classList.toggle("active", button.dataset.railModule === viewKey);
    });

    const isDashboard = viewKey === "dashboard";
    dashboardView.hidden = !isDashboard;
    dataView.hidden = isDashboard;
    toolRibbon.hidden = isDashboard;

    if (!isDashboard) {
      renderTable(viewKey);
    }

    appShell.classList.remove("rail-open");
    sidebarToggle.setAttribute("aria-expanded", String(!appShell.classList.contains("nav-collapsed")));
  }

  function openDoorDialog() {
    dialogTitle.textContent = "新增門";
    dialogBody.innerHTML = `
      <div class="field"><label>門編號</label><input value="5"></div>
      <div class="field"><label>門名稱</label><input value="公司側門"></div>
      <div class="field"><label>所在終端機</label><select><option>[175] 大門控制器</option><option>[172] 公司後門</option></select></div>
      <div class="field"><label>門號索引</label><select><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
      <div class="field full"><label>備註</label><textarea placeholder="門位置、施工資訊或特殊管制說明"></textarea></div>
    `;
    dialog.showModal();
  }

  function openAccessDialog() {
    dialogTitle.textContent = "出入口設定";
    dialogBody.innerHTML = `
      <div class="field"><label>L4 卡片及個人密碼時區</label><select><option>[0] 未定義</option><option>[1] 任何時間</option></select></div>
      <div class="field"><label>出方向 L4</label><select><option>[0] 未定義</option><option>[1] 任何時間</option></select></div>
      <div class="field"><label>L3 密碼時區</label><select><option>[0] 未定義</option><option>[1] 任何時間</option></select></div>
      <div class="field"><label>出方向 L3</label><select><option>[0] 未定義</option></select></div>
      <div class="field"><label>開門延遲時間</label><input type="number" value="10"></div>
      <div class="field"><label>關門延遲時間</label><input type="number" value="10"></div>
      <div class="field"><label>無上鎖時區</label><select><option>[0] 未定義</option><option>[1] 任何時間</option></select></div>
      <div class="field"><label>門磁檢測方式</label><select><option>關閉</option><option>常閉</option><option>常開</option></select></div>
      <div class="field"><label>進出記錄</label><select><option>記錄</option><option>不記錄</option></select></div>
      <div class="field"><label>啟用繼電器</label><select><option>1 Relay</option><option>2 Relay</option></select></div>
    `;
    dialog.showModal();
  }

  function openRemoteDialog() {
    dialogTitle.textContent = "遠端控制";
    dialogBody.innerHTML = `
      <div class="field"><label>控制門</label><select><option>公司大門</option><option>公司後門</option><option>研發機房</option><option>倉儲側門</option></select></div>
      <div class="field"><label>操作命令</label><select><option>正常開門</option><option>強制開門</option><option>強制關門</option><option>恢復正常狀態</option></select></div>
      <div class="field full"><label>高風險確認</label><textarea>此操作將寫入操作稽核，並同步通知監控台。</textarea></div>
    `;
    dialog.showModal();
  }

  function openGenericDialog(action) {
    const titleMap = {
      edit: "修改資料",
      delete: "刪除確認",
      search: "進階查詢",
      refresh: "重新整理",
      download: "資料下發"
    };
    dialogTitle.textContent = titleMap[action] || "操作";
    dialogBody.innerHTML = `
      <div class="field full"><label>目前模組</label><input value="${views[currentView].title}"></div>
      <div class="field full"><label>操作說明</label><textarea>${titleMap[action] || "操作"}會依目前選取資料列與登入權限執行，所有結果都會寫入操作稽核。</textarea></div>
    `;
    dialog.showModal();
  }

  document.querySelectorAll("[data-rail-module]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveModule(button.dataset.railModule);
    });
  });

  document.querySelectorAll("[data-rail-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveModule(button.dataset.railJump);
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "add") {
        openDoorDialog();
      } else if (action === "settings") {
        openAccessDialog();
      } else if (action === "remote") {
        openRemoteDialog();
      } else {
        openGenericDialog(action);
      }
    });
  });

  sidebarToggle.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 980px)").matches) {
      appShell.classList.toggle("rail-open");
      sidebarToggle.setAttribute("aria-expanded", String(appShell.classList.contains("rail-open")));
    } else {
      appShell.classList.toggle("nav-collapsed");
      sidebarToggle.setAttribute("aria-expanded", String(!appShell.classList.contains("nav-collapsed")));
    }
  });

  document.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());

  document.getElementById("applyFilter").addEventListener("click", () => {
    const keyword = document.getElementById("keywordInput").value.trim();
    if (!keyword) {
      renderTable(currentView);
      return;
    }
    const view = views[currentView];
    tableBody.innerHTML = view.rows
      .filter((row) => row.join(" ").includes(keyword))
      .map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? statusBadge(cell) : cell}</td>`).join("")}</tr>`)
      .join("") || `<tr><td colspan="${view.columns.length}">查無符合「${keyword}」的資料。</td></tr>`;
  });

  function updateClock() {
    const now = new Date();
    clockText.textContent = now.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  setActiveModule(currentView);
  updateClock();
  window.setInterval(updateClock, 30000);
}());
