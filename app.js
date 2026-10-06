(() => {
  'use strict';

  const DB_NAME = 'todo-list-local';
  const DB_VERSION = 3;
  const MAX_IMAGES = 30;
  const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

  const state = {
    db: null,
    events: [],
    projects: [],
    milestones: [],
    statements: [],
    selectedId: null,
    selectedProjectId: null,
    selectedStatementId: null,
    filter: 'today',
    view: 'events',
    reportMode: 'month',
    reportMonth: '',
    reportYear: '',
    search: '',
    objectUrls: [],
    saveTimer: null,
    projectSaveTimer: null,
    midnightTimer: null,
    statementTimer: null,
    statementMonth: '',
    salesTrendMode: 'monthly',
    salesTrendYear: '',
    salesCustomer: 'all',
  };

  const elements = {
    addButton: document.querySelector('#addButton'),
    addMilestoneButton: document.querySelector('#addMilestoneButton'),
    addProjectButton: document.querySelector('#addProjectButton'),
    allCount: document.querySelector('#allCount'),
    completeInput: document.querySelector('#completeInput'),
    completedCount: document.querySelector('#completedCount'),
    categoryInput: document.querySelector('#categoryInput'),
    customerInput: document.querySelector('#customerInput'),
    dateInput: document.querySelector('#dateInput'),
    deleteEventButton: document.querySelector('#deleteEventButton'),
    deleteProjectButton: document.querySelector('#deleteProjectButton'),
    detailContent: document.querySelector('#detailContent'),
    detailPanel: document.querySelector('#detailPanel'),
    dropHint: document.querySelector('#dropHint'),
    emptyDetail: document.querySelector('#emptyDetail'),
    eventList: document.querySelector('#eventList'),
    emptyProject: document.querySelector('#emptyProject'),
    exportButton: document.querySelector('#exportButton'),
    imageCount: document.querySelector('#imageCount'),
    imageDropZone: document.querySelector('#imageDropZone'),
    imageGrid: document.querySelector('#imageGrid'),
    imageInput: document.querySelector('#imageInput'),
    importButton: document.querySelector('#importButton'),
    lightbox: document.querySelector('#lightbox'),
    lightboxClose: document.querySelector('#lightboxClose'),
    lightboxImage: document.querySelector('#lightboxImage'),
    noteInput: document.querySelector('#noteInput'),
    ganttChart: document.querySelector('#ganttChart'),
    ganttNavButton: document.querySelector('#ganttNavButton'),
    ganttProgress: document.querySelector('#ganttProgress'),
    ganttRange: document.querySelector('#ganttRange'),
    ganttWorkspace: document.querySelector('#ganttWorkspace'),
    mainPanel: document.querySelector('.main-panel'),
    milestoneList: document.querySelector('#milestoneList'),
    projectContent: document.querySelector('#projectContent'),
    projectCount: document.querySelector('#projectCount'),
    projectList: document.querySelector('#projectList'),
    projectNameInput: document.querySelector('#projectNameInput'),
    projectNoteInput: document.querySelector('#projectNoteInput'),
    productionCount: document.querySelector('#productionCount'),
    productionFields: document.querySelector('#productionFields'),
    productionTotal: document.querySelector('#productionTotal'),
    quantityInput: document.querySelector('#quantityInput'),
    reportAmountTotal: document.querySelector('#reportAmountTotal'),
    reportCustomerTotal: document.querySelector('#reportCustomerTotal'),
    reportEmpty: document.querySelector('#reportEmpty'),
    reportEventTotal: document.querySelector('#reportEventTotal'),
    reportMonthInput: document.querySelector('#reportMonthInput'),
    reportNavButton: document.querySelector('#reportNavButton'),
    reportPeriodMode: document.querySelector('#reportPeriodMode'),
    reportQuantityTotal: document.querySelector('#reportQuantityTotal'),
    reportSubtitle: document.querySelector('#reportSubtitle'),
    reportTableBody: document.querySelector('#reportTableBody'),
    reportTableHead: document.querySelector('#reportTableHead'),
    reportTitle: document.querySelector('#reportTitle'),
    reportWorkspace: document.querySelector('#reportWorkspace'),
    reportYearInput: document.querySelector('#reportYearInput'),
    printReportButton: document.querySelector('#printReportButton'),
    saveState: document.querySelector('#saveState'),
    salesChart: document.querySelector('#salesChart'),
    salesChartEmpty: document.querySelector('#salesChartEmpty'),
    salesChartLegend: document.querySelector('#salesChartLegend'),
    salesCustomerCount: document.querySelector('#salesCustomerCount'),
    salesCustomerFilter: document.querySelector('#salesCustomerFilter'),
    salesTableBody: document.querySelector('#salesTableBody'),
    salesTableHead: document.querySelector('#salesTableHead'),
    salesTrendCustomers: document.querySelector('#salesTrendCustomers'),
    salesTrendMode: document.querySelector('#salesTrendMode'),
    salesTrendNavButton: document.querySelector('#salesTrendNavButton'),
    salesTrendSubtitle: document.querySelector('#salesTrendSubtitle'),
    salesTrendTitle: document.querySelector('#salesTrendTitle'),
    salesTrendTotal: document.querySelector('#salesTrendTotal'),
    salesTrendYear: document.querySelector('#salesTrendYear'),
    salesWorkspace: document.querySelector('#salesWorkspace'),
    searchInput: document.querySelector('#searchInput'),
    statementAmountTotal: document.querySelector('#statementAmountTotal'),
    statementCount: document.querySelector('#statementCount'),
    statementCustomer: document.querySelector('#statementCustomer'),
    statementDocument: document.querySelector('#statementDocument'),
    statementEmpty: document.querySelector('#statementEmpty'),
    statementEventTotal: document.querySelector('#statementEventTotal'),
    statementGeneratedAt: document.querySelector('#statementGeneratedAt'),
    statementList: document.querySelector('#statementList'),
    statementMonthInput: document.querySelector('#statementMonthInput'),
    statementNavButton: document.querySelector('#statementNavButton'),
    statementNumber: document.querySelector('#statementNumber'),
    statementPeriodLabel: document.querySelector('#statementPeriodLabel'),
    statementQuantityTotal: document.querySelector('#statementQuantityTotal'),
    statementTableBody: document.querySelector('#statementTableBody'),
    statementTitle: document.querySelector('#statementTitle'),
    statementWarning: document.querySelector('#statementWarning'),
    statementWorkspace: document.querySelector('#statementWorkspace'),
    generateStatementsButton: document.querySelector('#generateStatementsButton'),
    printStatementButton: document.querySelector('#printStatementButton'),
    printSalesTrendButton: document.querySelector('#printSalesTrendButton'),
    titleInput: document.querySelector('#titleInput'),
    todayCount: document.querySelector('#todayCount'),
    toastRegion: document.querySelector('#toastRegion'),
    unitPriceInput: document.querySelector('#unitPriceInput'),
    upcomingCount: document.querySelector('#upcomingCount'),
    viewSubtitle: document.querySelector('#viewSubtitle'),
    viewTitle: document.querySelector('#viewTitle'),
  };

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('events')) {
          const events = db.createObjectStore('events', { keyPath: 'id' });
          events.createIndex('date', 'date', { unique: false });
          events.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('images')) {
          const images = db.createObjectStore('images', { keyPath: 'id' });
          images.createIndex('eventId', 'eventId', { unique: false });
        }
        if (!db.objectStoreNames.contains('projects')) {
          const projects = db.createObjectStore('projects', { keyPath: 'id' });
          projects.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('milestones')) {
          const milestones = db.createObjectStore('milestones', { keyPath: 'id' });
          milestones.createIndex('projectId', 'projectId', { unique: false });
          milestones.createIndex('startDate', 'startDate', { unique: false });
        }
        if (!db.objectStoreNames.contains('statements')) {
          const statements = db.createObjectStore('statements', { keyPath: 'id' });
          statements.createIndex('period', 'period', { unique: false });
          statements.createIndex('customer', 'customer', { unique: false });
          statements.createIndex('generatedAt', 'generatedAt', { unique: false });
        }
      };
    });
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('事务已取消'));
    });
  }

  async function getAll(storeName) {
    const transaction = state.db.transaction(storeName, 'readonly');
    return requestResult(transaction.objectStore(storeName).getAll());
  }

  async function putRecord(storeName, value) {
    const transaction = state.db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(value);
    await transactionDone(transaction);
  }

  async function deleteRecord(storeName, key) {
    const transaction = state.db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(key);
    await transactionDone(transaction);
  }

  async function getEventImages(eventId) {
    const transaction = state.db.transaction('images', 'readonly');
    const index = transaction.objectStore('images').index('eventId');
    const images = await requestResult(index.getAll(IDBKeyRange.only(eventId)));
    return images.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  }

  async function deleteEventAndImages(eventId) {
    const transaction = state.db.transaction(['events', 'images'], 'readwrite');
    transaction.objectStore('events').delete(eventId);
    const imageIndex = transaction.objectStore('images').index('eventId');
    const cursorRequest = imageIndex.openKeyCursor(IDBKeyRange.only(eventId));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      transaction.objectStore('images').delete(cursor.primaryKey);
      cursor.continue();
    };
    await transactionDone(transaction);
  }

  async function deleteProjectAndMilestones(projectId) {
    const transaction = state.db.transaction(['projects', 'milestones'], 'readwrite');
    transaction.objectStore('projects').delete(projectId);
    const milestoneStore = transaction.objectStore('milestones');
    const cursorRequest = milestoneStore.index('projectId').openKeyCursor(IDBKeyRange.only(projectId));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      milestoneStore.delete(cursor.primaryKey);
      cursor.continue();
    };
    await transactionDone(transaction);
  }

  function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function dateFromString(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function addDays(value, days) {
    const date = dateFromString(value);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function daysBetween(start, end) {
    return Math.round((dateFromString(end) - dateFromString(start)) / 86400000);
  }

  function normalizeEvent(event) {
    return {
      ...event,
      category: event.category === 'production' ? 'production' : 'experiment',
      customer: String(event.customer || ''),
      unitPrice: Math.max(0, Number(event.unitPrice) || 0),
      quantity: Math.max(0, Number(event.quantity) || 0),
    };
  }

  function formatNumber(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat('zh-CN', {
      maximumFractionDigits,
    }).format(Number(value) || 0);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function productionAmount(event) {
    return (Number(event.unitPrice) || 0) * (Number(event.quantity) || 0);
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = todayString();
    if (dateString === today) return '今天';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    if (dateString === tomorrowString) return '明天';
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  }

  function selectedEvent() {
    return state.events.find((event) => event.id === state.selectedId) || null;
  }

  function filteredEvents() {
    const today = todayString();
    const query = state.search.trim().toLocaleLowerCase('zh-CN');
    return state.events
      .filter((event) => {
        if (state.filter === 'today') return event.date === today && !event.completed;
        if (state.filter === 'upcoming') return event.date > today && !event.completed;
        if (state.filter === 'completed') return event.completed;
        return true;
      })
      .filter((event) => {
        if (!query) return true;
        return `${event.title}\n${event.note}\n${event.customer}`.toLocaleLowerCase('zh-CN').includes(query);
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.updatedAt - a.updatedAt;
      });
  }

  function setViewLabels() {
    const labels = {
      today: ['今天', formatDate(todayString())],
      upcoming: ['未来', '安排在今天之后的事项'],
      all: ['全部事项', '所有本地记录'],
      completed: ['已完成', '已完成的事项'],
    };
    const [title, subtitle] = labels[state.filter];
    elements.viewTitle.textContent = state.search ? '搜索结果' : title;
    elements.viewSubtitle.textContent = state.search ? `包含“${state.search}”` : subtitle;
  }

  function renderCounts() {
    const today = todayString();
    elements.todayCount.textContent = state.events.filter(
      (event) => event.date === today && !event.completed,
    ).length;
    elements.upcomingCount.textContent = state.events.filter(
      (event) => event.date > today && !event.completed,
    ).length;
    elements.allCount.textContent = state.events.length;
    elements.completedCount.textContent = state.events.filter((event) => event.completed).length;
    elements.projectCount.textContent = state.projects.length;
    elements.productionCount.textContent = state.events.filter((event) => event.category === 'production').length;
    elements.statementCount.textContent = state.statements.length;
    elements.salesCustomerCount.textContent = new Set(
      state.events
        .filter((event) => event.category === 'production' && event.customer.trim())
        .map((event) => event.customer.trim()),
    ).size;
  }

  function selectedProject() {
    return state.projects.find((project) => project.id === state.selectedProjectId) || null;
  }

  function projectMilestones(projectId) {
    return state.milestones
      .filter((milestone) => milestone.projectId === projectId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.createdAt - b.createdAt);
  }

  function switchView(view) {
    state.view = view;
    const showGantt = view === 'gantt';
    const showReport = view === 'report';
    const showStatements = view === 'statements';
    const showSales = view === 'sales';
    elements.mainPanel.classList.toggle('is-hidden', showGantt || showReport || showStatements || showSales);
    elements.detailPanel.classList.toggle('is-hidden', showGantt || showReport || showStatements || showSales);
    elements.ganttWorkspace.classList.toggle('is-hidden', !showGantt);
    elements.reportWorkspace.classList.toggle('is-hidden', !showReport);
    elements.statementWorkspace.classList.toggle('is-hidden', !showStatements);
    elements.salesWorkspace.classList.toggle('is-hidden', !showSales);
    document.querySelectorAll('.nav-item[data-filter]').forEach((item) => {
      item.classList.toggle('is-active', !showGantt && !showReport && !showStatements && !showSales && item.dataset.filter === state.filter);
    });
    elements.ganttNavButton.classList.toggle('is-active', showGantt);
    elements.reportNavButton.classList.toggle('is-active', showReport);
    elements.statementNavButton.classList.toggle('is-active', showStatements);
    elements.salesTrendNavButton.classList.toggle('is-active', showSales);
    if (showGantt) renderProjects();
    if (showReport) renderProductionReport();
    if (showStatements) renderStatements();
    if (showSales) renderSalesTrend();
  }

  function reportYears() {
    const currentYear = todayString().slice(0, 4);
    const years = new Set([currentYear]);
    state.events
      .filter((event) => event.category === 'production' && event.date)
      .forEach((event) => years.add(event.date.slice(0, 4)));
    return [...years].sort((a, b) => b.localeCompare(a));
  }

  function refreshReportYearOptions() {
    const years = reportYears();
    if (!state.reportYear || !years.includes(state.reportYear)) state.reportYear = years[0];
    elements.reportYearInput.replaceChildren();
    for (const year of years) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = `${year} 年`;
      option.selected = year === state.reportYear;
      elements.reportYearInput.append(option);
    }
  }

  function appendReportCell(row, value, isNumber = false) {
    const cell = document.createElement('td');
    if (isNumber) cell.className = 'report-number';
    cell.textContent = value;
    row.append(cell);
    return cell;
  }

  function renderReportHeader(labels, numericIndexes = []) {
    elements.reportTableHead.replaceChildren();
    const row = document.createElement('tr');
    labels.forEach((label, index) => {
      const cell = document.createElement('th');
      if (numericIndexes.includes(index)) cell.className = 'report-number';
      cell.textContent = label;
      row.append(cell);
    });
    elements.reportTableHead.append(row);
  }

  function renderMonthlyReport(events) {
    renderReportHeader(['日期', '客户名称', '生产事件', '单价（元）', '数量', '金额（元）', '状态'], [3, 4, 5]);
    elements.reportTableBody.replaceChildren();
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || String(a.title || '').localeCompare(String(b.title || '')));
    for (const event of sorted) {
      const row = document.createElement('tr');
      appendReportCell(row, event.date);
      appendReportCell(row, event.customer || '未填写');
      appendReportCell(row, event.title || '未命名事项');
      appendReportCell(row, formatNumber(event.unitPrice), true);
      appendReportCell(row, formatNumber(event.quantity), true);
      appendReportCell(row, formatNumber(productionAmount(event)), true);
      const statusCell = appendReportCell(row, '');
      const status = document.createElement('span');
      status.className = 'report-status';
      if (event.completed) status.classList.add('is-completed');
      status.textContent = event.completed ? '已完成' : '进行中';
      statusCell.append(status);
      elements.reportTableBody.append(row);
    }
  }

  function renderAnnualReport(events) {
    renderReportHeader(['月份', '生产事件', '客户数量', '生产数量', '生产金额（元）', '已完成'], [1, 2, 3, 4, 5]);
    elements.reportTableBody.replaceChildren();
    for (let month = 1; month <= 12; month += 1) {
      const prefix = `${state.reportYear}-${String(month).padStart(2, '0')}`;
      const monthEvents = events.filter((event) => event.date.startsWith(prefix));
      const row = document.createElement('tr');
      const customers = new Set(monthEvents.map((event) => event.customer.trim()).filter(Boolean));
      const quantity = monthEvents.reduce((sum, event) => sum + event.quantity, 0);
      const amount = monthEvents.reduce((sum, event) => sum + productionAmount(event), 0);
      appendReportCell(row, `${month} 月`);
      appendReportCell(row, formatNumber(monthEvents.length, 0), true);
      appendReportCell(row, formatNumber(customers.size, 0), true);
      appendReportCell(row, formatNumber(quantity), true);
      appendReportCell(row, formatNumber(amount), true);
      appendReportCell(row, formatNumber(monthEvents.filter((event) => event.completed).length, 0), true);
      elements.reportTableBody.append(row);
    }
  }

  function renderProductionReport() {
    refreshReportYearOptions();
    elements.reportPeriodMode.value = state.reportMode;
    elements.reportMonthInput.value = state.reportMonth;
    elements.reportMonthInput.classList.toggle('is-hidden', state.reportMode !== 'month');
    elements.reportYearInput.classList.toggle('is-hidden', state.reportMode !== 'year');
    const productionEvents = state.events.filter((event) => event.category === 'production');
    const events = state.reportMode === 'month'
      ? productionEvents.filter((event) => event.date.startsWith(state.reportMonth))
      : productionEvents.filter((event) => event.date.startsWith(state.reportYear));
    const periodLabel = state.reportMode === 'month'
      ? `${state.reportMonth.slice(0, 4)} 年 ${Number(state.reportMonth.slice(5, 7))} 月`
      : `${state.reportYear} 年`;
    elements.reportTitle.textContent = state.reportMode === 'month' ? '月度生产报表' : '年度生产报表';
    elements.reportSubtitle.textContent = `${periodLabel} · 按事件日期统计`;
    const customers = new Set(events.map((event) => event.customer.trim()).filter(Boolean));
    const quantity = events.reduce((sum, event) => sum + event.quantity, 0);
    const amount = events.reduce((sum, event) => sum + productionAmount(event), 0);
    elements.reportEventTotal.textContent = formatNumber(events.length, 0);
    elements.reportCustomerTotal.textContent = formatNumber(customers.size, 0);
    elements.reportQuantityTotal.textContent = formatNumber(quantity);
    elements.reportAmountTotal.textContent = formatMoney(amount);
    elements.reportEmpty.classList.toggle('is-hidden', events.length > 0);
    if (state.reportMode === 'month') renderMonthlyReport(events);
    else renderAnnualReport(events);
  }

  function customerSalesEvents() {
    return state.events.filter(
      (event) => event.category === 'production' && event.customer.trim(),
    );
  }

  function salesYears() {
    const current = Number(todayString().slice(0, 4));
    const eventYears = customerSalesEvents().map((event) => Number(event.date.slice(0, 4))).filter(Number.isFinite);
    const first = eventYears.length ? Math.min(current, ...eventYears) : current;
    const last = eventYears.length ? Math.max(current, ...eventYears) : current;
    return Array.from({ length: last - first + 1 }, (_value, index) => String(first + index));
  }

  function salesCustomers() {
    return [...new Set(customerSalesEvents().map((event) => event.customer.trim()))]
      .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }

  function refreshSalesControls() {
    const years = salesYears();
    if (!state.salesTrendYear || !years.includes(state.salesTrendYear)) {
      state.salesTrendYear = years.includes(todayString().slice(0, 4))
        ? todayString().slice(0, 4)
        : years[years.length - 1];
    }
    elements.salesTrendYear.replaceChildren();
    for (const year of [...years].sort((a, b) => b.localeCompare(a))) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = `${year} 年`;
      option.selected = year === state.salesTrendYear;
      elements.salesTrendYear.append(option);
    }

    const customers = salesCustomers();
    if (state.salesCustomer !== 'all' && !customers.includes(state.salesCustomer)) state.salesCustomer = 'all';
    elements.salesCustomerFilter.replaceChildren();
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = '全部客户';
    elements.salesCustomerFilter.append(allOption);
    for (const customer of customers) {
      const option = document.createElement('option');
      option.value = customer;
      option.textContent = customer;
      elements.salesCustomerFilter.append(option);
    }
    elements.salesCustomerFilter.value = state.salesCustomer;
    elements.salesTrendMode.value = state.salesTrendMode;
    elements.salesTrendYear.classList.toggle('is-hidden', state.salesTrendMode !== 'monthly');
  }

  function buildSalesSeries() {
    const events = customerSalesEvents();
    const labels = state.salesTrendMode === 'monthly'
      ? Array.from({ length: 12 }, (_value, index) => `${index + 1}月`)
      : salesYears().map((year) => `${year}年`);
    const keys = state.salesTrendMode === 'monthly'
      ? Array.from({ length: 12 }, (_value, index) => `${state.salesTrendYear}-${String(index + 1).padStart(2, '0')}`)
      : salesYears();
    const relevant = state.salesTrendMode === 'monthly'
      ? events.filter((event) => event.date.startsWith(state.salesTrendYear))
      : events;
    const availableCustomers = [...new Set(relevant.map((event) => event.customer.trim()))]
      .sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const customers = state.salesCustomer === 'all'
      ? availableCustomers
      : [state.salesCustomer];
    const series = customers.map((customer) => {
      const values = keys.map((key) => relevant
        .filter((event) => event.customer.trim() === customer && event.date.startsWith(key))
        .reduce((sum, event) => sum + productionAmount(event), 0));
      return { customer, values, total: values.reduce((sum, value) => sum + value, 0) };
    }).filter((item) => item.total > 0);
    return { labels, keys, series };
  }

  function compactMoney(value) {
    const number = Number(value) || 0;
    if (number >= 100000000) return `¥${formatNumber(number / 100000000, 1)}亿`;
    if (number >= 10000) return `¥${formatNumber(number / 10000, 1)}万`;
    return `¥${formatNumber(number, 0)}`;
  }

  function createSvgElement(name, attributes = {}, textContent = '') {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [nameKey, value] of Object.entries(attributes)) element.setAttribute(nameKey, String(value));
    if (textContent) element.textContent = textContent;
    return element;
  }

  function renderSalesChart(labels, series) {
    const colors = ['#3c6f62', '#c9783a', '#547da5', '#9b6aa6', '#b04f5f', '#7e8d45', '#2f8e9d', '#8a6b4b'];
    elements.salesChart.replaceChildren();
    elements.salesChartLegend.replaceChildren();
    const total = series.reduce((sum, item) => sum + item.total, 0);
    const hasData = series.length > 0 && total > 0;
    elements.salesChart.classList.toggle('is-hidden', !hasData);
    elements.salesChartEmpty.classList.toggle('is-hidden', hasData);
    if (!hasData) return;

    series.forEach((item, index) => {
      const legend = document.createElement('span');
      legend.className = 'sales-legend-item';
      const dot = document.createElement('span');
      dot.className = 'sales-legend-dot';
      dot.style.background = colors[index % colors.length];
      const label = document.createElement('span');
      label.textContent = `${item.customer} ${formatMoney(item.total)}`;
      legend.append(dot, label);
      elements.salesChartLegend.append(legend);
    });

    const width = 1000;
    const height = 420;
    const plot = { left: 88, right: 26, top: 28, bottom: 62 };
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const maxValue = Math.max(...series.flatMap((item) => item.values));
    const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, maxValue)));
    const yMax = Math.ceil(maxValue / magnitude) * magnitude || 1;

    for (let tick = 0; tick <= 5; tick += 1) {
      const value = (yMax / 5) * tick;
      const y = plot.top + plotHeight - (tick / 5) * plotHeight;
      elements.salesChart.append(createSvgElement('line', {
        x1: plot.left, x2: width - plot.right, y1: y, y2: y, class: 'chart-grid',
      }));
      elements.salesChart.append(createSvgElement('text', {
        x: plot.left - 10, y: y + 4, 'text-anchor': 'end', class: 'chart-label',
      }, compactMoney(value)));
    }
    elements.salesChart.append(createSvgElement('line', {
      x1: plot.left, x2: plot.left, y1: plot.top, y2: height - plot.bottom, class: 'chart-axis',
    }));
    elements.salesChart.append(createSvgElement('line', {
      x1: plot.left, x2: width - plot.right, y1: height - plot.bottom, y2: height - plot.bottom, class: 'chart-axis',
    }));

    const xAt = (index) => labels.length === 1
      ? plot.left + plotWidth / 2
      : plot.left + (index / (labels.length - 1)) * plotWidth;
    labels.forEach((label, index) => {
      const x = xAt(index);
      elements.salesChart.append(createSvgElement('text', {
        x, y: height - plot.bottom + 25, 'text-anchor': 'middle', class: 'chart-label',
      }, label));
    });

    series.forEach((item, seriesIndex) => {
      const color = colors[seriesIndex % colors.length];
      const points = item.values.map((value, index) => ({
        value,
        x: xAt(index),
        y: plot.top + plotHeight - (value / yMax) * plotHeight,
      }));
      const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
      elements.salesChart.append(createSvgElement('path', {
        d: pathData, stroke: color, class: 'chart-line', 'data-customer': item.customer,
      }));
      points.forEach((point, index) => {
        const circle = createSvgElement('circle', {
          cx: point.x, cy: point.y, r: 5, fill: color, class: 'chart-point',
          'data-customer': item.customer, 'data-value': point.value,
        });
        circle.append(createSvgElement('title', {}, `${item.customer} · ${labels[index]}：${formatMoney(point.value)}`));
        elements.salesChart.append(circle);
        if (series.length === 1 && point.value > 0) {
          elements.salesChart.append(createSvgElement('text', {
            x: point.x, y: Math.max(plot.top + 10, point.y - 10), 'text-anchor': 'middle', class: 'chart-value',
          }, compactMoney(point.value)));
        }
      });
    });
  }

  function renderSalesTable(labels, series) {
    elements.salesTableHead.replaceChildren();
    elements.salesTableBody.replaceChildren();
    const header = document.createElement('tr');
    ['客户', ...labels, '合计'].forEach((label) => {
      const cell = document.createElement('th');
      cell.textContent = label;
      header.append(cell);
    });
    elements.salesTableHead.append(header);
    for (const item of series) {
      const row = document.createElement('tr');
      appendReportCell(row, item.customer);
      item.values.forEach((value) => appendReportCell(row, formatMoney(value), true));
      appendReportCell(row, formatMoney(item.total), true);
      elements.salesTableBody.append(row);
    }
  }

  function renderSalesTrend() {
    refreshSalesControls();
    const { labels, series } = buildSalesSeries();
    const total = series.reduce((sum, item) => sum + item.total, 0);
    elements.salesTrendTitle.textContent = state.salesTrendMode === 'monthly'
      ? '客户月度销售额折线图'
      : '客户年度销售额折线图';
    elements.salesTrendSubtitle.textContent = state.salesTrendMode === 'monthly'
      ? `${state.salesTrendYear} 年 · 每位客户按1—12月汇总`
      : `${salesYears()[0]}—${salesYears()[salesYears().length - 1]} 年 · 每位客户按年度汇总`;
    elements.salesTrendCustomers.textContent = formatNumber(series.length, 0);
    elements.salesTrendTotal.textContent = formatMoney(total);
    renderSalesChart(labels, series);
    renderSalesTable(labels, series);
  }

  function statementDueAt(period) {
    const [year, month] = period.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(year, month - 1, Math.min(30, lastDay), 23, 59, 59, 999);
  }

  function statementId(period, customer) {
    return `${period}::${customer.trim()}`;
  }

  function statementNumber(period, customer) {
    let hash = 0;
    for (const character of customer) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
    return `EN-${period.replace('-', '')}-${hash.toString(36).toUpperCase().padStart(4, '0').slice(-4)}`;
  }

  function createStatement(period, customer, events) {
    const lines = [...events]
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.title || '').localeCompare(String(b.title || '')))
      .map((event) => ({
        eventId: event.id,
        date: event.date,
        title: event.title || '未命名事项',
        unitPrice: event.unitPrice,
        quantity: event.quantity,
        amount: productionAmount(event),
        completed: event.completed,
      }));
    return {
      id: statementId(period, customer),
      number: statementNumber(period, customer),
      period,
      customer,
      lines,
      eventCount: lines.length,
      totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
      totalAmount: lines.reduce((sum, line) => sum + line.amount, 0),
      generatedAt: new Date().toISOString(),
    };
  }

  async function generateStatementsForPeriod(period, replace = false) {
    const groups = new Map();
    state.events
      .filter((event) => event.category === 'production' && event.date.startsWith(period))
      .forEach((event) => {
        const customer = event.customer.trim();
        if (!customer) return;
        if (!groups.has(customer)) groups.set(customer, []);
        groups.get(customer).push(event);
      });

    const existingIds = new Set(state.statements.map((statement) => statement.id));
    if (replace) {
      const deleteTransaction = state.db.transaction('statements', 'readwrite');
      const deleteStore = deleteTransaction.objectStore('statements');
      const cursorRequest = deleteStore.index('period').openKeyCursor(IDBKeyRange.only(period));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) return;
        deleteStore.delete(cursor.primaryKey);
        cursor.continue();
      };
      await transactionDone(deleteTransaction);
    }
    const transaction = state.db.transaction('statements', 'readwrite');
    const store = transaction.objectStore('statements');
    let generated = 0;
    for (const [customer, events] of groups) {
      const statement = createStatement(period, customer, events);
      if (!replace && existingIds.has(statement.id)) continue;
      store.put(statement);
      generated += 1;
    }
    await transactionDone(transaction);
    state.statements = await getAll('statements');
    elements.statementCount.textContent = state.statements.length;
    return generated;
  }

  async function generateDueStatements(announce = false) {
    const now = new Date();
    const periods = [...new Set(
      state.events
        .filter((event) => event.category === 'production' && event.date)
        .map((event) => event.date.slice(0, 7)),
    )].filter((period) => statementDueAt(period) <= now);
    let generated = 0;
    for (const period of periods) generated += await generateStatementsForPeriod(period, false);
    if (generated > 0) {
      const latest = [...state.statements].sort((a, b) => b.period.localeCompare(a.period))[0];
      if (latest && !state.statementMonth) state.statementMonth = latest.period;
      if (announce) showToast(`已自动生成 ${generated} 份客户对账单`);
      if (state.view === 'statements') renderStatements();
    }
    return generated;
  }

  function scheduleStatementGeneration() {
    clearTimeout(state.statementTimer);
    const now = new Date();
    let period = todayString().slice(0, 7);
    let due = statementDueAt(period);
    if (due <= now) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      period = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      due = statementDueAt(period);
    }
    const delay = Math.min(Math.max(1000, due - now + 1000), 2147483647);
    state.statementTimer = setTimeout(async () => {
      await generateDueStatements(true);
      scheduleStatementGeneration();
    }, delay);
  }

  function statementsForSelectedPeriod() {
    return state.statements
      .filter((statement) => statement.period === state.statementMonth)
      .sort((a, b) => a.customer.localeCompare(b.customer, 'zh-CN'));
  }

  function renderStatementDetail() {
    const statement = state.statements.find((item) => item.id === state.selectedStatementId) || null;
    elements.statementEmpty.classList.toggle('is-hidden', Boolean(statement));
    elements.statementDocument.classList.toggle('is-hidden', !statement);
    if (!statement) return;
    elements.statementTitle.textContent = `${statement.period.replace('-', ' 年 ')} 月对账单`;
    elements.statementCustomer.textContent = `客户：${statement.customer}`;
    elements.statementNumber.textContent = `单号：${statement.number}`;
    elements.statementGeneratedAt.textContent = `生成时间：${new Date(statement.generatedAt).toLocaleString('zh-CN')}`;
    elements.statementEventTotal.textContent = formatNumber(statement.eventCount, 0);
    elements.statementQuantityTotal.textContent = formatNumber(statement.totalQuantity);
    elements.statementAmountTotal.textContent = formatMoney(statement.totalAmount);
    elements.statementTableBody.replaceChildren();
    for (const line of statement.lines) {
      const row = document.createElement('tr');
      appendReportCell(row, line.date);
      appendReportCell(row, line.title);
      appendReportCell(row, formatNumber(line.unitPrice), true);
      appendReportCell(row, formatNumber(line.quantity), true);
      appendReportCell(row, formatNumber(line.amount), true);
      const status = appendReportCell(row, line.completed ? '已完成' : '进行中');
      status.className = line.completed ? 'is-completed' : '';
      elements.statementTableBody.append(row);
    }
  }

  function renderStatements() {
    elements.statementMonthInput.value = state.statementMonth;
    elements.statementPeriodLabel.textContent = state.statementMonth || '';
    const statements = statementsForSelectedPeriod();
    const missingCustomerCount = state.events.filter(
      (event) => event.category === 'production'
        && event.date.startsWith(state.statementMonth)
        && !event.customer.trim(),
    ).length;
    elements.statementWarning.classList.toggle('is-hidden', missingCustomerCount === 0);
    elements.statementWarning.textContent = missingCustomerCount
      ? `${missingCustomerCount} 条生产记录未填写客户，未生成对账单。`
      : '';
    if (!statements.some((statement) => statement.id === state.selectedStatementId)) {
      state.selectedStatementId = statements[0]?.id || null;
    }
    elements.statementList.replaceChildren();
    if (statements.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'statement-list-empty';
      empty.textContent = '当前月份还没有已生成的客户对账单。';
      elements.statementList.append(empty);
    } else {
      for (const statement of statements) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'statement-card';
        if (statement.id === state.selectedStatementId) card.classList.add('is-selected');
        const customer = document.createElement('strong');
        customer.textContent = statement.customer;
        const meta = document.createElement('span');
        const count = document.createElement('em');
        count.textContent = `${statement.eventCount} 条`;
        const amount = document.createElement('em');
        amount.textContent = formatMoney(statement.totalAmount);
        meta.append(count, amount);
        card.append(customer, meta);
        card.addEventListener('click', () => {
          state.selectedStatementId = statement.id;
          renderStatements();
        });
        elements.statementList.append(card);
      }
    }
    renderStatementDetail();
  }

  async function regenerateStatements() {
    const period = state.statementMonth;
    if (!period) return;
    const hasExisting = state.statements.some((statement) => statement.period === period);
    if (hasExisting && !confirm(`重新生成会覆盖 ${period} 已有的客户对账单，确定继续吗？`)) return;
    const generated = await generateStatementsForPeriod(period, true);
    state.selectedStatementId = statementsForSelectedPeriod()[0]?.id || null;
    renderEventList();
    renderStatements();
    showToast(generated > 0 ? `已生成 ${generated} 份客户对账单` : '当前月份没有可生成的客户生产记录', generated === 0);
  }

  function printCurrentView(type) {
    document.body.classList.remove('print-report', 'print-statement', 'print-sales');
    const className = type === 'statement' ? 'print-statement' : type === 'sales' ? 'print-sales' : 'print-report';
    document.body.classList.add(className);
    window.print();
    setTimeout(() => document.body.classList.remove('print-report', 'print-statement', 'print-sales'), 1000);
  }

  async function rolloverIncompleteEvents(announce = false) {
    const today = todayString();
    const overdue = state.events.filter((event) => !event.completed && event.date && event.date < today);
    if (overdue.length === 0) return 0;
    const transaction = state.db.transaction('events', 'readwrite');
    const store = transaction.objectStore('events');
    overdue.forEach((event, index) => {
      event.rolledFromDate = event.rolledFromDate || event.date;
      event.date = today;
      event.updatedAt = Date.now() + index;
      store.put(event);
    });
    await transactionDone(transaction);
    renderEventList();
    if (announce) showToast(`${overdue.length} 条未完成事项已自动顺延到今天`);
    return overdue.length;
  }

  function scheduleMidnightRollover() {
    clearTimeout(state.midnightTimer);
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 1, 0);
    state.midnightTimer = setTimeout(async () => {
      state.events = (await getAll('events')).map(normalizeEvent);
      await rolloverIncompleteEvents(true);
      await generateDueStatements(true);
      if (state.view === 'report') renderProductionReport();
      if (state.view === 'statements') renderStatements();
      if (state.view === 'sales') renderSalesTrend();
      scheduleMidnightRollover();
    }, next - now);
  }

  function renderProjectList() {
    elements.projectCount.textContent = state.projects.length;
    elements.projectList.replaceChildren();
    const projects = [...state.projects].sort((a, b) => b.updatedAt - a.updatedAt);
    if (projects.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'project-list-empty';
      empty.textContent = '还没有项目，点击右上角“新建项目”开始拆分。';
      elements.projectList.append(empty);
      return;
    }
    for (const project of projects) {
      const milestones = projectMilestones(project.id);
      const completed = milestones.filter((item) => item.completed).length;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'project-card';
      if (project.id === state.selectedProjectId) card.classList.add('is-selected');
      const title = document.createElement('div');
      title.className = 'project-card-title';
      title.textContent = project.name || '未命名项目';
      const meta = document.createElement('div');
      meta.className = 'project-card-meta';
      const nodeCount = document.createElement('span');
      nodeCount.textContent = `${milestones.length} 个节点`;
      const progress = document.createElement('span');
      progress.textContent = milestones.length ? `${completed}/${milestones.length}` : '待规划';
      meta.append(nodeCount, progress);
      card.append(title, meta);
      card.addEventListener('click', () => {
        state.selectedProjectId = project.id;
        renderProjects();
      });
      elements.projectList.append(card);
    }
  }

  function renderProjectVisuals() {
    const project = selectedProject();
    if (!project) return;
    const milestones = projectMilestones(project.id);
    const completed = milestones.filter((item) => item.completed).length;
    elements.ganttProgress.textContent = `${completed} / ${milestones.length} 已完成`;
    if (milestones.length === 0) {
      elements.ganttRange.textContent = '尚未设置日期';
      elements.ganttChart.innerHTML = '<div class="gantt-empty">添加事件节点后，这里会自动生成时间图</div>';
      return;
    }

    const start = milestones.reduce((value, item) => (item.startDate < value ? item.startDate : value), milestones[0].startDate);
    const end = milestones.reduce((value, item) => (item.endDate > value ? item.endDate : value), milestones[0].endDate);
    const totalDays = daysBetween(start, end) + 1;
    const dayWidth = totalDays > 180 ? 12 : totalDays > 90 ? 18 : totalDays > 45 ? 24 : 34;
    const timelineWidth = Math.max(520, totalDays * dayWidth);
    elements.ganttRange.textContent = `${start} 至 ${end} · ${totalDays} 天`;
    elements.ganttChart.replaceChildren();
    elements.ganttChart.style.width = `${190 + timelineWidth}px`;

    const axis = document.createElement('div');
    axis.className = 'gantt-axis';
    const axisLabel = document.createElement('div');
    axisLabel.className = 'gantt-axis-label';
    axisLabel.textContent = '事件节点';
    const axisTimeline = document.createElement('div');
    axisTimeline.className = 'gantt-timeline';
    axisTimeline.style.width = `${timelineWidth}px`;
    axisTimeline.style.backgroundSize = `${dayWidth}px 100%`;
    const labelStep = dayWidth >= 30 ? 7 : dayWidth >= 18 ? 14 : 30;
    for (let offset = 0; offset < totalDays; offset += labelStep) {
      const tick = document.createElement('span');
      tick.className = 'gantt-tick';
      tick.style.left = `${offset * dayWidth}px`;
      tick.textContent = addDays(start, offset).slice(5).replace('-', '/');
      axisTimeline.append(tick);
    }
    axis.append(axisLabel, axisTimeline);
    elements.ganttChart.append(axis);

    for (const milestone of milestones) {
      const row = document.createElement('div');
      row.className = 'gantt-row';
      const label = document.createElement('div');
      label.className = 'gantt-row-label';
      label.title = milestone.title || '未命名节点';
      label.textContent = milestone.title || '未命名节点';
      const timeline = document.createElement('div');
      timeline.className = 'gantt-timeline';
      timeline.style.width = `${timelineWidth}px`;
      timeline.style.backgroundSize = `${dayWidth}px 100%`;
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      if (milestone.completed) bar.classList.add('is-completed');
      bar.style.left = `${daysBetween(start, milestone.startDate) * dayWidth + 2}px`;
      bar.style.width = `${Math.max(28, (daysBetween(milestone.startDate, milestone.endDate) + 1) * dayWidth - 4)}px`;
      bar.title = `${milestone.title || '未命名节点'}：${milestone.startDate} 至 ${milestone.endDate}`;
      bar.textContent = milestone.title || '未命名节点';
      timeline.append(bar);
      row.append(label, timeline);
      elements.ganttChart.append(row);
    }
  }

  async function saveMilestone(milestone) {
    if (milestone.endDate < milestone.startDate) milestone.endDate = milestone.startDate;
    milestone.updatedAt = Date.now();
    await putRecord('milestones', milestone);
    const project = selectedProject();
    if (project) {
      project.updatedAt = Date.now();
      await putRecord('projects', project);
    }
    renderProjectList();
    renderProjectVisuals();
  }

  function renderMilestoneList() {
    const project = selectedProject();
    elements.milestoneList.replaceChildren();
    if (!project) return;
    const milestones = projectMilestones(project.id);
    if (milestones.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'milestone-empty';
      empty.textContent = '还没有事件节点。点击“添加事件节点”，把大项目拆成小步骤。';
      elements.milestoneList.append(empty);
      return;
    }
    for (const milestone of milestones) {
      const row = document.createElement('div');
      row.className = 'milestone-row';
      row.dataset.id = milestone.id;
      const completed = document.createElement('input');
      completed.type = 'checkbox';
      completed.className = 'milestone-check';
      completed.title = '标记节点为完成';
      completed.checked = milestone.completed;
      const title = document.createElement('input');
      title.type = 'text';
      title.maxLength = 120;
      title.placeholder = '事件节点名称';
      title.value = milestone.title;
      const start = document.createElement('input');
      start.type = 'date';
      start.value = milestone.startDate;
      const arrow = document.createElement('span');
      arrow.className = 'milestone-date-arrow';
      arrow.textContent = '至';
      const end = document.createElement('input');
      end.type = 'date';
      end.value = milestone.endDate;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'small-danger-button';
      remove.title = '删除事件节点';
      remove.textContent = '删除';
      let timer;
      const queueSave = () => {
        milestone.title = title.value.trimStart();
        milestone.startDate = start.value || todayString();
        milestone.endDate = end.value || milestone.startDate;
        milestone.completed = completed.checked;
        if (milestone.endDate < milestone.startDate) {
          milestone.endDate = milestone.startDate;
          end.value = milestone.endDate;
        }
        clearTimeout(timer);
        timer = setTimeout(() => saveMilestone(milestone), 180);
      };
      title.addEventListener('input', queueSave);
      start.addEventListener('change', queueSave);
      end.addEventListener('change', queueSave);
      completed.addEventListener('change', queueSave);
      remove.addEventListener('click', async () => {
        if (!confirm(`确认删除“${milestone.title || '未命名节点'}”吗？`)) return;
        clearTimeout(timer);
        await deleteRecord('milestones', milestone.id);
        state.milestones = state.milestones.filter((item) => item.id !== milestone.id);
        renderProjects();
        showToast('事件节点已删除');
      });
      row.append(completed, title, start, arrow, end, remove);
      elements.milestoneList.append(row);
    }
  }

  function renderProjectEditor() {
    const project = selectedProject();
    elements.emptyProject.classList.toggle('is-hidden', Boolean(project));
    elements.projectContent.classList.toggle('is-hidden', !project);
    if (!project) return;
    elements.projectNameInput.value = project.name;
    elements.projectNoteInput.value = project.note;
    renderProjectVisuals();
    renderMilestoneList();
  }

  function renderProjects() {
    renderProjectList();
    renderProjectEditor();
  }

  async function addProject() {
    const now = Date.now();
    const project = {
      id: crypto.randomUUID(),
      name: '',
      note: '',
      createdAt: now,
      updatedAt: now,
    };
    await putRecord('projects', project);
    state.projects.push(project);
    state.selectedProjectId = project.id;
    renderProjects();
    elements.projectNameInput.focus();
  }

  function scheduleProjectSave() {
    const project = selectedProject();
    if (!project) return;
    project.name = elements.projectNameInput.value.trimStart();
    project.note = elements.projectNoteInput.value;
    project.updatedAt = Date.now();
    clearTimeout(state.projectSaveTimer);
    state.projectSaveTimer = setTimeout(async () => {
      await putRecord('projects', project);
      renderProjectList();
    }, 220);
  }

  async function addMilestone() {
    const project = selectedProject();
    if (!project) return;
    const existing = projectMilestones(project.id);
    const startDate = existing.length
      ? addDays(existing.reduce((value, item) => (item.endDate > value ? item.endDate : value), existing[0].endDate), 1)
      : todayString();
    const now = Date.now();
    const milestone = {
      id: crypto.randomUUID(),
      projectId: project.id,
      title: '',
      startDate,
      endDate: startDate,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    await putRecord('milestones', milestone);
    state.milestones.push(milestone);
    project.updatedAt = now;
    await putRecord('projects', project);
    renderProjects();
    elements.milestoneList.querySelector(`[data-id="${milestone.id}"] input[type="text"]`)?.focus();
  }

  async function removeSelectedProject() {
    const project = selectedProject();
    if (!project) return;
    if (!confirm(`确认删除“${project.name || '未命名项目'}”及其全部事件节点吗？`)) return;
    await deleteProjectAndMilestones(project.id);
    state.projects = state.projects.filter((item) => item.id !== project.id);
    state.milestones = state.milestones.filter((item) => item.projectId !== project.id);
    state.selectedProjectId = state.projects[0]?.id || null;
    renderProjects();
    showToast('项目已删除');
  }

  function renderEventList() {
    setViewLabels();
    renderCounts();
    const events = filteredEvents();
    elements.eventList.replaceChildren();

    if (events.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-list';
      const strong = document.createElement('strong');
      strong.textContent = state.search ? '没有匹配的事项' : '这里还没有事项';
      const span = document.createElement('span');
      span.textContent = state.search ? '换个关键词试试' : '点击“新建事项”开始记录';
      empty.append(strong, span);
      elements.eventList.append(empty);
      return;
    }

    for (const event of events) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'event-card';
      if (event.id === state.selectedId) card.classList.add('is-selected');
      if (event.completed) card.classList.add('is-completed');
      card.dataset.id = event.id;

      const check = document.createElement('span');
      check.className = 'event-check';
      check.textContent = '✓';

      const body = document.createElement('span');
      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = event.title || '未命名事项';
      const meta = document.createElement('div');
      meta.className = 'event-meta';
      const category = document.createElement('span');
      category.className = `event-category is-${event.category}`;
      category.textContent = event.category === 'production' ? '生产' : '实验';
      const note = document.createElement('span');
      note.textContent = event.note ? event.note.slice(0, 34) : '无备注';
      const imageMeta = document.createElement('span');
      imageMeta.textContent = event.imageCount ? `图片 ${event.imageCount}` : '';
      meta.append(category, note, imageMeta);
      body.append(title, meta);

      const date = document.createElement('span');
      date.className = 'event-date';
      date.textContent = formatDate(event.date);

      card.append(check, body, date);
      card.addEventListener('click', () => selectEvent(event.id));
      elements.eventList.append(card);
    }
  }

  async function renderDetail() {
    releaseObjectUrls();
    const event = selectedEvent();
    if (!event) {
      elements.emptyDetail.classList.remove('is-hidden');
      elements.detailContent.classList.add('is-hidden');
      return;
    }

    elements.emptyDetail.classList.add('is-hidden');
    elements.detailContent.classList.remove('is-hidden');
    elements.completeInput.checked = event.completed;
    elements.titleInput.value = event.title;
    elements.dateInput.value = event.date;
    elements.categoryInput.value = event.category;
    elements.customerInput.value = event.customer;
    elements.unitPriceInput.value = event.unitPrice || '';
    elements.quantityInput.value = event.quantity || '';
    elements.noteInput.value = event.note;
    renderProductionFields();
    await renderImages(event.id);
  }

  function renderProductionFields() {
    const isProduction = elements.categoryInput.value === 'production';
    elements.productionFields.classList.toggle('is-hidden', !isProduction);
    const total = Math.max(0, Number(elements.unitPriceInput.value) || 0)
      * Math.max(0, Number(elements.quantityInput.value) || 0);
    elements.productionTotal.textContent = formatMoney(total);
  }

  function releaseObjectUrls() {
    for (const url of state.objectUrls) URL.revokeObjectURL(url);
    state.objectUrls = [];
  }

  async function renderImages(eventId) {
    const images = await getEventImages(eventId);
    if (eventId !== state.selectedId) return;
    elements.imageGrid.replaceChildren();
    elements.imageCount.textContent = images.length;
    elements.dropHint.classList.toggle('is-hidden', images.length > 0);

    for (const image of images) {
      const url = URL.createObjectURL(image.blob);
      state.objectUrls.push(url);
      const card = document.createElement('div');
      card.className = 'image-card';
      const img = document.createElement('img');
      img.src = url;
      img.alt = image.name || '事项图片';
      img.addEventListener('click', () => openLightbox(url));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'image-remove';
      remove.title = '删除图片';
      remove.textContent = '×';
      remove.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (!confirm('确认从该事项中删除这张图片吗？')) return;
        await deleteRecord('images', image.id);
        await syncImageCount(image.eventId);
        await renderImages(image.eventId);
        renderEventList();
        showToast('图片已删除');
      });
      card.append(img, remove);
      elements.imageGrid.append(card);
    }
  }

  function openLightbox(url) {
    elements.lightboxImage.src = url;
    elements.lightbox.classList.remove('is-hidden');
  }

  function closeLightbox() {
    elements.lightbox.classList.add('is-hidden');
    elements.lightboxImage.removeAttribute('src');
  }

  async function reloadEvents() {
    state.events = (await getAll('events')).map(normalizeEvent);
    renderEventList();
  }

  async function selectEvent(id) {
    state.selectedId = id;
    renderEventList();
    await renderDetail();
  }

  async function addEvent() {
    const now = Date.now();
    const event = {
      id: crypto.randomUUID(),
      title: '',
      note: '',
      date: todayString(),
      completed: false,
      category: 'experiment',
      customer: '',
      unitPrice: 0,
      quantity: 0,
      imageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await putRecord('events', event);
    state.events.push(event);
    state.selectedId = event.id;
    state.filter = 'today';
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.filter === 'today');
    });
    renderEventList();
    await renderDetail();
    elements.titleInput.focus();
  }

  function scheduleSave() {
    const event = selectedEvent();
    if (!event) return;
    event.title = elements.titleInput.value.trimStart();
    event.note = elements.noteInput.value;
    event.date = elements.dateInput.value || todayString();
    event.completed = elements.completeInput.checked;
    event.category = elements.categoryInput.value === 'production' ? 'production' : 'experiment';
    event.customer = elements.customerInput.value.trimStart();
    event.unitPrice = Math.max(0, Number(elements.unitPriceInput.value) || 0);
    event.quantity = Math.max(0, Number(elements.quantityInput.value) || 0);
    event.updatedAt = Date.now();
    renderProductionFields();
    elements.saveState.textContent = '正在保存…';
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(async () => {
      await putRecord('events', event);
      elements.saveState.textContent = '已保存到本机';
      renderEventList();
      if (state.view === 'report') renderProductionReport();
    }, 220);
  }

  async function removeSelectedEvent() {
    const event = selectedEvent();
    if (!event) return;
    const title = event.title || '未命名事项';
    if (!confirm(`确认删除“${title}”吗？\n该事件关联的全部图片也会一并删除，且无法撤销。`)) return;
    clearTimeout(state.saveTimer);
    state.saveTimer = null;
    await deleteEventAndImages(event.id);
    state.events = state.events.filter((item) => item.id !== event.id);
    state.selectedId = null;
    renderEventList();
    await renderDetail();
    showToast('事件及其关联图片已删除');
  }

  async function syncImageCount(eventId) {
    const event = state.events.find((item) => item.id === eventId);
    if (!event) return;
    event.imageCount = (await getEventImages(eventId)).length;
    event.updatedAt = Date.now();
    await putRecord('events', event);
  }

  async function addImages(files) {
    const event = selectedEvent();
    if (!event) {
      showToast('请先选择或新建一个事项', true);
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file?.type?.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const existingImages = await getEventImages(event.id);
    const room = MAX_IMAGES - existingImages.length;
    if (room <= 0) {
      showToast(`每个事项最多保存 ${MAX_IMAGES} 张图片`, true);
      return;
    }

    const accepted = [];
    for (const file of imageFiles.slice(0, room)) {
      if (file.size > MAX_IMAGE_BYTES) {
        showToast(`“${file.name || '图片'}”超过 20 MB，已跳过`, true);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) return;
    elements.saveState.textContent = `正在保存 ${accepted.length} 张图片…`;
    const transaction = state.db.transaction('images', 'readwrite');
    const store = transaction.objectStore('images');
    accepted.forEach((file, index) => {
      store.put({
        id: crypto.randomUUID(),
        eventId: event.id,
        name: file.name || `粘贴图片-${Date.now()}-${index + 1}.png`,
        type: file.type,
        size: file.size,
        order: existingImages.length + index,
        createdAt: Date.now() + index,
        blob: file,
      });
    });
    await transactionDone(transaction);
    await syncImageCount(event.id);
    await renderImages(event.id);
    renderEventList();
    elements.saveState.textContent = '已保存到本机';
    showToast(`已添加 ${accepted.length} 张图片`);
  }

  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) toast.classList.add('is-error');
    toast.textContent = message;
    elements.toastRegion.append(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    const [header, encoded] = dataUrl.split(',');
    const type = /data:([^;]+)/.exec(header)?.[1] || 'application/octet-stream';
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type });
  }

  async function exportBackup() {
    try {
      showToast('正在整理备份…');
      const events = await getAll('events');
      const rawImages = await getAll('images');
      const projects = await getAll('projects');
      const milestones = await getAll('milestones');
      const statements = await getAll('statements');
      const images = [];
      for (const image of rawImages) {
        images.push({
          ...image,
          blob: undefined,
          dataUrl: await blobToDataUrl(image.blob),
        });
      }
      const payload = JSON.stringify({
        format: 'todo-list-local-backup',
        version: 3,
        exportedAt: new Date().toISOString(),
        events,
        images,
        projects,
        milestones,
        statements,
      });
      const result = await window.localTodo.saveBackup(payload);
      if (!result.canceled) showToast('备份已导出');
    } catch (error) {
      console.error(error);
      showToast('导出失败，请重试', true);
    }
  }

  async function importBackup() {
    try {
      const result = await window.localTodo.openBackup();
      if (result.canceled) return;
      const payload = JSON.parse(result.content);
      if (payload.format !== 'todo-list-local-backup' || ![1, 2, 3].includes(payload.version)) {
        throw new Error('不支持的备份格式');
      }
      if (!confirm('导入会替换当前本地数据。确定继续吗？')) return;

      const transaction = state.db.transaction(['events', 'images', 'projects', 'milestones', 'statements'], 'readwrite');
      const eventStore = transaction.objectStore('events');
      const imageStore = transaction.objectStore('images');
      const projectStore = transaction.objectStore('projects');
      const milestoneStore = transaction.objectStore('milestones');
      const statementStore = transaction.objectStore('statements');
      eventStore.clear();
      imageStore.clear();
      projectStore.clear();
      milestoneStore.clear();
      statementStore.clear();
      for (const event of payload.events || []) eventStore.put(event);
      for (const image of payload.images || []) {
        imageStore.put({
          ...image,
          dataUrl: undefined,
          blob: dataUrlToBlob(image.dataUrl),
        });
      }
      for (const project of payload.projects || []) projectStore.put(project);
      for (const milestone of payload.milestones || []) milestoneStore.put(milestone);
      for (const statement of payload.statements || []) statementStore.put(statement);
      await transactionDone(transaction);
      state.selectedId = null;
      state.selectedProjectId = null;
      await reloadEvents();
      state.projects = await getAll('projects');
      state.milestones = await getAll('milestones');
      state.statements = await getAll('statements');
      await renderDetail();
      renderProjects();
      renderSalesTrend();
      renderStatements();
      showToast('备份已导入');
    } catch (error) {
      console.error(error);
      showToast(`导入失败：${error.message}`, true);
    }
  }

  function bindEvents() {
    elements.addButton.addEventListener('click', addEvent);
    elements.addProjectButton.addEventListener('click', addProject);
    elements.addMilestoneButton.addEventListener('click', addMilestone);
    elements.deleteEventButton.addEventListener('click', removeSelectedEvent);
    elements.deleteProjectButton.addEventListener('click', removeSelectedProject);
    elements.titleInput.addEventListener('input', scheduleSave);
    elements.noteInput.addEventListener('input', scheduleSave);
    elements.dateInput.addEventListener('change', scheduleSave);
    elements.completeInput.addEventListener('change', scheduleSave);
    elements.categoryInput.addEventListener('change', scheduleSave);
    elements.customerInput.addEventListener('input', scheduleSave);
    elements.unitPriceInput.addEventListener('input', scheduleSave);
    elements.quantityInput.addEventListener('input', scheduleSave);
    elements.projectNameInput.addEventListener('input', scheduleProjectSave);
    elements.projectNoteInput.addEventListener('input', scheduleProjectSave);
    elements.imageInput.addEventListener('change', async (event) => {
      await addImages(event.target.files);
      event.target.value = '';
    });
    elements.searchInput.addEventListener('input', (event) => {
      state.search = event.target.value;
      renderEventList();
    });
    elements.exportButton.addEventListener('click', exportBackup);
    elements.importButton.addEventListener('click', importBackup);
    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightbox.addEventListener('click', (event) => {
      if (event.target === elements.lightbox) closeLightbox();
    });

    document.querySelectorAll('.nav-item[data-filter]').forEach((item) => {
      item.addEventListener('click', () => {
        state.filter = item.dataset.filter;
        switchView('events');
        renderEventList();
      });
    });
    elements.ganttNavButton.addEventListener('click', () => switchView('gantt'));
    elements.reportNavButton.addEventListener('click', () => switchView('report'));
    elements.salesTrendNavButton.addEventListener('click', () => switchView('sales'));
    elements.statementNavButton.addEventListener('click', () => switchView('statements'));
    elements.reportPeriodMode.addEventListener('change', () => {
      state.reportMode = elements.reportPeriodMode.value === 'year' ? 'year' : 'month';
      renderProductionReport();
    });
    elements.reportMonthInput.addEventListener('change', () => {
      state.reportMonth = elements.reportMonthInput.value || todayString().slice(0, 7);
      renderProductionReport();
    });
    elements.reportYearInput.addEventListener('change', () => {
      state.reportYear = elements.reportYearInput.value || todayString().slice(0, 4);
      renderProductionReport();
    });
    elements.printReportButton.addEventListener('click', () => printCurrentView('report'));
    elements.salesTrendMode.addEventListener('change', () => {
      state.salesTrendMode = elements.salesTrendMode.value === 'annual' ? 'annual' : 'monthly';
      renderSalesTrend();
    });
    elements.salesTrendYear.addEventListener('change', () => {
      state.salesTrendYear = elements.salesTrendYear.value || todayString().slice(0, 4);
      renderSalesTrend();
    });
    elements.salesCustomerFilter.addEventListener('change', () => {
      state.salesCustomer = elements.salesCustomerFilter.value || 'all';
      renderSalesTrend();
    });
    elements.printSalesTrendButton.addEventListener('click', () => printCurrentView('sales'));
    elements.statementMonthInput.addEventListener('change', () => {
      state.statementMonth = elements.statementMonthInput.value || todayString().slice(0, 7);
      state.selectedStatementId = null;
      renderStatements();
    });
    elements.generateStatementsButton.addEventListener('click', regenerateStatements);
    elements.printStatementButton.addEventListener('click', () => {
      if (!state.selectedStatementId) {
        showToast('请先选择一份客户对账单', true);
        return;
      }
      printCurrentView('statement');
    });
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-report', 'print-statement', 'print-sales');
    });

    document.addEventListener('paste', async (event) => {
      if (!state.selectedId || !event.clipboardData) return;
      const files = Array.from(event.clipboardData.items)
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter(Boolean);
      if (files.length === 0) return;
      event.preventDefault();
      await addImages(files);
    });

    for (const eventName of ['dragenter', 'dragover']) {
      elements.imageDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.imageDropZone.classList.add('is-dragging');
      });
    }
    for (const eventName of ['dragleave', 'drop']) {
      elements.imageDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.imageDropZone.classList.remove('is-dragging');
      });
    }
    elements.imageDropZone.addEventListener('drop', (event) => addImages(event.dataTransfer.files));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !elements.lightbox.classList.contains('is-hidden')) {
        closeLightbox();
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        if (state.view === 'gantt') addProject();
        else {
          if (state.view === 'report' || state.view === 'statements' || state.view === 'sales') switchView('events');
          addEvent();
        }
      }
    });

    window.addEventListener('focus', async () => {
      state.events = (await getAll('events')).map(normalizeEvent);
      await rolloverIncompleteEvents(true);
      await generateDueStatements(true);
      renderEventList();
      if (state.view === 'report') renderProductionReport();
      if (state.view === 'statements') renderStatements();
      if (state.view === 'sales') renderSalesTrend();
    });
  }

  async function start() {
    try {
      state.db = await openDatabase();
      state.reportMonth = todayString().slice(0, 7);
      state.reportYear = todayString().slice(0, 4);
      state.salesTrendYear = todayString().slice(0, 4);
      state.statementMonth = '';
      bindEvents();
      state.events = (await getAll('events')).map(normalizeEvent);
      state.projects = await getAll('projects');
      state.milestones = await getAll('milestones');
      state.statements = await getAll('statements');
      await rolloverIncompleteEvents(true);
      await generateDueStatements(true);
      if (!state.statementMonth) {
        const latestStatement = [...state.statements].sort((a, b) => b.period.localeCompare(a.period))[0];
        state.statementMonth = latestStatement?.period || todayString().slice(0, 7);
      }
      renderEventList();
      renderProjects();
      renderProductionReport();
      renderSalesTrend();
      renderStatements();
      await renderDetail();
      scheduleMidnightRollover();
      scheduleStatementGeneration();
    } catch (error) {
      console.error(error);
      showToast('本地数据库启动失败', true);
    }
  }

  start();
})();
