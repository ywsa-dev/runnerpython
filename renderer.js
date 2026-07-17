const codeEditor = document.getElementById('codeEditor');
const logOutput = document.getElementById('logOutput');

function addLog(text, type = 'info') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = text;
    logOutput.appendChild(line);
    logOutput.scrollTop = logOutput.scrollHeight;
}

function clearLog() {
    logOutput.innerHTML = '';
    addLog('Cleared', 'info');
}

function buildAndRun() {
    const code = codeEditor.value;
    if (!code.trim()) {
        addLog('Please enter code', 'error');
        return;
    }

    addLog('Building...', 'info');
    window.electronAPI.buildAndRun(code);
}

window.electronAPI.onBuildLog((msg) => {
    addLog(msg, 'info');
});

window.electronAPI.onBuildError((msg) => {
    addLog(msg, 'error');
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        buildAndRun();
    }
});

addLog('Ready', 'success');