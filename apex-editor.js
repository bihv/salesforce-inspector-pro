/* global React ReactDOM */
import {sfConn, apiVersion} from "./inspector.js";

let h = React.createElement;

// Define a list of Apex keywords for code completion and syntax highlighting
const apexKeywords = [
  { keyword: "public", description: "Access modifier that makes a method or variable available to any other Apex code in your organization.", type: "keyword" },
  { keyword: "private", description: "Access modifier that makes a method or variable accessible only within the Apex class in which it's defined.", type: "keyword" },
  { keyword: "protected", description: "Access modifier that makes a method or variable accessible to any inner classes in the defining Apex class.", type: "keyword" },
  { keyword: "global", description: "Access modifier for classes, methods, and variables that makes them accessible across namespaces and applications.", type: "keyword" },
  { keyword: "static", description: "Defines a method or variable that belongs to the class rather than to an instance of a class.", type: "keyword" },
  { keyword: "void", description: "Return type for methods that don't return a value.", type: "type" },
  { keyword: "class", description: "Defines an Apex class.", type: "keyword" },
  { keyword: "interface", description: "Defines an Apex interface for implementation by classes.", type: "keyword" },
  { keyword: "extends", description: "Used to extend a class to inherit its properties and methods.", type: "keyword" },
  { keyword: "implements", description: "Used to implement one or more interfaces.", type: "keyword" },
  { keyword: "abstract", description: "Modifier for classes or methods that can't be instantiated but can be extended.", type: "keyword" },
  { keyword: "final", description: "Makes a variable, method, or class unchangeable.", type: "keyword" },
  { keyword: "if", description: "Used for conditional execution of code.", type: "control-flow" },
  { keyword: "else", description: "Used with if statement to execute code when the condition is false.", type: "control-flow" },
  { keyword: "for", description: "Creates a loop that executes a block of code multiple times.", type: "control-flow" },
  { keyword: "while", description: "Creates a loop that executes as long as a condition is true.", type: "control-flow" },
  { keyword: "do", description: "Creates a loop that executes at least once, then checks a condition.", type: "control-flow" },
  { keyword: "break", description: "Exits a loop prematurely.", type: "control-flow" },
  { keyword: "continue", description: "Skips the current iteration of a loop.", type: "control-flow" },
  { keyword: "return", description: "Returns a value from a method.", type: "control-flow" },
  { keyword: "try", description: "Begins a block of code that might throw an exception.", type: "control-flow" },
  { keyword: "catch", description: "Catches and handles exceptions thrown in the try block.", type: "control-flow" },
  { keyword: "finally", description: "Executes after the try block and any catch blocks, regardless of whether an exception was thrown.", type: "control-flow" },
  { keyword: "throw", description: "Throws an exception.", type: "control-flow" },
  { keyword: "switch", description: "Evaluates an expression and executes code based on matching case values.", type: "control-flow" },
  { keyword: "case", description: "Used within a switch statement to define a case.", type: "control-flow" },
  { keyword: "default", description: "Default case in a switch statement.", type: "control-flow" },
  { keyword: "null", description: "Represents a null reference.", type: "keyword" },
  { keyword: "true", description: "Boolean value for true.", type: "keyword" },
  { keyword: "false", description: "Boolean value for false.", type: "keyword" },
  { keyword: "String", description: "A string data type.", type: "type" },
  { keyword: "Integer", description: "A 32-bit integer data type.", type: "type" },
  { keyword: "Boolean", description: "A boolean (true/false) data type.", type: "type" },
  { keyword: "Decimal", description: "A decimal data type.", type: "type" },
  { keyword: "Double", description: "A double data type for floating-point values.", type: "type" },
  { keyword: "Long", description: "A 64-bit integer data type.", type: "type" },
  { keyword: "Date", description: "A date data type.", type: "type" },
  { keyword: "DateTime", description: "A date and time data type.", type: "type" },
  { keyword: "Time", description: "A time data type.", type: "type" },
  { keyword: "Id", description: "An ID data type for Salesforce record IDs.", type: "type" },
  { keyword: "List", description: "A collection of elements with a specific data type.", type: "type" },
  { keyword: "Set", description: "A collection of unique unordered elements.", type: "type" },
  { keyword: "Map", description: "A collection of key-value pairs.", type: "type" },
  { keyword: "this", description: "References the current instance of a class.", type: "keyword" },
  { keyword: "super", description: "References the parent class.", type: "keyword" },
  { keyword: "new", description: "Creates a new instance of a class.", type: "keyword" },
  { keyword: "enum", description: "Defines a set of constants.", type: "keyword" },
  { keyword: "override", description: "Indicates that a method overrides a method in the parent class.", type: "keyword" },
  { keyword: "virtual", description: "Makes a method overridable in subclasses.", type: "keyword" },
  { keyword: "trigger", description: "Defines an Apex trigger.", type: "keyword" },
  { keyword: "on", description: "Used with trigger to specify the object.", type: "keyword" },
  { keyword: "before", description: "Specifies that a trigger runs before an operation.", type: "keyword" },
  { keyword: "after", description: "Specifies that a trigger runs after an operation.", type: "keyword" },
  { keyword: "insert", description: "Refers to the insert operation in triggers or DML.", type: "keyword" },
  { keyword: "update", description: "Refers to the update operation in triggers or DML.", type: "keyword" },
  { keyword: "delete", description: "Refers to the delete operation in triggers or DML.", type: "keyword" },
  { keyword: "undelete", description: "Refers to the undelete operation in triggers or DML.", type: "keyword" },
  { keyword: "System", description: "The System namespace contains system methods.", type: "type" },
  { keyword: "Database", description: "Contains database methods.", type: "type" },
  { keyword: "Schema", description: "Contains methods for schema operations.", type: "type" },
  { keyword: "Trigger", description: "Contains trigger context variables.", type: "type" }
];

// Define common Apex code pairs for auto-completion
const apexCodePairs = {
  "{": "}",
  "(": ")",
  "[": "]",
  "'": "'",
  '"': '"'
};

// Simple code templates for quick insertion
const codeTemplates = [
  {
    name: "Class",
    template:
`public class ClassName {
    // Class properties and methods go here
    
}`
  },
  {
    name: "Method",
    template:
`public ReturnType methodName(ParameterType param) {
    // Method body
    return null;
}`
  },
  {
    name: "Trigger",
    template:
`trigger TriggerName on ObjectName (before insert, before update) {
    // Trigger logic here
    
}`
  },
  {
    name: "If Statement",
    template:
`if (condition) {
    // Code block
} else {
    // Else block
}`
  },
  {
    name: "For Loop",
    template:
`for (Integer i = 0; i < list.size(); i++) {
    // Loop body
}`
  },
  {
    name: "SOQL Query",
    template:
`List<SObject> records = [SELECT Id, Name 
                          FROM SObject 
                          WHERE Field = :value 
                          LIMIT 100];`
  },
  {
    name: "Try Catch",
    template:
`try {
    // Code that might throw an exception
} catch (Exception e) {
    // Handle the exception
    System.debug('Error: ' + e.getMessage());
}`
  }
];

// ApexCodeCompletion class to handle code completion and syntax highlighting
class ApexCodeCompletion {
  constructor(editor) {
    this.editor = editor;
    this.suggestionsVisible = false;
    this.suggestionList = null;
    this.selectedSuggestionIndex = -1;
    this.currentSuggestions = [];
    this.sobjectMetadata = {};
    this.loadingSObjects = false;
    this.lastFetchedSObjects = 0;
    this.CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 giờ
    
    // Khôi phục cache từ localStorage
    this.loadSObjectsFromCache();
    
    this.editor.addEventListener('input', this.handleInput.bind(this));
    this.editor.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.editor.addEventListener('blur', (e) => {
      // Small delay to allow for clicking on the suggestion list
      setTimeout(() => {
        this.hideSuggestions();
      }, 200);
    });
    
    // Create suggestion container
    this.createSuggestionContainer();
  }
  
  // Tải metadata của SObject từ cache
  loadSObjectsFromCache() {
    try {
      const cachedData = localStorage.getItem('sfInspectorApexSObjectMetadata');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        // Kiểm tra thời gian cache để xem có cần làm mới hay không
        if (data.timestamp && now - data.timestamp < this.CACHE_EXPIRY) {
          this.sobjectMetadata = data.sobjects || {};
          this.lastFetchedSObjects = data.timestamp;
          console.log('Loaded SObject metadata from cache, count:', Object.keys(this.sobjectMetadata).length);
          return;
        }
      }
      
      // Nếu không có cache hoặc cache đã hết hạn, cần tải lại
      this.fetchSObjectMetadata();
    } catch (error) {
      console.error('Error loading SObject metadata from cache:', error);
      this.fetchSObjectMetadata();
    }
  }
  
  // Tải metadata của SObject từ Salesforce API
  async fetchSObjectMetadata() {
    if (this.loadingSObjects) return;
    
    try {
      this.loadingSObjects = true;
      console.log('Fetching SObject metadata...');
      
      // Gọi API để lấy danh sách các object
      const response = await sfConn.rest(`/services/data/v${apiVersion}/sobjects/`);
      
      if (response && response.sobjects) {
        const sobjects = {};
        
        // Chỉ lưu thông tin cần thiết để tiết kiệm bộ nhớ
        response.sobjects.forEach(obj => {
          sobjects[obj.name] = {
            name: obj.name,
            label: obj.label,
            custom: obj.custom,
            createable: obj.createable,
            queryable: obj.queryable
          };
        });
        
        // Cập nhật cache
        this.sobjectMetadata = sobjects;
        this.lastFetchedSObjects = new Date().getTime();
        
        // Lưu vào localStorage
        localStorage.setItem('sfInspectorApexSObjectMetadata', JSON.stringify({
          sobjects: sobjects,
          timestamp: this.lastFetchedSObjects
        }));
        
        console.log('Fetched and cached SObject metadata, count:', Object.keys(sobjects).length);
      }
    } catch (error) {
      console.error('Error fetching SObject metadata:', error);
    } finally {
      this.loadingSObjects = false;
    }
  }
  
  createSuggestionContainer() {
    // Create suggestions element if it doesn't exist
    if (!this.suggestionList) {
      this.suggestionList = document.createElement('div');
      this.suggestionList.className = 'apex-suggestions';
      this.suggestionList.style.display = 'none';
      document.body.appendChild(this.suggestionList);
    }
  }
  
  handleInput() {
    const cursorPos = this.editor.selectionStart;
    const text = this.editor.value.substring(0, cursorPos);
    
    // Kiểm tra nếu người dùng vừa gõ "new " hoặc đang gõ sau "new "
    const newObjectMatch = text.match(/new\s+([A-Za-z0-9_]*)$/i);
    
    // Kiểm tra nếu người dùng vừa gõ "SELECT " hoặc đang gõ sau "SELECT " và trước "FROM "
    const selectMatch = text.match(/SELECT\s+(?:[A-Za-z0-9_,\s*]+\s+)?FROM\s+([A-Za-z0-9_]*)$/i);
    
    if (newObjectMatch || selectMatch) {
      const prefix = newObjectMatch ? newObjectMatch[1] : selectMatch[1];
      // Hiển thị gợi ý SObject
      this.showSObjectSuggestions(prefix, cursorPos);
    } else {
      // Xử lý gợi ý từ khóa Apex thông thường
      const match = text.match(/[A-Za-z_][A-Za-z0-9_]*$/);
      
      if (match) {
        const word = match[0];
        // Show suggestions if word is at least 1 character
        if (word.length >= 1) {
          this.showSuggestions(word, cursorPos);
        } else {
          this.hideSuggestions();
        }
      } else {
        this.hideSuggestions();
      }
    }
    
    // Handle auto-pairing of brackets, quotes, etc.
    const lastChar = text.charAt(text.length - 1);
    if (apexCodePairs[lastChar]) {
      const closeChar = apexCodePairs[lastChar];
      const selectionStart = this.editor.selectionStart;
      // Insert the matching closing character
      this.editor.value = 
        this.editor.value.substring(0, selectionStart) + 
        closeChar + 
        this.editor.value.substring(selectionStart);
      // Place cursor between the pair
      this.editor.selectionStart = selectionStart;
      this.editor.selectionEnd = selectionStart;
    }
  }
  
  // Hiển thị gợi ý SObject dựa trên prefix nhập vào
  showSObjectSuggestions(prefix, cursorPos) {
    if (Object.keys(this.sobjectMetadata).length === 0) {
      // Nếu chưa có metadata, fetch và hiển thị thông báo đang tải
      this.fetchSObjectMetadata();
      this.showLoadingSuggestion(cursorPos);
      return;
    }
    
    // Lọc SObject dựa trên prefix
    const filteredSObjects = Object.values(this.sobjectMetadata).filter(obj => {
      return prefix ? obj.name.toLowerCase().includes(prefix.toLowerCase()) : true;
    });
    
    if (filteredSObjects.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    // Sắp xếp: Object chuẩn trước, object tùy chỉnh sau, và sắp xếp theo thứ tự chữ cái
    filteredSObjects.sort((a, b) => {
      if (a.custom !== b.custom) {
        return a.custom ? 1 : -1; // Chuẩn trước, tùy chỉnh sau
      }
      return a.name.localeCompare(b.name); // Sắp xếp theo bảng chữ cái
    });
    
    // Giới hạn số lượng gợi ý hiển thị để tránh quá tải
    const limitedSuggestions = filteredSObjects.slice(0, 50);
    
    // Cập nhật danh sách gợi ý
    this.currentSuggestions = limitedSuggestions.map(obj => ({
      keyword: obj.name,
      description: obj.label + (obj.custom ? ' (Custom Object)' : ''),
      type: 'sobject'
    }));
    
    this.displaySuggestions(cursorPos);
  }
  
  // Hiển thị thông báo đang tải khi đang fetch metadata
  showLoadingSuggestion(cursorPos) {
    this.currentSuggestions = [{
      keyword: 'Loading...',
      description: 'Fetching SObject metadata',
      type: 'loading'
    }];
    
    this.displaySuggestions(cursorPos);
  }
  
  handleKeyDown(e) {
    if (!this.suggestionsVisible) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.currentSuggestions.length - 1
        );
        this.highlightSelectedSuggestion();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, 0);
        this.highlightSelectedSuggestion();
        break;
        
      case 'Tab':
      case 'Enter':
        if (this.selectedSuggestionIndex >= 0) {
          e.preventDefault();
          this.applySuggestion(this.currentSuggestions[this.selectedSuggestionIndex].keyword);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this.hideSuggestions();
        break;
    }
  }
  
  showSuggestions(word, cursorPos) {
    // Filter suggestions based on input
    this.currentSuggestions = apexKeywords.filter(item => 
      item.keyword.toLowerCase().startsWith(word.toLowerCase())
    );
    
    if (this.currentSuggestions.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    this.displaySuggestions(cursorPos);
  }
  
  // Phương thức chung để hiển thị gợi ý
  displaySuggestions(cursorPos) {
    if (this.currentSuggestions.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    // Clear existing suggestions
    this.suggestionList.innerHTML = '';
    
    // Create suggestion elements
    this.currentSuggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'apex-suggestion-item';
      
      if (suggestion.type === 'loading') {
        // Hiển thị biểu tượng loading
        item.innerHTML = `
          <div class="loading-spinner" style="display: inline-block; width: 12px; height: 12px; border: 2px solid #f3f3f3; border-top: 2px solid #0070d2; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
          <span>${suggestion.keyword}</span>
          <span class="apex-suggestion-description">${suggestion.description}</span>
        `;
      } else if (suggestion.type === 'sobject') {
        // Hiển thị SObject với icon khác biệt
        const iconType = suggestion.keyword.endsWith('__c') ? 'custom' : 'standard';
        item.innerHTML = `
          <span style="display: inline-block; width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">
            <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;" fill="#0070d2">
              <path d="M20,6h-8l-2-2H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z"/>
            </svg>
          </span>
          <span>${suggestion.keyword}</span>
          <span class="apex-suggestion-description">${suggestion.description}</span>
        `;
      } else {
        // Hiển thị gợi ý thông thường
        // Highlight the matching part
        const text = this.editor.value.substring(0, cursorPos);
        const match = text.match(/[A-Za-z_][A-Za-z0-9_]*$/);
        const matchLength = match ? match[0].length : 0;
        
        item.innerHTML = `
          <strong>${suggestion.keyword.substring(0, matchLength)}</strong>
          ${suggestion.keyword.substring(matchLength)}
          <span class="apex-suggestion-description">${suggestion.description}</span>
        `;
      }
      
      item.addEventListener('click', () => {
        if (suggestion.type !== 'loading') {
          this.applySuggestion(suggestion.keyword);
        }
      });
      
      item.addEventListener('mouseover', () => {
        this.selectedSuggestionIndex = index;
        this.highlightSelectedSuggestion();
      });
      
      this.suggestionList.appendChild(item);
    });
    
    // Position the suggestion list below the cursor
    const editorRect = this.editor.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(this.editor).lineHeight) || 20;
    
    // Calculate cursor position in the editor
    const textBeforeCursor = this.editor.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    
    // Calculate the approximate position of the cursor
    const textWidth = this.approximateTextWidth(lines[currentLine]);
    const scrollTop = this.editor.scrollTop;
    
    this.suggestionList.style.left = (editorRect.left + Math.min(textWidth, 300)) + 'px';
    this.suggestionList.style.top = (editorRect.top + (currentLine + 1) * lineHeight - scrollTop + 20) + 'px';
    this.suggestionList.style.display = 'block';
    this.suggestionList.style.maxHeight = '300px';
    this.suggestionList.style.overflow = 'auto';
    
    // Reset selected index
    this.selectedSuggestionIndex = 0;
    this.highlightSelectedSuggestion();
    
    this.suggestionsVisible = true;
  }
  
  approximateTextWidth(text) {
    // Approximation: assume average char width is 8px for monospace font
    return text.length * 8;
  }
  
  hideSuggestions() {
    if (this.suggestionList) {
      this.suggestionList.style.display = 'none';
      this.suggestionsVisible = false;
    }
  }
  
  highlightSelectedSuggestion() {
    const items = this.suggestionList.querySelectorAll('.apex-suggestion-item');
    items.forEach((item, index) => {
      if (index === this.selectedSuggestionIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // Ensure the selected item is visible
    if (this.selectedSuggestionIndex >= 0) {
      const selectedItem = items[this.selectedSuggestionIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }
  
  applySuggestion(suggestion) {
    if (suggestion === 'Loading...') return;
    
    const cursorPos = this.editor.selectionStart;
    const text = this.editor.value.substring(0, cursorPos);
    
    // Xác định loại phụ thuộc: new, SELECT, hoặc gợi ý Apex thông thường
    const newObjectMatch = text.match(/new\s+([A-Za-z0-9_]*)$/i);
    const selectMatch = text.match(/SELECT\s+(?:[A-Za-z0-9_,\s*]+\s+)?FROM\s+([A-Za-z0-9_]*)$/i);
    
    let wordStart, replacement;
    
    if (newObjectMatch) {
      // Trường hợp "new Object"
      wordStart = cursorPos - newObjectMatch[1].length;
      replacement = suggestion;
    } else if (selectMatch) {
      // Trường hợp "SELECT ... FROM Object"
      wordStart = cursorPos - selectMatch[1].length;
      replacement = suggestion;
    } else {
      // Trường hợp thông thường
      const match = text.match(/[A-Za-z0-9_]*$/);
      if (!match) return;
      wordStart = cursorPos - match[0].length;
      replacement = suggestion;
    }
    
    // Replace the current word with the suggestion
    this.editor.value = 
      this.editor.value.substring(0, wordStart) +
      replacement +
      this.editor.value.substring(cursorPos);
    
    // Move cursor to the end of the inserted suggestion
    const newCursorPos = wordStart + replacement.length;
    this.editor.selectionStart = newCursorPos;
    this.editor.selectionEnd = newCursorPos;
    
    // Hide suggestions
    this.hideSuggestions();
    
    // Focus back on the editor
    this.editor.focus();
  }
}

// Component to display code templates in the sidebar
class CodeTemplatesList extends React.Component {
  render() {
    return h('div', { className: 'code-templates-list' },
      h('h3', null, 'Code Templates'),
      h('ul', { className: 'template-list' },
        codeTemplates.map((template, index) => 
          h('li', { 
            key: index,
            onClick: () => this.props.onSelectTemplate(template),
            className: 'template-item'
          }, template.name)
        )
      )
    );
  }
}

// Main Apex Editor component
class ApexEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      code: '// Start typing Apex code here\n\n',
      statusMessage: 'Ready',
      isSaving: false,
      fileName: 'MyApexClass',
      isExecuting: false,
      executionResult: null,
      showExecutionResults: false,
      showOnlyDebug: false,
      currentUserId: null,
      debugLogEnabled: false,
      isEnablingLogs: false,
      selectedLogLevel: 'FINEST', // Default log level
      logDurationMinutes: 30, // Default log duration in minutes
      traceFlagId: null, // ID of the current trace flag
      debugLevelId: null, // ID of the selected debug level
    };
    
    // Replace React.createRef() with a class property
    this.editorRef = null;
    this.setEditorRef = (element) => {
      this.editorRef = element;
      // Initialize code completion when the ref is set
      if (element) {
        this.codeCompletionInstance = new ApexCodeCompletion(element);
      }
    };
    this.codeCompletionInstance = null;
    this.resultsPanelRef = null;
    this.setResultsPanelRef = (element) => {
      this.resultsPanelRef = element;
    };
  }
  
  // Thêm componentDidMount để kiểm tra trace flag khi component được tạo
  componentDidMount() {
    this.checkCurrentTraceFlags();
  }

  // Kiểm tra trace flags hiện tại
  checkCurrentTraceFlags = async () => {
    try {
      // Lấy thông tin của user hiện tại trực tiếp từ API thay vì dựa vào sfConn.userInfo
      const userInfo = await sfConn.rest(`/services/data/v${apiVersion}/chatter/users/me`);
      
      if (userInfo && userInfo.id) {
        const currentUserId = userInfo.id;
        this.setState({ currentUserId });
        
        // Kiểm tra xem user có trace flag nào đang active không
        const now = new Date();
        const traceFlags = await sfConn.rest(`/services/data/v${apiVersion}/tooling/query/?q=` + 
          encodeURIComponent("SELECT Id, ExpirationDate, DebugLevelId FROM TraceFlag " + 
                            "WHERE TracedEntityId = '" + currentUserId + "' " + 
                            "AND ExpirationDate > " + now.toISOString()));
        
        if (traceFlags.records && traceFlags.records.length > 0) {
          const activeTraceFlag = traceFlags.records[0];
          const expirationDate = new Date(activeTraceFlag.ExpirationDate);
          const minutesRemaining = Math.round((expirationDate - now) / (1000 * 60));
          
          this.setState({ 
            debugLogEnabled: true,
            traceFlagId: activeTraceFlag.Id,
            debugLevelId: activeTraceFlag.DebugLevelId,
            statusMessage: `Debug logs enabled (${minutesRemaining} minutes remaining)`
          });
        }
      } else {
        this.setState({ statusMessage: 'Error: Could not determine current user' });
      }
    } catch (error) {
      console.error('Error checking trace flags:', error);
      this.setState({ statusMessage: 'Error checking debug logs: ' + error.message });
    }
  }
  
  // Tìm hoặc tạo debug level
  findOrCreateDebugLevel = async (levelName) => {
    try {
      // Tìm debug level theo tên
      const debugLevelQuery = await sfConn.rest(`/services/data/v${apiVersion}/tooling/query/?q=` + 
        encodeURIComponent("SELECT Id FROM DebugLevel WHERE DeveloperName = '" + levelName + "'"));
      
      if (debugLevelQuery.records && debugLevelQuery.records.length > 0) {
        // Nếu đã có, trả về ID
        return debugLevelQuery.records[0].Id;
      } else {
        // Nếu chưa có, tạo mới
        const newDebugLevel = {
          DeveloperName: levelName,
          MasterLabel: levelName,
          ApexCode: this.state.selectedLogLevel,
          ApexProfiling: this.state.selectedLogLevel,
          Callout: this.state.selectedLogLevel,
          Database: this.state.selectedLogLevel,
          System: this.state.selectedLogLevel,
          Validation: this.state.selectedLogLevel,
          Visualforce: this.state.selectedLogLevel,
          Workflow: this.state.selectedLogLevel
        };
        
        const createResponse = await sfConn.rest(`/services/data/v${apiVersion}/tooling/sobjects/DebugLevel`, 
          { method: "POST", body: newDebugLevel });
        
        if (createResponse.success) {
          return createResponse.id;
        }
      }
    } catch (error) {
      console.error('Error finding or creating debug level:', error);
      throw error;
    }
    
    return null;
  }
  
  // Tạo trace flag cho user hiện tại
  createTraceFlag = async () => {
    try {
      this.setState({ isEnablingLogs: true, statusMessage: 'Enabling debug logs...' });
      
      const userId = this.state.currentUserId;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Tìm hoặc tạo debug level
      const debugLevelId = await this.findOrCreateDebugLevel('SFInspectorProLevel');
      
      if (!debugLevelId) {
        throw new Error('Failed to create debug level');
      }
      
      // Thiết lập thời gian hết hạn
      const now = new Date();
      const expirationDate = new Date(now.getTime() + (this.state.logDurationMinutes * 60 * 1000));
      
      // Tạo trace flag
      const traceFlag = {
        TracedEntityId: userId,
        DebugLevelId: debugLevelId,
        LogType: 'USER_DEBUG',
        StartDate: now.toISOString(),
        ExpirationDate: expirationDate.toISOString()
      };
      
      const createResponse = await sfConn.rest(`/services/data/v${apiVersion}/tooling/sobjects/TraceFlag`, 
        { method: "POST", body: traceFlag });
      
      if (createResponse.success) {
        this.setState({ 
          debugLogEnabled: true, 
          traceFlagId: createResponse.id,
          debugLevelId: debugLevelId,
          isEnablingLogs: false,
          statusMessage: `Debug logs enabled for ${this.state.logDurationMinutes} minutes`
        });
        return true;
      } else {
        throw new Error('Failed to create trace flag');
      }
    } catch (error) {
      console.error('Error creating trace flag:', error);
      this.setState({ 
        isEnablingLogs: false, 
        statusMessage: 'Error enabling debug logs: ' + error.message 
      });
      return false;
    }
  }
  
  // Gia hạn trace flag
  extendTraceFlag = async () => {
    try {
      this.setState({ isEnablingLogs: true, statusMessage: 'Extending debug logs...' });
      
      const traceFlagId = this.state.traceFlagId;
      if (!traceFlagId) {
        return await this.createTraceFlag();
      }
      
      // Thiết lập thời gian hết hạn
      const now = new Date();
      const expirationDate = new Date(now.getTime() + (this.state.logDurationMinutes * 60 * 1000));
      
      // Cập nhật trace flag
      const traceFlag = {
        StartDate: now.toISOString(),
        ExpirationDate: expirationDate.toISOString()
      };
      
      await sfConn.rest(`/services/data/v${apiVersion}/tooling/sobjects/TraceFlag/${traceFlagId}`, 
        { method: "PATCH", body: traceFlag });
      
      this.setState({
        debugLogEnabled: true,
        isEnablingLogs: false,
        statusMessage: `Debug logs extended for ${this.state.logDurationMinutes} minutes`
      });
      
      return true;
    } catch (error) {
      console.error('Error extending trace flag:', error);
      this.setState({
        isEnablingLogs: false,
        statusMessage: 'Error extending debug logs: ' + error.message
      });
      
      // Nếu có lỗi khi gia hạn, thử tạo mới
      return await this.createTraceFlag();
    }
  }
  
  // Cập nhật log level của trace flag
  updateLogLevel = async (level) => {
    try {
      this.setState({ selectedLogLevel: level, statusMessage: 'Updating log level...' });
      
      const debugLevelId = this.state.debugLevelId;
      if (!debugLevelId) {
        // Nếu chưa có debug level, tạo mới cùng với trace flag
        await this.createTraceFlag();
        return;
      }
      
      // Cập nhật debug level
      const debugLevel = {
        ApexCode: level,
        ApexProfiling: level,
        Callout: level,
        Database: level,
        System: level,
        Validation: level,
        Visualforce: level,
        Workflow: level
      };
      
      await sfConn.rest(`/services/data/v${apiVersion}/tooling/sobjects/DebugLevel/${debugLevelId}`, 
        { method: "PATCH", body: debugLevel });
      
      this.setState({ statusMessage: `Log level updated to ${level}` });
    } catch (error) {
      console.error('Error updating log level:', error);
      this.setState({ statusMessage: 'Error updating log level: ' + error.message });
    }
  }
  
  // Xử lý khi thay đổi log level
  handleLogLevelChange = (e) => {
    const level = e.target.value;
    this.setState({ selectedLogLevel: level });
    this.updateLogLevel(level);
  }
  
  // Xử lý khi thay đổi thời gian log
  handleLogDurationChange = (e) => {
    const duration = parseInt(e.target.value);
    this.setState({ logDurationMinutes: duration });
  }
  
  // Bật/tắt debug logs
  toggleDebugLogs = async () => {
    if (this.state.debugLogEnabled) {
      // Nếu đang bật, không cần làm gì
      return;
    }
    
    // Tạo hoặc gia hạn trace flag
    if (this.state.traceFlagId) {
      await this.extendTraceFlag();
    } else {
      await this.createTraceFlag();
    }
  }

  handleCodeChange = (e) => {
    this.setState({ code: e.target.value });
  }
  
  insertTemplate = (template) => {
    const editor = this.editorRef;
    if (!editor) return;
    
    // Get cursor position
    const cursorPos = editor.selectionStart;
    
    // Insert the template at cursor position
    const newCode = 
      this.state.code.substring(0, cursorPos) + 
      template.template + 
      this.state.code.substring(cursorPos);
    
    this.setState({ code: newCode }, () => {
      // Place cursor at the beginning of the template
      editor.focus();
      editor.selectionStart = cursorPos;
      editor.selectionEnd = cursorPos;
    });
  }
  
  handleFileNameChange = (e) => {
    this.setState({ fileName: e.target.value });
  }
  
  executeCode = async () => {
    const { code, debugLogEnabled } = this.state;
    
    if (!code.trim()) {
      this.setState({ 
        statusMessage: 'Nothing to execute', 
        executionResult: {
          compiled: false,
          success: false,
          logs: '',
          exceptionMessage: 'No code to execute'
        },
        showExecutionResults: true
      });
      return;
    }
    
    // Nếu debug logs không được bật, hãy kích hoạt
    if (!debugLogEnabled) {
      const enabled = await this.toggleDebugLogs();
      if (!enabled) {
        // Nếu không thể bật debug logs, vẫn tiếp tục thực thi nhưng cảnh báo người dùng
        this.setState({
          statusMessage: 'Debug logs not enabled, execution will continue but logs may not be available',
        });
      }
    }
    
    this.setState({ 
      isExecuting: true,
      statusMessage: 'Executing code...',
      showExecutionResults: true,
      executionResult: null
    });
    
    try {
      // Call the Salesforce executeAnonymous API endpoint
      const result = await this.callExecuteAnonymous(code);
      
      this.setState({
        isExecuting: false,
        executionResult: result,
        statusMessage: result.success ? 'Execution completed successfully' : 'Execution completed with errors'
      });
    } catch (error) {
      console.error('Error executing code:', error);
      this.setState({
        isExecuting: false,
        executionResult: {
          compiled: false,
          success: false,
          logs: '',
          exceptionMessage: error.message || 'Error connecting to Salesforce'
        },
        statusMessage: 'Error executing code'
      });
    }
  }
  
  // Call the Salesforce executeAnonymous API endpoint
  callExecuteAnonymous = async (code) => {
    try {
      // Add a timestamp marker and debug statement to help identify our execution
      const timestamp = new Date().getTime();
      const markedCode = `
// Execution timestamp: ${timestamp}
System.debug('===EXECUTION_START_${timestamp}===');

${code}

System.debug('===EXECUTION_END_${timestamp}===');
`;
      
      // Execute Anonymous Apex using the REST API
      const result = await sfConn.rest(`/services/data/v${apiVersion}/tooling/executeAnonymous/?anonymousBody=${encodeURIComponent(markedCode)}`);
      
      // Get the debug logs if execution was successful
      let logs = '';
      if (result.compiled) {
        try {
          // Wait a bit for logs to be written to the system
          await new Promise(resolve => setTimeout(resolve, 1500)); // Increased wait time to 1.5 seconds
          
          // Try to get logs with retry mechanism
          logs = await this.getDebugLogsWithRetry(timestamp, 5);
        } catch (logError) {
          console.error('Error fetching logs:', logError);
          logs = 'Error fetching debug logs. You may view them in Developer Console.';
        }
      }
      
      return {
        ...result,
        logs
      };
    } catch (error) {
      console.error('Error in execute anonymous:', error);
      throw error;
    }
  }
  
  // Get debug logs with retry mechanism and timestamp filtering
  getDebugLogsWithRetry = async (timestamp, maxRetries = 5) => {
    let retries = 0;
    let logs = '';
    
    while (retries < maxRetries) {
      try {
        // First get the IDs of the most recent logs
        const response = await sfConn.rest(
          `/services/data/v${apiVersion}/tooling/query?q=` +
          encodeURIComponent("SELECT Id, LogUser.Name, LogLength, LastModifiedDate, Operation FROM ApexLog ORDER BY LastModifiedDate DESC LIMIT 20")
        );
        
        if (response.records && response.records.length > 0) {
          // Try to find log with our timestamp marker by checking each log body
          for (const record of response.records) {
            try {
              // Make a separate request to get the log body content
              const logBody = await this.getLogBody(record.Id);
              
              if (logBody) {
                return this.formatLogContent(logBody); 
              }
            } catch (error) {
              console.error(`Error fetching log body for id ${record.Id}:`, error);
              continue; // Try next log
            }
          }
        }
        
        // If we didn't find any matching log, wait and retry
        retries++;
        if (retries < maxRetries) {
          // Increasing wait time with each retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); 
        } else {
          return 'No matching debug logs found. You can check Developer Console for logs.\n\nTry enabling debug logs using the "Enable Logs" button below.';
        }
      } catch (error) {
        console.error('Error fetching debug logs:', error);
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    return logs;
  }
  
  // Format log content for better readability
  formatLogContent = (logContent) => {
    if (!logContent) return '';
    
    // Remove EXECUTION markers if they still exist in the content
    logContent = logContent.replace(/===EXECUTION_(START|END)_\d+===/g, '');
    
    // Ensure consistent line endings
    logContent = logContent.replace(/\r\n/g, '\n');
    
    return logContent;
  }
  
  // Get the full body of a specific log by ID - using a direct REST endpoint with raw response
  getLogBody = async (logId) => {
    try {
      // Use the specific REST endpoint to get the log body rather than including it in the query
      // Pass responseType: "text" to get the log body as text instead of trying to parse it as JSON
      const response = await sfConn.rest(`/services/data/v${apiVersion}/tooling/sobjects/ApexLog/${logId}/Body`, 
        { responseType: "text" });
      
      return response; // This should now be a plain text response
    } catch (error) {
      console.error(`Error fetching log body for ID ${logId}:`, error);
      return '';
    }
  }

  toggleResultsPanel = () => {
    this.setState(prevState => ({
      showExecutionResults: !prevState.showExecutionResults
    }));
  }

  toggleDebugFilter = () => {
    this.setState(prevState => ({
      showOnlyDebug: !prevState.showOnlyDebug
    }));
  }
  
  render() {
    const { 
      code, 
      statusMessage, 
      isExecuting, 
      isSaving, 
      fileName, 
      executionResult, 
      showExecutionResults,
      showOnlyDebug,
      debugLogEnabled,
      isEnablingLogs,
      selectedLogLevel,
      logDurationMinutes
    } = this.state;
    
    // Tính toán chiều cao động cho khu vực kết quả dựa trên nội dung
    const resultsHeight = executionResult && executionResult.logs && executionResult.logs.split('\n').length > 15 
      ? '300px' // Tăng chiều cao khi có nhiều log
      : '200px';
    
    const filteredLogs = showOnlyDebug && executionResult && executionResult.logs
      ? executionResult.logs.split('\n').filter(line => line.includes('DEBUG')).join('\n')
      : executionResult && executionResult.logs;

    return h('div', { className: 'apex-editor-container' },
      h('div', { className: 'apex-editor-header' },
        h('h1', null, 'Apex Code Editor and Execution'),
        h('div', { className: 'header-actions' },
          h('input', { 
            type: 'text',
            value: fileName,
            onChange: this.handleFileNameChange,
            placeholder: 'File name',
            className: 'file-name-input',
            style: {
              padding: '5px',
              marginRight: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }
          }),
          h('button', { 
            className: 'sf-button sf-button-secondary',
            disabled: isSaving,
            onClick: () => {
              alert('Save functionality would be implemented here');
            },
            style: {
              marginRight: '10px'
            }
          }, 'Save'),
          h('button', { 
            className: 'sf-button',
            disabled: isExecuting,
            onClick: this.executeCode
          }, isExecuting ? 'Executing...' : 'Execute Anonymous')
        )
      ),
      // Thêm Debug Log Controls
      h('div', { 
        className: 'debug-log-controls',
        style: {
          padding: '8px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center', 
          backgroundColor: '#f7fafc',
          borderRadius: '4px',
          gap: '15px'
        }
      },
        // Hiển thị trạng thái debug log
        h('div', { 
          style: { 
            display: 'flex', 
            alignItems: 'center' 
          }
        },
          h('span', { 
            style: { 
              marginRight: '5px',
              display: 'flex',
              alignItems: 'center'
            } 
          }, 
            h('span', {
              style: {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: debugLogEnabled ? '#4bca81' : '#ffb75d',
                display: 'inline-block',
                marginRight: '5px'
              }
            }),
            'Debug Logs: ', 
            h('strong', null, debugLogEnabled ? 'Enabled' : 'Disabled')
          ),
          h('button', {
            onClick: this.toggleDebugLogs,
            disabled: isEnablingLogs || debugLogEnabled,
            className: 'sf-button-small',
            style: {
              marginLeft: '10px',
              padding: '3px 8px',
              fontSize: '12px'
            }
          }, isEnablingLogs ? 'Enabling...' : (debugLogEnabled ? 'Enabled' : 'Enable'))
        ),
        
        // Chọn log level
        h('div', { style: { display: 'flex', alignItems: 'center' } },
          h('label', { style: { marginRight: '5px', fontSize: '13px' } }, 'Log Level:'),
          h('select', {
            value: selectedLogLevel,
            onChange: this.handleLogLevelChange,
            style: {
              padding: '3px',
              borderRadius: '3px',
              border: '1px solid #d8dde6'
            }
          },
            h('option', { value: 'ERROR' }, 'ERROR'),
            h('option', { value: 'WARN' }, 'WARN'),
            h('option', { value: 'INFO' }, 'INFO'),
            h('option', { value: 'DEBUG' }, 'DEBUG'),
            h('option', { value: 'FINE' }, 'FINE'),
            h('option', { value: 'FINER' }, 'FINER'),
            h('option', { value: 'FINEST' }, 'FINEST')
          )
        ),
        
        // Chọn thời gian của trace flag
        h('div', { style: { display: 'flex', alignItems: 'center' } },
          h('label', { style: { marginRight: '5px', fontSize: '13px' } }, 'Duration:'),
          h('select', {
            value: logDurationMinutes,
            onChange: this.handleLogDurationChange,
            style: {
              padding: '3px',
              borderRadius: '3px',
              border: '1px solid #d8dde6'
            }
          },
            h('option', { value: 15 }, '15 minutes'),
            h('option', { value: 30 }, '30 minutes'),
            h('option', { value: 60 }, '1 hour'),
            h('option', { value: 120 }, '2 hours'),
            h('option', { value: 240 }, '4 hours'),
            h('option', { value: 480 }, '8 hours'),
            h('option', { value: 1440 }, '1 day')
          )
        ),
        
        // Button to view logs in new tab
        h('button', {
          onClick: () => {
            const sfHost = sfConn.instanceHostname;
            window.open(`https://${sfHost}/lightning/setup/ApexDebugLogs/home`, '_blank');
          },
          className: 'sf-button-small sf-button-secondary',
          style: {
            padding: '3px 8px',
            fontSize: '12px',
            marginLeft: 'auto'
          }
        }, 'View All Logs')
      ),
      h('div', { className: 'apex-editor-main' },
        h('div', { className: 'apex-editor-sidebar' },
          h(CodeTemplatesList, { 
            onSelectTemplate: this.insertTemplate
          })
        ),
        h('div', { className: 'apex-editor-content', style: { flex: 1, display: 'flex', flexDirection: 'column' } },
          h('div', { className: 'apex-editor-wrapper', style: { flex: showExecutionResults ? '1' : '1' } },
            h('textarea', {
              className: 'apex-code-editor',
              ref: this.setEditorRef,
              value: code,
              onChange: this.handleCodeChange,
              spellCheck: false
            })
          ),
          showExecutionResults && h('div', {
            className: 'apex-execution-results',
            ref: this.setResultsPanelRef,
            style: {
              height: resultsHeight, // Sử dụng chiều cao động
              maxHeight: '50vh', // Giới hạn chiều cao tối đa dựa trên kích thước cửa sổ
              marginTop: '10px',
              border: '1px solid #d4d4d4',
              borderRadius: '4px',
              backgroundColor: '#fff',
              overflow: 'auto',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column'
            }
          },
            h('div', { className: 'results-header', style: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' } },
              h('span', { style: { fontWeight: 'bold' } }, 'Execution Results'),
              h('div', { style: { display: 'flex', gap: '10px' } },
                h('button', { 
                  onClick: this.toggleDebugFilter,
                  className: 'sf-button-small',
                  style: {
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    color: '#0070d2',
                    fontSize: '12px',
                    display: executionResult && executionResult.logs ? 'inline' : 'none',
                    textDecoration: this.state.showOnlyDebug ? 'underline' : 'none'
                  }
                }, 'Debug Only'),
                h('button', { 
                  onClick: () => {
                    // Copy logs to clipboard
                    if (executionResult && executionResult.logs) {
                      navigator.clipboard.writeText(executionResult.logs)
                        .then(() => alert('Logs copied to clipboard'))
                        .catch(err => console.error('Could not copy logs:', err));
                    }
                  },
                  className: 'sf-button-small',
                  style: {
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    color: '#0070d2',
                    fontSize: '12px',
                    display: executionResult && executionResult.logs ? 'inline' : 'none'
                  }
                }, 'Copy'),
                h('button', { 
                  onClick: this.toggleResultsPanel,
                  className: 'sf-button-small',
                  style: {
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    color: '#0070d2',
                    fontSize: '12px'
                  }
                }, 'Hide')
              )
            ),
            executionResult ? [
              h('div', { className: 'result-status', style: { marginBottom: '5px' } },
                h('span', { style: { fontWeight: 'bold', color: executionResult.success ? 'green' : 'red' } }, 
                  executionResult.compiled ? 
                    (executionResult.success ? 'Success' : 'Execution Failed') : 
                    'Compilation Failed'
                )
              ),
              !executionResult.compiled && executionResult.compileProblem && h('div', { 
                className: 'compile-error',
                style: { 
                  color: 'red',
                  marginBottom: '5px',
                  whiteSpace: 'pre-wrap'
                } 
              }, `Line ${executionResult.line}, Column ${executionResult.column}: ${executionResult.compileProblem}`),
              !executionResult.success && executionResult.exceptionMessage && h('div', { 
                className: 'exception',
                style: { 
                  color: 'red',
                  marginBottom: '5px',
                  whiteSpace: 'pre-wrap' 
                } 
              }, `Exception: ${executionResult.exceptionMessage}`),
              // Thay đổi hoàn toàn cách hiển thị log bằng textarea có chế độ chỉ đọc thay vì div
              h('textarea', {
                className: 'debug-logs',
                readOnly: true, // Chỉ đọc
                value: filteredLogs || '', // Gán giá trị trực tiếp từ logs
                style: {
                  flex: 1,
                  overflow: 'auto',
                  margin: '5px 0',
                  padding: '8px',
                  backgroundColor: '#f7f7f7',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                  lineHeight: '1.4',
                  width: '100%',
                  minHeight: '150px',
                  border: '1px solid #eee',
                  resize: 'vertical', // Cho phép thay đổi kích thước theo chiều dọc
                  whiteSpace: 'pre-wrap'
                }
              })
            ] : h('div', { className: 'loading-results' }, 'Waiting for execution results...')
          )
        )
      ),
      h('div', { className: 'status-bar' },
        h('div', { style: { display: 'flex', alignItems: 'center' } },
          isExecuting && h('div', { 
            className: 'spinner',
            style: {
              width: '12px',
              height: '12px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #0070d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '5px'
            }
          }),
          statusMessage
        ),
        h('style', null, `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `)
      )
    );
  }
}

// Initialize the app
{
  const args = new URLSearchParams(location.search.slice(1));
  const sfHost = args.get("host");

  // Setup the connection to Salesforce
  sfConn.getSession(sfHost).then(() => {
    // Once we have a session, render the app
    ReactDOM.render(
      h(ApexEditor, {}),
      document.getElementById('root')
    );
  }).catch(error => {
    console.error('Error initializing Apex Editor:', error);
    document.getElementById('root').textContent = 
      'Error: Could not connect to Salesforce. Please check your connection.';
  });
}