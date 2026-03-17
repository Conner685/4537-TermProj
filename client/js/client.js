class UIComponent {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
    }
    
    setText(text) {
        if(this.element) this.element.textContent = text;
    }
    
    setHTML(html) {
        if(this.element) this.element.innerHTML = html;
    }
    
    getValue() {
        return this.element ? this.element.value : '';
    }
}

class ClientApp {
    constructor() {
        this.responseArea = new UIComponent('response-area');

        document.getElementById('insert-btn').innerText = STRINGS.insertBtn;
        document.getElementById('query-btn').innerText = STRINGS.submitBtn;
        document.getElementById('sql-query').placeholder = STRINGS.placeholder;        
        
        document.getElementById('insert-btn').onclick = () => this.handleInsert();
        document.getElementById('query-btn').onclick = () => this.handleQuery();
    }

    /**
     * Format JSON with syntax highlighting
     */
    formatJsonResponse(data, isSuccess = true) {
        const jsonString = JSON.stringify(data, null, 2);
        const statusClass = isSuccess ? 'response-success' : 'response-error';
        const icon = isSuccess ? '✓' : '✕';
        
        const hoverableJson = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false|null)/g, ': <span class="json-boolean">$1</span>');

        return `
            <div class="response-card ${statusClass}">
                <div class="response-header">
                    <span class="response-icon">${icon}</span>
                    <span class="response-status">${isSuccess ? 'Success' : 'Error'}</span>
                </div>
                <pre class="response-json"><code>${hoverableJson}</code></pre>
            </div>
        `;
    }

    /**
     * Show loading state
     */
    showLoading(message) {
        const html = `
            <div class="response-card response-loading">
                <div class="response-header">
                    <span class="response-spinner"></span>
                    <span class="response-status">${message}</span>
                </div>
            </div>
        `;
        this.responseArea.setHTML(html);
    }

    /**
     * Show error state
     */
    showError(error) {
        const html = `
            <div class="response-card response-error">
                <div class="response-header">
                    <span class="response-icon">✕</span>
                    <span class="response-status">Error</span>
                </div>
                <pre class="response-message">${error}</pre>
            </div>
        `;
        this.responseArea.setHTML(html);
    }

    handleInsert() {
        this.showLoading(STRINGS.inserting);
        
        fetch(STRINGS.insertUrl, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                const isSuccess = !data.error;
                this.responseArea.setHTML(this.formatJsonResponse(data, isSuccess));
            })
            .catch(err => this.showError(STRINGS.errorPrefix + err.message));
    }

    handleQuery() {
        const queryInput = new UIComponent('sql-query').getValue();
        if(!queryInput) return;

        this.showLoading(STRINGS.runningQuery);

        const encodedQuery = encodeURIComponent(queryInput);

        fetch(`${STRINGS.queryUrl}?q=${encodedQuery}`, { method: 'GET' })
            .then(res => res.json())
            .then(data => {
                const isSuccess = !data.error;
                this.responseArea.setHTML(this.formatJsonResponse(data, isSuccess));
            })
            .catch(err => this.showError(STRINGS.errorPrefix + err.message));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ClientApp();
});