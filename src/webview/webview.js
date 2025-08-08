(function() {
    const vscode = acquireVsCodeApi();
    let memos = [];
    
    const memoContainer = document.getElementById('memo-container');
    const addButton = document.getElementById('add-memo-btn');
    
    addButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'createMemo' });
    });
    
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'setMemos':
                if (message.memos) {
                    memos = message.memos;
                    renderMemos();
                }
                break;
            case 'memoCreated':
                if (message.memo) {
                    memos.push(message.memo);
                    renderMemos();
                    setTimeout(() => {
                        const newMemo = document.querySelector(`[data-id="${message.memo.id}"] .memo-textarea`);
                        if (newMemo) {
                            newMemo.focus();
                        }
                    }, 100);
                }
                break;
            case 'memoDeleted':
                if (message.id) {
                    memos = memos.filter(m => m.id !== message.id);
                    renderMemos();
                }
                break;
        }
    });
    
    function renderMemos() {
        if (memos.length === 0) {
            memoContainer.innerHTML = `
                <div class="empty-state">
                    <p>No memos yet</p>
                    <p>Click the + button to create your first memo</p>
                </div>
            `;
            return;
        }
        
        memoContainer.innerHTML = '';
        
        memos.forEach(memo => {
            const memoDiv = document.createElement('div');
            memoDiv.className = 'memo-container';
            memoDiv.setAttribute('data-id', memo.id);
            
            const textarea = document.createElement('textarea');
            textarea.className = 'memo-textarea';
            textarea.value = memo.content;
            textarea.placeholder = 'Enter your memo...';
            textarea.setAttribute('aria-label', 'Memo content');
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '<span class="codicon codicon-close"></span>';
            deleteBtn.setAttribute('aria-label', 'Delete memo');
            
            textarea.addEventListener('input', () => {
                autoResize(textarea);
                vscode.postMessage({
                    command: 'updateMemo',
                    id: memo.id,
                    content: textarea.value
                });
            });
            
            textarea.addEventListener('focus', () => {
                memoDiv.classList.add('focused');
            });
            
            textarea.addEventListener('blur', () => {
                memoDiv.classList.remove('focused');
            });
            
            deleteBtn.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'deleteMemo',
                    id: memo.id
                });
            });
            
            memoDiv.appendChild(textarea);
            memoDiv.appendChild(deleteBtn);
            memoContainer.appendChild(memoDiv);
            
            autoResize(textarea);
        });
    }
    
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const maxHeight = window.innerHeight * 0.5;
        
        if (scrollHeight > maxHeight) {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.height = scrollHeight + 'px';
            textarea.style.overflowY = 'hidden';
        }
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            const textareas = Array.from(document.querySelectorAll('.memo-textarea'));
            const currentIndex = textareas.indexOf(document.activeElement);
            
            if (currentIndex !== -1) {
                e.preventDefault();
                
                let nextIndex;
                if (e.shiftKey) {
                    nextIndex = currentIndex - 1;
                    if (nextIndex < 0) {
                        nextIndex = textareas.length - 1;
                    }
                } else {
                    nextIndex = (currentIndex + 1) % textareas.length;
                }
                
                textareas[nextIndex].focus();
            }
        }
    });
    
    vscode.postMessage({ command: 'loadMemos' });
})();