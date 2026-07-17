const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class EXEBuilder extends EventEmitter {
    constructor() {
        super();
        this.appDir = path.join(__dirname, '../app');
        this.tempDir = path.join(__dirname, '../temp');
        this.exePath = path.join(this.appDir, 'app.exe');
        
        if (!fs.existsSync(this.appDir)) {
            fs.mkdirSync(this.appDir, { recursive: true });
        }
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async buildAndRun(pythonCode) {
        try {
            this.emit('log', 'Building EXE...');
            
            const cCode = this.generateCCode(pythonCode);
            await this.compileToExe(cCode);
            
            this.emit('log', 'Build complete');
            this.runExe();
            
        } catch (error) {
            this.emit('error', error.message);
        }
    }

    generateCCode(pythonCode) {
        // Python 코드를 임시 파일로 저장하는 방식으로 변경
        // 따옴표 중첩 문제 해결
        const escapedCode = pythonCode
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');
        
        return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Python 코드를 문자열로 저장
    const char* python_code = "${escapedCode}";
    
    // 임시 Python 파일 생성
    FILE* fp = fopen("temp.py", "w");
    if (fp) {
        fprintf(fp, "%s", python_code);
        fclose(fp);
        
        // Python 파일 실행
        system("python temp.py");
        
        // 임시 파일 삭제
        remove("temp.py");
    } else {
        // 파일 생성 실패시 -c 옵션으로 실행 (백업)
        char cmd[1024];
        snprintf(cmd, sizeof(cmd), "python -c \\"%s\\"", python_code);
        system(cmd);
    }
    
    system("pause > nul");
    return 0;
}`;
    }

    compileToExe(cCode) {
        return new Promise((resolve, reject) => {
            const cFilePath = path.join(this.tempDir, 'app.c');
            fs.writeFileSync(cFilePath, cCode, 'utf-8');
            
            const compileCmd = `gcc -O2 -o "${this.exePath}" "${cFilePath}"`;
            
            exec(compileCmd, { cwd: this.tempDir }, (error, stdout, stderr) => {
                if (error) {
                    if (error.message && error.message.includes('gcc')) {
                        reject(new Error('GCC not found. Install MinGW.'));
                    } else {
                        reject(new Error(stderr || error.message));
                    }
                    return;
                }
                
                if (fs.existsSync(this.exePath)) {
                    resolve();
                } else {
                    reject(new Error('EXE creation failed'));
                }
            });
        });
    }

    runExe() {
        if (!fs.existsSync(this.exePath)) {
            this.emit('error', 'app.exe not found');
            return;
        }

        exec(`start "" "${this.exePath}"`, {
            cwd: this.appDir,
            windowsHide: false
        });
    }
}

module.exports = { EXEBuilder };