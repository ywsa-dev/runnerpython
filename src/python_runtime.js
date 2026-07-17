const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PythonRuntime {
    static executeCode(code, callback) {
        // Python을 직접 실행
        const pythonProcess = spawn('python', ['-c', code]);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
            callback('output', data.toString());
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
            callback('error', data.toString());
        });
        
        pythonProcess.on('close', (code) => {
            callback('close', code);
        });
        
        return pythonProcess;
    }

    static generatePythonWrapper(code) {
        // Python 코드를 감싸는 래퍼
        return `
import sys
import os

# 실행할 코드
${code}

# Pause
if sys.platform == 'win32':
    os.system('pause > nul')
`;
    }

    static saveAndExecute(code, tempDir) {
        const tempFile = path.join(tempDir, `temp_${Date.now()}.py`);
        const wrappedCode = this.generatePythonWrapper(code);
        fs.writeFileSync(tempFile, wrappedCode, 'utf-8');
        
        return new Promise((resolve, reject) => {
            const process = spawn('python', [tempFile]);
            
            process.stdout.on('data', (data) => {
                console.log(data.toString());
            });
            
            process.stderr.on('data', (data) => {
                console.error(data.toString());
            });
            
            process.on('close', (code) => {
                fs.unlinkSync(tempFile);
                resolve(code);
            });
            
            process.on('error', (error) => {
                reject(error);
            });
        });
    }
}

module.exports = { PythonRuntime };