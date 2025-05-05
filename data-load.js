import {sfConn, apiVersion} from "./inspector.js";

// Inspired by C# System.Linq.Enumerable
export function Enumerable(iterable) {
  this[Symbol.iterator] = iterable[Symbol.iterator].bind(iterable);
}
Enumerable.prototype = {
  __proto__: function*(){}.prototype,
  *map(f) {
    for (let e of this) {
      yield f(e);
    }
  },
  *filter(f) {
    for (let e of this) {
      if (f(e)) {
        yield e;
      }
    }
  },
  *flatMap(f) {
    for (let e of this) {
      yield* f(e);
    }
  },
  *concat(other) {
    yield* this;
    yield* other;
  },
  some() {
    for (let e of this) {
      return true;
    }
    return false;
  },
  toArray() {
    return Array.from(this);
  }
};
Enumerable.prototype.map.prototype = Enumerable.prototype;
Enumerable.prototype.filter.prototype = Enumerable.prototype;
Enumerable.prototype.flatMap.prototype = Enumerable.prototype;
Enumerable.prototype.concat.prototype = Enumerable.prototype;

// @param didUpdate: A callback function to listen for updates to describe data
export function DescribeInfo(spinFor, didUpdate) {
  function initialState() {
    return {
      data: {global: {globalStatus: "pending", globalDescribe: null}, sobjects: null},
      tool: {global: {globalStatus: "pending", globalDescribe: null}, sobjects: null}
    };
  }
  let sobjectAllDescribes = initialState();
  function getGlobal(useToolingApi) {
    let apiDescribes = sobjectAllDescribes[useToolingApi ? "tool" : "data"];
    if (apiDescribes.global.globalStatus == "pending") {
      apiDescribes.global.globalStatus = "loading";
      console.log(useToolingApi ? "getting tooling objects" : "getting objects");
      spinFor(sfConn.rest(useToolingApi ? "/services/data/v" + apiVersion + "/tooling/sobjects/" : "/services/data/v" + apiVersion + "/sobjects/").then(res => {
        apiDescribes.global.globalStatus = "ready";
        apiDescribes.global.globalDescribe = res;
        apiDescribes.sobjects = new Map();
        for (let sobjectDescribe of res.sobjects) {
          apiDescribes.sobjects.set(sobjectDescribe.name.toLowerCase(), {global: sobjectDescribe, sobject: {sobjectStatus: "pending", sobjectDescribe: null}});
        }
        didUpdate();
      }, () => {
        apiDescribes.global.globalStatus = "loadfailed";
        didUpdate();
      }));
    }
    return apiDescribes;
  }
  // Makes global and sobject describe API calls, and caches the results.
  // If the result of an API call is not already cashed, empty data is returned immediately, and the API call is made asynchronously.
  // The caller is notified using the didUpdate callback or the spinFor promise when the API call completes, so it can make the call again to get the cached results.
  return {
    // Returns an object with two properties:
    // - globalStatus: a string with one of the following values:
    //    "pending": (has not started loading, never returned by this function)
    //    "loading": Describe info for the api is being downloaded
    //    "loadfailed": Downloading of describe info for the api failed
    //    "ready": Describe info is available
    // - globalDescribe: contains a DescribeGlobalResult if it has been loaded
    describeGlobal(useToolingApi) {
      return getGlobal(useToolingApi).global;
    },
    // Returns an object with two properties:
    // - sobjectStatus: a string with one of the following values:
    //    "pending": (has not started loading, never returned by this function)
    //    "notfound": The object does not exist
    //    "loading": Describe info for the object is being downloaded
    //    "loadfailed": Downloading of describe info for the object failed
    //    "ready": Describe info is available
    // - sobjectDescribe: contains a DescribeSObjectResult if the object exists and has been loaded
    describeSobject(useToolingApi, sobjectName) {
      let apiDescribes = getGlobal(useToolingApi);
      if (!apiDescribes.sobjects) {
        return {sobjectStatus: apiDescribes.global.globalStatus, sobjectDescribe: null};
      }
      let sobjectInfo = apiDescribes.sobjects.get(sobjectName.toLowerCase());
      if (!sobjectInfo) {
        return {sobjectStatus: "notfound", sobjectDescribe: null};
      }
      if (sobjectInfo.sobject.sobjectStatus == "pending") {
        sobjectInfo.sobject.sobjectStatus = "loading";
        console.log("getting fields for " + sobjectInfo.global.name);
        spinFor(sfConn.rest(sobjectInfo.global.urls.describe).then(res => {
          sobjectInfo.sobject.sobjectStatus = "ready";
          sobjectInfo.sobject.sobjectDescribe = res;
          didUpdate();
        }, () => {
          sobjectInfo.sobject.sobjectStatus = "loadfailed";
          didUpdate();
        }));
      }
      return sobjectInfo.sobject;
    },
    reloadAll() {
      sobjectAllDescribes = initialState();
      didUpdate();
    }
  };
}

// Pluralize a numeric value by adding an s (or optional suffix) if it is not 1
export function s(num, suffix = "s") {
  return num == 1 ? "" : suffix;
}

// Copy text to the clipboard, without rendering it, since rendering is slow.
export function copyToClipboard(value) {
  if (parent && parent.isUnitTest) { // for unit tests
    parent.testClipboardValue = value;
    return;
  }
  // Use execCommand to trigger an oncopy event and use an event handler to copy the text to the clipboard.
  // The oncopy event only works on editable elements, e.g. an input field.
  let temp = document.createElement("input");
  // The oncopy event only works if there is something selected in the editable element.
  temp.value = "temp";
  temp.addEventListener("copy", e => {
    e.clipboardData.setData("text/plain", value);
    e.preventDefault();
  });
  document.body.appendChild(temp);
  try {
    // The oncopy event only works if there is something selected in the editable element.
    temp.select();
    // Trigger the oncopy event
    let success = document.execCommand("copy");
    if (!success) {
      alert("Copy failed");
    }
  } finally {
    document.body.removeChild(temp);
  }
}

// Hiển thị thông báo khi copy thành công
function showCopyNotification(element, message) {
  const notification = document.createElement("div");
  notification.className = "copy-notification";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Định vị thông báo gần vị trí nút đã nhấp
  const rect = element.getBoundingClientRect();
  notification.style.top = `${rect.bottom + 5}px`;
  notification.style.left = `${rect.left}px`;
  
  // Hiển thị trong 2 giây rồi biến mất
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 1500);
}

// Lưu trữ trạng thái filter cho nhiều cột
// Khi bộ lọc được áp dụng ở bất kỳ cột nào, thông tin lọc sẽ được lưu ở đây
let activeColumnFilters = new Map();

// Reset tất cả bộ lọc đang hoạt động
function resetAllFilters(data) {
  activeColumnFilters.clear();
  
  // Khôi phục tất cả các dòng về trạng thái hiển thị
  for (let r = 1; r < data.table.length; r++) {
    data.rowVisibilities[r] = true;
  }
  
  // Cập nhật giao diện
  const updateEvent = new CustomEvent('scrolltable-filter-applied', { detail: data });
  document.dispatchEvent(updateEvent);
}

// Hiển thị indicator cho các cột có filter
function updateFilterButtonState() {
  // Xóa tất cả indicator hiện tại
  document.querySelectorAll('.filter-active').forEach(el => {
    el.classList.remove('filter-active');
  });
  
  // Thêm indicator cho các cột có filter đang hoạt động
  activeColumnFilters.forEach((filterValues, columnIndex) => {
    const filterButtons = document.querySelectorAll('.header-filter-btn');
    for (const btn of filterButtons) {
      if (parseInt(btn.dataset.columnIndex) === columnIndex) {
        btn.classList.add('filter-active');
      }
    }
  });

  // Đảm bảo tất cả các nút filter được hiển thị
  document.querySelectorAll('.header-filter-btn').forEach(btn => {
    btn.style.display = '';
  });
}

// Áp dụng tất cả các bộ lọc hiện có cho dữ liệu
function applyAllFilters(data) {
  // Đặt tất cả các dòng về hiển thị mặc định nếu không có bộ lọc
  if (activeColumnFilters.size === 0) {
    for (let r = 1; r < data.table.length; r++) {
      data.rowVisibilities[r] = true;
    }
    return;
  }
  
  // Áp dụng tất cả các bộ lọc hiện tại
  for (let r = 1; r < data.table.length; r++) {
    let rowVisible = true; // Row starts as visible
    
    // Kiểm tra từng bộ lọc hoạt động
    activeColumnFilters.forEach((filterValues, columnIndex) => {
      if (!rowVisible) return; // Nếu hàng đã bị ẩn bởi bộ lọc trước đó, bỏ qua
      
      const cell = data.table[r][columnIndex];
      
      if (cell == null) {
        // Kiểm tra xem giá trị trống có được chọn trong bộ lọc không
        if (!filterValues.has("(blank)")) {
          rowVisible = false;
        }
      } else {
        // Chuyển đổi giá trị thành chuỗi hiển thị để so sánh với bộ lọc
        const displayValue = typeof cell === "object" && cell !== null ?
          (cell.attributes && cell.attributes.type ? cell.attributes.type : JSON.stringify(cell)) :
          String(cell);
        
        // Kiểm tra giá trị có trong bộ lọc không
        if (!filterValues.has(displayValue)) {
          rowVisible = false;
        }
      }
    });
    
    // Áp dụng trạng thái hiển thị cuối cùng
    data.rowVisibilities[r] = rowVisible;
  }
}

// Collect all values from a specific column and format them as 'value1', 'value2', etc.
function collectColumnValues(data, columnIndex, format = "quoted") {
  let values = [];
  // Start from row 1 to skip headers
  for (let r = 1; r < data.table.length; r++) {
    if (data.rowVisibilities[r] && data.table[r][columnIndex] != null) {
      const value = data.table[r][columnIndex];
      
      // Format value based on its type
      if (typeof value === "object" && value !== null) {
        if (value.attributes && value.attributes.type) {
          // Handle Salesforce record references
          const recordId = value.attributes.url ? value.attributes.url.replace(/.*\//, "") : null;
          values.push(recordId || value.attributes.type);
        } else {
          // Handle other objects
          values.push(JSON.stringify(value));
        }
      } else {
        // Escape special characters in string
        let safeValue = String(value).replace(/'/g, "\\'");
        values.push(safeValue);
      }
    }
  }
  
  // Apply different formatting based on requested format
  switch (format) {
    case "quoted":
      return values.map(v => `'${v}'`).join(", ");
    case "csv":
      return values.join(",");
    case "list":
      return values.join("\n");
    case "plain":
    default:
      return values.join(", ");
  }
}

// Thêm nút copy với menu tùy chọn định dạng
function addCopyButton(td, data, c) {
  // Tìm hoặc tạo container cho các nút trong header
  let buttonsContainer = td.querySelector('.header-buttons');
  if (!buttonsContainer) {
    buttonsContainer = document.createElement("div");
    buttonsContainer.className = "header-buttons";
    td.appendChild(buttonsContainer);
  }

  // Kiểm tra xem nút đã tồn tại chưa
  let copyBtn = buttonsContainer.querySelector('.header-copy-btn');
  if (!copyBtn) {
    copyBtn = document.createElement("div");
    copyBtn.className = "header-copy-btn";
    copyBtn.title = "Copy column values";
    copyBtn.dataset.columnIndex = c;
    
    // Xử lý click mặc định (sao chép định dạng quoted)
    copyBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Kiểm tra xem menu đã hiển thị chưa
      let existingMenu = document.querySelector(".copy-options-menu");
      if (existingMenu) {
        existingMenu.remove();
        return;
      }
      
      // Tạo menu tùy chọn
      const menu = document.createElement("div");
      menu.className = "copy-options-menu";
      menu.innerHTML = `
        <div class="copy-option" data-format="quoted">Copy as 'value1', 'value2'</div>
        <div class="copy-option" data-format="csv">Copy as CSV</div>
        <div class="copy-option" data-format="plain">Copy as plain text</div>
        <div class="copy-option" data-format="list">Copy as list (one per line)</div>
      `;
      
      // Định vị menu với xử lý thông minh theo cạnh màn hình
      const rect = copyBtn.getBoundingClientRect();
      menu.style.position = "fixed";
      
      // Kiểm tra vị trí theo chiều ngang và điều chỉnh
      if (rect.left < 180) { // Nếu gần mép trái, hiển thị bên phải nút
        menu.style.left = `${rect.right + 2}px`;
      } else { // Ngược lại hiển thị ở bên trái nút
        menu.style.left = `${rect.left - 180}px`;
      }
      
      // Kiểm tra vị trí theo chiều dọc và điều chỉnh
      if (window.innerHeight - rect.bottom < 150) { // Nếu gần mép dưới, hiển thị phía trên
        menu.style.bottom = `${window.innerHeight - rect.top + 5}px`;
      } else { // Ngược lại hiển thị phía dưới
        menu.style.top = `${rect.bottom + 5}px`;
      }
      
      menu.style.zIndex = "1000";
      
      // Xử lý sự kiện click các tùy chọn
      menu.addEventListener("click", function(e) {
        e.stopPropagation();
        const option = e.target.closest(".copy-option");
        if (option) {
          const format = option.dataset.format;
          const columnIndex = parseInt(copyBtn.dataset.columnIndex);
          const columnValues = collectColumnValues(data, columnIndex, format);
          if (columnValues) {
            copyToClipboard(columnValues);
            showCopyNotification(copyBtn, `Copied as ${format} format!`);
          } else {
            showCopyNotification(copyBtn, "No data to copy", "error");
          }
          menu.remove();
        }
      });
      
      // Xóa menu khi click bên ngoài
      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== copyBtn) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      });
      
      // Thêm menu vào body để tránh vấn đề overflow
      document.body.appendChild(menu);
    });
    
    buttonsContainer.appendChild(copyBtn);
  }
}

// Thêm nút filter cho mỗi cột
function addFilterButton(td, data, c) {
  // Tìm hoặc tạo container cho các nút trong header
  let buttonsContainer = td.querySelector('.header-buttons');
  if (!buttonsContainer) {
    buttonsContainer = document.createElement("div");
    buttonsContainer.className = "header-buttons";
    td.appendChild(buttonsContainer);
  }

  // Kiểm tra xem nút filter đã tồn tại chưa
  let filterBtn = buttonsContainer.querySelector('.header-filter-btn');
  
  // Nếu chưa có, tạo mới nút filter
  if (!filterBtn) {
    filterBtn = document.createElement("div");
    filterBtn.className = "header-filter-btn";
    filterBtn.title = "Filter column values";
    filterBtn.dataset.columnIndex = c;
    
    // Xử lý sự kiện click cho nút filter
    filterBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      showFilterDialog(this, data);
    });
    
    buttonsContainer.appendChild(filterBtn);
  }
  
  // Cập nhật trạng thái hiển thị của nút filter
  if (activeColumnFilters.has(parseInt(c))) {
    filterBtn.classList.add("filter-active");
  } else {
    filterBtn.classList.remove("filter-active");
  }
}

// Tách logic hiển thị bảng lọc thành hàm riêng
function showFilterDialog(filterBtn, data) {
  const columnIndex = parseInt(filterBtn.dataset.columnIndex);
  
  // Thu thập các giá trị duy nhất từ cột
  const uniqueValues = new Map();
  const hasBlankValues = new Set();
  
  // Lưu lại filter hiện tại của cột này (nếu có)
  const currentFilterState = activeColumnFilters.get(columnIndex);
  
  // Tạm thời xóa filter của cột hiện tại để thu thập đầy đủ các giá trị
  activeColumnFilters.delete(columnIndex);
  
  // Xác định các hàng hiển thị dựa trên các filter khác
  const visibleRows = new Set();
  for (let r = 1; r < data.table.length; r++) {
    let visible = true;
    
    // Kiểm tra các filter đang hoạt động (ngoại trừ filter của cột hiện tại)
    activeColumnFilters.forEach((filterValues, filterColumnIndex) => {
      if (!visible) return;
      
      const cellValue = data.table[r][filterColumnIndex];
      if (cellValue == null) {
        if (!filterValues.has("(blank)")) {
          visible = false;
        }
      } else {
        const displayValue = typeof cellValue === "object" && cellValue !== null ?
          (cellValue.attributes && cellValue.attributes.type ? cellValue.attributes.type : JSON.stringify(cellValue)) :
          String(cellValue);
        
        if (!filterValues.has(displayValue)) {
          visible = false;
        }
      }
    });
    
    if (visible) {
      visibleRows.add(r);
    }
  }
  
  // Thu thập các giá trị độc nhất trong cột
  for (let r = 1; r < data.table.length; r++) {
    // Chỉ xem xét hàng hiển thị nếu có filter khác đang hoạt động
    if (activeColumnFilters.size > 0 && !visibleRows.has(r)) {
      continue;
    }
    
    const value = data.table[r][columnIndex];
    
    if (value == null) {
      hasBlankValues.add(r);
      continue;
    }
    
    const displayValue = typeof value === "object" && value !== null ? 
      (value.attributes && value.attributes.type ? value.attributes.type : JSON.stringify(value)) : 
      String(value);
    
    uniqueValues.set(displayValue, {
      display: displayValue,
      originalValue: value,
      count: (uniqueValues.get(displayValue)?.count || 0) + 1
    });
  }
  
  // Khôi phục filter của cột hiện tại nếu có
  if (currentFilterState) {
    activeColumnFilters.set(columnIndex, currentFilterState);
  }
  
  // Xóa hộp thoại filter cũ nếu có
  let existingDialog = document.querySelector(".filter-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }
  
  // Tạo hộp thoại filter mới
  const filterDialog = document.createElement("div");
  filterDialog.className = "filter-dialog";
  filterDialog.innerHTML = `
    <div class="filter-header">
      <div>Filter: ${data.table[0][columnIndex]}</div>
      <div class="filter-close">×</div>
    </div>
    <input type="text" class="filter-search" placeholder="Search values...">
    <div class="filter-options"></div>
    <div class="filter-actions">
      <button class="filter-select-all">Select All</button>
      <button class="filter-clear-all">Clear All</button>
      <button class="filter-apply">Apply Filter</button>
    </div>
  `;
  
  // Thêm các tùy chọn lọc
  const filterOptions = filterDialog.querySelector(".filter-options");
  
  // Sắp xếp các giá trị
  const sortedValues = Array.from(uniqueValues.values())
    .sort((a, b) => a.display.localeCompare(b.display));
  
  // Kiểm tra filter hiện tại
  const currentFilter = activeColumnFilters.get(columnIndex);
  
  // Thêm tùy chọn "(blank)"
  if (hasBlankValues.size > 0) {
    const option = document.createElement("div");
    option.className = "filter-option";
    const isChecked = !currentFilter || currentFilter.has("(blank)") ? "checked" : "";
    option.innerHTML = `
      <input type="checkbox" id="filter-blank" data-value="(blank)" ${isChecked}>
      <label for="filter-blank">(blank) (${hasBlankValues.size})</label>
    `;
    filterOptions.appendChild(option);
  }
  
  // Thêm các giá trị không trống
  sortedValues.forEach((item, idx) => {
    const option = document.createElement("div");
    option.className = "filter-option";
    const isChecked = !currentFilter || currentFilter.has(item.display) ? "checked" : "";
    option.innerHTML = `
      <input type="checkbox" id="filter-${idx}" data-value="${item.display}" ${isChecked}>
      <label for="filter-${idx}">${item.display} (${item.count})</label>
    `;
    filterOptions.appendChild(option);
  });
  
  // Xử lý tìm kiếm
  const searchInput = filterDialog.querySelector(".filter-search");
  searchInput.addEventListener("input", () => {
    const searchText = searchInput.value.toLowerCase();
    filterDialog.querySelectorAll(".filter-option").forEach(option => {
      const label = option.querySelector("label").textContent.toLowerCase();
      option.style.display = label.includes(searchText) ? "block" : "none";
    });
  });
  
  // Xử lý đóng hộp thoại
  filterDialog.querySelector(".filter-close").addEventListener("click", () => {
    filterDialog.remove();
  });
  
  // Xử lý nút chọn tất cả
  filterDialog.querySelector(".filter-select-all").addEventListener("click", () => {
    filterDialog.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
  });
  
  // Xử lý nút bỏ chọn tất cả
  filterDialog.querySelector(".filter-clear-all").addEventListener("click", () => {
    filterDialog.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
  });
  
  // Xử lý áp dụng bộ lọc
  filterDialog.querySelector(".filter-apply").addEventListener("click", () => {
    // Thu thập các giá trị được chọn
    const selectedValues = new Set();
    filterDialog.querySelectorAll("input[type=checkbox]:checked").forEach(cb => {
      selectedValues.add(cb.dataset.value);
    });
    
    // Lưu trạng thái bộ lọc
    if (selectedValues.size > 0) {
      activeColumnFilters.set(columnIndex, selectedValues);
    } else {
      activeColumnFilters.delete(columnIndex);
    }
    
    // Áp dụng tất cả các bộ lọc
    applyAllFilters(data);
    
    // Cập nhật giao diện
    const updateEvent = new CustomEvent('scrolltable-filter-applied', { detail: data });
    document.dispatchEvent(updateEvent);
    
    // Cập nhật trạng thái nút filter
    updateFilterButtonStates();
    
    filterDialog.remove();
  });
  
  // Đóng hộp thoại khi click bên ngoài
  const closeDialogOnOutsideClick = (evt) => {
    if (!filterDialog.contains(evt.target) && evt.target !== filterBtn) {
      filterDialog.remove();
      document.removeEventListener('click', closeDialogOnOutsideClick);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeDialogOnOutsideClick);
  }, 100);
  
  document.body.appendChild(filterDialog);
  
  // Định vị hộp thoại
  const rect = filterBtn.getBoundingClientRect();
  filterDialog.style.top = `${rect.bottom + 10}px`;
  filterDialog.style.left = `${rect.left}px`;
  
  // Tránh hiển thị ra ngoài khung nhìn
  const dialogRect = filterDialog.getBoundingClientRect();
  if (dialogRect.right > window.innerWidth) {
    filterDialog.style.left = `${window.innerWidth - dialogRect.width - 10}px`;
  }
  if (dialogRect.bottom > window.innerHeight) {
    filterDialog.style.top = `${rect.top - dialogRect.height - 10}px`;
  }
}

// Cập nhật trạng thái của tất cả các nút filter
function updateFilterButtonStates() {
  // Cập nhật trạng thái của tất cả nút filter trong bảng
  document.querySelectorAll('.header-filter-btn').forEach(btn => {
    const colIndex = parseInt(btn.dataset.columnIndex);
    if (activeColumnFilters.has(colIndex)) {
      btn.classList.add('filter-active');
    } else {
      btn.classList.remove('filter-active');
    }
  });
}

// Hiển thị thông báo khi filter được áp dụng thành công
function showFilterNotification(element, message) {
  const notification = document.createElement("div");
  notification.className = "copy-notification";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Định vị thông báo gần vị trí nút đã nhấp
  const rect = element.getBoundingClientRect();
  notification.style.top = `${rect.bottom + 5}px`;
  notification.style.left = `${rect.left}px`;
  
  // Hiển thị trong 2 giây rồi biến mất
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 1500);
}

function renderCell(rt, cell, td) {
  // Nếu đây là ô header, bọc nội dung trong thẻ span
  if (td.classList.contains('header')) {
    // Tạo container cho nội dung cell
    const contentSpan = document.createElement('span');
    contentSpan.className = 'cell-content';
    td.appendChild(contentSpan);
    
    // Tiếp tục với logic render nội dung nhưng chỉ định nơi đổ nội dung là contentSpan
    renderCellContent(rt, cell, contentSpan);
  } else {
    // Ô thường, sử dụng logic cũ
    renderCellContent(rt, cell, td);
  }
}

// Tách logic render nội dung thành hàm riêng
function renderCellContent(rt, cell, container) {
  function popLink(recordInfo, label) {
    let a = document.createElement("a");
    a.href = "about:blank";
    a.title = "Show all data";
    a.addEventListener("click", e => {
      e.preventDefault();
      let pop = document.createElement("div");
      pop.className = "pop-menu";
      // Thay đổi: Xác định đúng vị trí container khi click
      let parentTd = container;
      while (parentTd && !parentTd.classList.contains('scrolltable-cell')) {
        parentTd = parentTd.parentNode;
      }
      if (!parentTd) parentTd = container;
      parentTd.appendChild(pop);
      
      let {objectTypes, recordId} = recordInfo();
      let objectType = undefined;
      function setLinks(){
        let aShow = document.createElement("a");
        let args = new URLSearchParams();
        args.set("host", rt.sfHost);
        args.set("objectType", objectType);
        if (rt.isTooling) {
          args.set("useToolingApi", "1");
        }
        if (recordId) {
          args.set("recordId", recordId);
        }
        aShow.href = "inspect.html?" + args;
        aShow.target = "_blank";
        aShow.textContent = "Show all data";
        aShow.className = "view-inspector";
        let aShowIcon = document.createElement("div");
        aShowIcon.className = "icon";
        pop.appendChild(aShow);
        aShow.prepend(aShowIcon);

        //Query Record
        let aQuery = document.createElement("a");
        let query = "SELECT Id FROM " + objectType + " WHERE Id = '" + recordId + "'";
        let queryArgs = new URLSearchParams();
        queryArgs.set("host", rt.sfHost);
        queryArgs.set("query", query);
        aQuery.href = "data-export.html?" + queryArgs;
        aQuery.target = "_blank";
        aQuery.textContent = "Query Record";
        aQuery.className = "query-record";
        let aqueryIcon = document.createElement("div");
        aqueryIcon.className = "icon";
        pop.appendChild(aQuery);
        aQuery.prepend(aqueryIcon);

        // If the recordId ends with 0000000000AAA it is a dummy ID such as the ID for the master record type 012000000000000AAA
        if (recordId && isRecordId(recordId) && !recordId.endsWith("0000000000AAA")) {
          let aView = document.createElement("a");
          aView.href = "https://" + rt.sfHost + "/" + recordId;
          aView.target = "_blank";
          aView.textContent = "View in Salesforce";
          aView.className = "view-salesforce";
          let aviewIcon = document.createElement("div");
          aviewIcon.className = "icon";
          pop.appendChild(aView);
          aView.prepend(aviewIcon);
        }

        //Download event logFile
        if (isEventLogFile(recordId)) {
          let aDownload = document.createElement("a");
          aDownload.id = recordId;
          aDownload.target = "_blank";
          aDownload.textContent = "Download File";
          aDownload.className = "download-salesforce";
          let aDownloadIcon = document.createElement("div");
          aDownloadIcon.className = "icon";
          pop.appendChild(aDownload);
          aDownload.prepend(aDownloadIcon);
          aDownload.addEventListener("click", e => {
            sfConn.rest(e.target.id, {responseType: "text/csv"}).then(data => {
              let downloadLink = document.createElement("a");
              downloadLink.download = recordId.split("/")[6];
              downloadLink.href = "data:text/csv;charset=utf-8," + data;
              downloadLink.click();
            });
            parentTd.removeChild(pop);
          });
        } else {
          //copy to clipboard
          let aCopy = document.createElement("a");
          aCopy.className = "copy-id";
          aCopy.textContent = "Copy Id";
          aCopy.id = recordId;
          let acopyIcon = document.createElement("div");
          acopyIcon.className = "icon";
          pop.appendChild(aCopy);
          aCopy.prepend(acopyIcon);
          aCopy.addEventListener("click", e => {
            navigator.clipboard.writeText(e.target.id);
            parentTd.removeChild(pop);
          });
        }
      }
      if (objectTypes.length === 1){
        objectType = objectTypes[0];
        setLinks();
      } else {
        sfConn.rest(`/services/data/v${apiVersion}/ui-api/records/${recordId}?layoutTypes=Compact`).then(res => {
          objectType = res.apiName;
          setLinks();
        });
      }
      function closer(ev) {
        if (ev != e && ev.target.closest(".pop-menu") != pop) {
          removeEventListener("click", closer);
          pop.remove();
        }
      }
      addEventListener("click", closer);
    });
    a.textContent = label;
    container.appendChild(a);
  }
  function isRecordId(recordId) {
    // We assume a string is a Salesforce ID if it is 18 characters,
    // contains only alphanumeric characters,
    // the record part (after the 3 character object key prefix and 2 character instance id) starts with at least four zeroes,
    // and the 3 character object key prefix is not all zeroes.
    return /^[a-z0-9]{5}0000[a-z0-9]{9}$/i.exec(recordId) && !recordId.startsWith("000");
  }
  function isEventLogFile(text) {
    // test the text to identify if this is a path to an eventLogFile
    return /^\/services\/data\/v[0-9]{2,3}.[0-9]{1}\/sobjects\/EventLogFile\/[a-z0-9]{5}0000[a-z0-9]{9}\/LogFile$/i.exec(text);
  }
  if (typeof cell == "object" && cell != null && cell.attributes && cell.attributes.type) {
    popLink(
      () => {
        let recordId = null;
        if (cell.attributes.url) {
          recordId = cell.attributes.url.replace(/.*\//, "");
        }
        let objectTypes = [cell.attributes.type];
        return {objectTypes, recordId};
      },
      cell.attributes.type
    );
  } else if (typeof cell == "string" && isRecordId(cell)) {
    popLink(
      () => {
        let recordId = cell;
        let {globalDescribe} = rt.describeInfo.describeGlobal(rt.isTooling);
        let objectTypes;
        if (globalDescribe) {
          let keyPrefix = recordId.substring(0, 3);
          objectTypes = globalDescribe.sobjects.filter(sobject => sobject.keyPrefix == keyPrefix).map(sobject => sobject.name);
        } else {
          objectTypes = [];
        }
        return {objectTypes, recordId};
      },
      cell
    );
  } else if (typeof cell == "string" && isEventLogFile(cell)) {
    popLink(
      () => {
        let recordId = cell;
        let objectTypes = [];
        return {objectTypes, recordId};
      },
      cell
    );
  } else if (cell == null) {
    container.textContent = "";
  } else {
    container.textContent = cell;
  }
}

/*
A table that contains millions of records will freeze the browser if we try to render the entire table at once.
Therefore we implement a table within a scrollable area, where the cells are only rendered, when they are scrolled into view.

Limitations:
* It is not possible to select or search the contents of the table outside the rendered area. The user will need to copy to Excel or CSV to do that.
* Since we initially estimate the size of each cell and then update as we render them, the table will sometimes "jump" as the user scrolls.
* There is no line wrapping within the cells. A cell with a lot of text will be very wide.

Implementation:
Since we don't know the height of each row before we render it, we assume to begin with that it is fairly small, and we then grow it to fit the rendered content, as the user scrolls.
We never schrink the height of a row, to ensure that it stabilzes as the user scrolls. The heights are stored in the `rowHeights` array.
To avoid re-rendering the visible part on every scroll, we render an area that is slightly larger than the viewport, and we then only re-render, when the viewport moves outside the rendered area.
Since we don't know the height of each row before we render it, we don't know exactly how many rows to render.
However since we never schrink the height of a row, we never render too few rows, and since we update the height estimates after each render, we won't repeatedly render too many rows.
The initial estimate of the height of each row should be large enough to ensure we don't render too many rows in our initial render.
We only measure the current size at the end of each render, to minimize the number of synchronous layouts the browser needs to make.
We support adding new rows to the end of the table, and new cells to the end of a row, but not deleting existing rows, and we do not reduce the height of a row if the existing content changes.
Each row may be visible or hidden.
In addition to keeping track of the height of each cell, we keep track of the total height in order to adjust the height of the scrollable area, and we keep track of the position of the scrolled area.
After a scroll we search for the position of the new rendered area using the position of the old scrolled area, which should be the least amount of work when the user scrolls in one direction.
The table must have at least one row, since the code keeps track of the first rendered row.
We assume that the height of the cells we measure sum up to the height of the table.
We do the exact same logic for columns, as we do for rows.
We assume that the size of a cell is not influenced by the size of other cells. Therefore we style cells with `white-space: pre`.

@param element A scrollable DOM element to render the table within.
ScrollTable initScrollTable(DOMElement element);
interface Table {
  Cell[][] table; // a two-dimensional array of table rows and cells
  boolean[] rowVisibilities; // For each row, true if it is visible, or false if it is hidden
  boolean[] colVisibilities; // For each column, true if it is visible, or false if it is hidden
  // Refactor: The following three attributes are only used by renderCell, they should be moved to a different interface
  boolean isTooling;
  DescribeInfo describeInfo;
  String sfHost;
}
void renderCell(Table table, Cell cell, DOMElement element); // Render cell within element
interface Cell {
  // Anything, passed to the renderCell function
}
interface ScrollTable {
  void viewportChange(); // Must be called whenever the size of viewport changes.
  void dataChange(Table newData); // Must be called whenever the data changes. (even if it is the same object)
}
*/
export function initScrollTable(scroller) {
  let data = null;
  let scrolled = document.createElement("div");
  scrolled.className = "scrolltable-scrolled";
  scroller.appendChild(scrolled);

  // Tạo nút Reset All Filters
  const resetFiltersBtn = document.createElement("button");
  resetFiltersBtn.className = "reset-filters-btn";
  resetFiltersBtn.textContent = "Reset All Filters";
  resetFiltersBtn.addEventListener("click", () => {
    if (data) {
      resetAllFilters(data);
      updateFilterButtonState();
      toggleResetFiltersButton();
    }
  });
  document.body.appendChild(resetFiltersBtn);

  // Cập nhật trạng thái hiển thị của nút Reset All Filters
  function toggleResetFiltersButton() {
    if (activeColumnFilters.size > 0) {
      resetFiltersBtn.style.display = "flex";
      // Thêm badge hiển thị số lượng filter đang hoạt động
      resetFiltersBtn.innerHTML = `Reset All Filters <span class="filter-badge">${activeColumnFilters.size}</span>`;
    } else {
      resetFiltersBtn.style.display = "none";
    }
  }

  let initialRowHeight = 15;
  let initialColWidth = 50;
  // Dynamic buffer calculation based on viewport size
  let bufferHeight = Math.min(500, scroller.offsetHeight);
  let bufferWidth = Math.min(500, scroller.offsetWidth);
  let headerRows = 1;
  let headerCols = 0;

  let rowHeights = [];
  let rowVisible = [];
  let rowCount = 0;
  let totalHeight = 0;
  let firstRowIdx = 0;
  let firstRowTop = 0;
  let lastRowIdx = 0;
  let lastRowTop = 0;
  let colWidths = [];
  let colVisible = [];
  let colCount = 0;
  let totalWidth = 0;
  let firstColIdx = 0;
  let firstColLeft = 0;
  let lastColIdx = 0;
  let lastColLeft = 0;

  function updateBuffers() {
    // Recalculate buffers when viewport changes
    bufferHeight = Math.min(500, scroller.offsetHeight);
    bufferWidth = Math.min(500, scroller.offsetWidth);
    console.log("Buffers updated:", {bufferHeight, bufferWidth});
  }

  function dataChange(newData) {
    console.log("Data changed");
    data = newData;
    if (data == null || data.rowVisibilities.length == 0 || data.colVisibilities.length == 0) {
      rowHeights = [];
      rowVisible = [];
      rowCount = 0;
      totalHeight = 0;
      firstRowIdx = 0;
      firstRowTop = 0;
      lastRowIdx = 0;
      lastRowTop = 0;

      colWidths = [];
      colVisible = [];
      colCount = 0;
      totalWidth = 0;
      firstColIdx = 0;
      firstColLeft = 0;
      lastColIdx = 0;
      lastColLeft = 0;
      renderData({force: true});
    } else {
      let newRowCount = data.rowVisibilities.length;
      for (let r = rowCount; r < newRowCount; r++) {
        rowHeights[r] = initialRowHeight;
        rowVisible[r] = 0;
      }
      rowCount = newRowCount;
      for (let r = 0; r < rowCount; r++) {
        let newVisible = Number(data.rowVisibilities[r]);
        let visibilityChange = newVisible - rowVisible[r];
        totalHeight += visibilityChange * rowHeights[r];
        if (r < firstRowIdx) {
          firstRowTop += visibilityChange * rowHeights[r];
        }
        rowVisible[r] = newVisible;
      }
      let newColCount = data.colVisibilities.length;
      for (let c = colCount; c < newColCount; c++) {
        colWidths[c] = initialColWidth;
        colVisible[c] = 0;
      }
      colCount = newColCount;
      for (let c = 0; c < colCount; c++) {
        let newVisible = Number(data.colVisibilities[c]);
        let visibilityChange = newVisible - colVisible[c];
        totalWidth += visibilityChange * colWidths[c];
        if (c < firstColIdx) {
          firstColLeft += visibilityChange * colWidths[c];
        }
        colVisible[c] = newVisible;
      }
      renderData({force: true});
    }
    updateBuffers(); // Ensure buffers are updated when data changes
  }

  let scrollTop = 0;
  let scrollLeft = 0;
  let offsetHeight = 0;
  let offsetWidth = 0;
  function viewportChange() {
    // Enhanced viewport change detection
    let newScrollTop = scroller.scrollTop;
    let newScrollLeft = scroller.scrollLeft;
    let newOffsetHeight = scroller.offsetHeight;
    let newOffsetWidth = scroller.offsetWidth;

    if (scrollTop !== newScrollTop || scrollLeft !== newScrollLeft
        || offsetHeight !== newOffsetHeight || offsetWidth !== newOffsetWidth) {
      console.log("Viewport changed:", {
        scrollTop: newScrollTop,
        scrollLeft: newScrollLeft,
        offsetHeight: newOffsetHeight,
        offsetWidth: newOffsetWidth
      });
      scrollTop = newScrollTop;
      scrollLeft = newScrollLeft;
      offsetHeight = newOffsetHeight;
      offsetWidth = newOffsetWidth;
      updateBuffers();
      renderData({force: false});
    }
  }

  function renderData({force}) {
    try {
      console.log("Rendering data. Force:", force);
      scrollTop = scroller.scrollTop;
      scrollLeft = scroller.scrollLeft;
      offsetHeight = scroller.offsetHeight;
      offsetWidth = scroller.offsetWidth;

      if (rowCount == 0 || colCount == 0) {
        scrolled.textContent = "";
        scrolled.style.height = "0px";
        scrolled.style.width = "0px";
        return;
      }

      if (!force && firstRowTop <= scrollTop && (lastRowTop >= scrollTop + offsetHeight || lastRowIdx == rowCount) && firstColLeft <= scrollLeft && (lastColLeft >= scrollLeft + offsetWidth || lastColIdx == colCount)) {
        return;
      }
      console.log("Rendering table");

      while (firstRowTop < scrollTop - bufferHeight && firstRowIdx < rowCount - 1) {
        firstRowTop += rowVisible[firstRowIdx] * rowHeights[firstRowIdx];
        firstRowIdx++;
      }
      while (firstRowTop > scrollTop - bufferHeight && firstRowIdx > 0) {
        firstRowIdx--;
        firstRowTop -= rowVisible[firstRowIdx] * rowHeights[firstRowIdx];
      }
      while (firstColLeft < scrollLeft - bufferWidth && firstColIdx < colCount - 1) {
        firstColLeft += colVisible[firstColIdx] * colWidths[firstColIdx];
        firstColIdx++;
      }
      while (firstColLeft > scrollLeft - bufferWidth && firstColIdx > 0) {
        firstColIdx--;
        firstColLeft -= colVisible[firstColIdx] * colWidths[firstColIdx];
      }

      lastRowIdx = firstRowIdx;
      lastRowTop = firstRowTop;
      while (lastRowTop < scrollTop + offsetHeight + bufferHeight && lastRowIdx < rowCount) {
        lastRowTop += rowVisible[lastRowIdx] * rowHeights[lastRowIdx];
        lastRowIdx++;
      }
      lastColIdx = firstColIdx;
      lastColLeft = firstColLeft;
      while (lastColLeft < scrollLeft + offsetWidth + bufferWidth && lastColIdx < colCount) {
        lastColLeft += colVisible[lastColIdx] * colWidths[lastColIdx];
        lastColIdx++;
      }

      scrolled.textContent = "";
      scrolled.style.height = totalHeight + "px";
      scrolled.style.width = totalWidth + "px";

      let table = document.createElement("table");
      let cellsVisible = false;

      // Ensure firstRowIdx never goes below headerRows
      firstRowIdx = Math.max(headerRows, firstRowIdx);

      // Render header rows separately to ensure they're always visible
      for (let r = 0; r < headerRows; r++) {
        if (rowVisible[r] == 0) continue;
        let row = data.table[r];
        let tr = document.createElement("tr");
        for (let c = firstColIdx; c < lastColIdx; c++) {
          if (colVisible[c] == 0) continue;
          let cell = row[c];
          let td = document.createElement("td");
          td.className = "scrolltable-cell header";
          td.style.minWidth = colWidths[c] + "px";
          td.style.height = rowHeights[r] + "px";
          renderCell(data, cell, td);
          
          // Add copy button to header cells
          if (r === 0 && cell) {
            addCopyButton(td, data, c);
            addFilterButton(td, data, c);
          }
          
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }

      // Render data rows
      for (let r = Math.max(headerRows, firstRowIdx); r < lastRowIdx; r++) {
        if (rowVisible[r] == 0) {
          continue;
        }
        let row = data.table[r];
        let tr = document.createElement("tr");
        for (let c = firstColIdx; c < lastColIdx; c++) {
          if (colVisible[c] == 0) {
            continue;
          }
          let cell = row[c];
          let td = document.createElement("td");
          td.className = "scrolltable-cell";
          if (c < headerCols) {
            td.className += " header";
          }
          td.style.minWidth = colWidths[c] + "px";
          td.style.height = rowHeights[r] + "px";
          renderCell(data, cell, td);
          tr.appendChild(td);
          cellsVisible = true;
        }
        table.appendChild(tr);
      }

      // Adjust table position to prevent header overlap at the top
      let tableTop = Math.max(0, firstRowTop);
      table.style.top = tableTop + "px";
      table.style.left = firstColLeft + "px";
      scrolled.appendChild(table);

      if (cellsVisible) {
        // Start adjusting heights from the first data row, not header
        let tr = table.children[headerRows];
        for (let r = Math.max(headerRows, firstRowIdx); r < lastRowIdx; r++) {
          if (rowVisible[r] == 0) {
            continue;
          }
          let rowRect = tr.firstElementChild.getBoundingClientRect();
          let oldHeight = rowHeights[r];
          let newHeight = Math.max(oldHeight, rowRect.height);
          rowHeights[r] = newHeight;
          totalHeight += newHeight - oldHeight;
          lastRowTop += newHeight - oldHeight;
          tr = tr.nextElementSibling;
        }
        let td = table.firstElementChild.firstElementChild;
        for (let c = firstColIdx; c < lastColIdx; c++) {
          if (colVisible[c] == 0) {
            continue;
          }
          let colRect = td.getBoundingClientRect();
          let oldWidth = colWidths[c];
          let newWidth = Math.max(oldWidth, colRect.width);
          colWidths[c] = newWidth;
          totalWidth += newWidth - oldWidth;
          lastColLeft += newWidth - oldWidth;
          td = td.nextElementSibling;
        }
      }
      console.log("Render complete");
    } catch (error) {
      console.error("Error in renderData:", error);
      // Enhanced error logging
      console.log("Current state:", {
        rowCount,
        colCount,
        firstRowIdx,
        lastRowIdx,
        firstRowTop,
        lastRowTop,
        firstColIdx,
        lastColIdx,
        firstColLeft,
        lastColLeft,
        scrollTop,
        scrollLeft,
        offsetHeight,
        offsetWidth
      });
    }
  }

  dataChange(null);
  scroller.addEventListener("scroll", viewportChange);
  // Added resize event listener to handle viewport changes
  window.addEventListener("resize", viewportChange);
  
  // Thêm trình xử lý sự kiện khi bộ lọc được áp dụng
  document.addEventListener('scrolltable-filter-applied', (event) => {
    console.log("Filter applied, updating table with new data");
    dataChange(event.detail);
    toggleResetFiltersButton();
  });

  return {
    viewportChange,
    dataChange
  };
}
