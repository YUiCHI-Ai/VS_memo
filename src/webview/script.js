/* global acquireVsCodeApi */
(function () {
  const vscode = acquireVsCodeApi();
  /** @type {{ memos: {id:string, content:string, createdAt:number}[] }} */
  let state = vscode.getState() || { memos: [] };

  const listEl = document.getElementById('memo-list');

  function autoResize(textarea) {
    // 50vh を超えないように高さを制限（CSS と整合）
    const maxPx = Math.floor(window.innerHeight * 0.5) - 24; // 余白分を控除
    textarea.style.height = 'auto';
    const desired = Math.min(textarea.scrollHeight, Math.max(24, maxPx));
    textarea.style.height = desired + 'px';
  }

  function createDeleteIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      'M6 7h12l-1 14H7L6 7zm9.5-3l-1-1h-5l-1 1H5v2h14V4h-3.5zM9 9h2v10H9V9zm4 0h2v10h-2V9z'
    );
    svg.appendChild(path);
    return svg;
  }

  function createMemoElement(memo) {
    const container = document.createElement('div');
    container.className = 'memo-container';
    container.dataset.memoId = memo.id;

    const textarea = document.createElement('textarea');
    textarea.className = 'memo-textarea';
    textarea.value = memo.content;
    textarea.dataset.memoId = memo.id;
    if (!textarea.value) {
      textarea.setAttribute('placeholder', 'メモを入力…');
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-button';
    delBtn.setAttribute('aria-label', 'Delete memo');
    delBtn.appendChild(createDeleteIcon());

    // 右上に削除ボタン、本文は下に
    container.appendChild(delBtn);
    container.appendChild(textarea);

    // 入力中の高さ自動調整
    const resizeNow = () => autoResize(textarea);
    textarea.addEventListener('input', resizeNow);
    textarea.addEventListener('focus', resizeNow);
    // 初期描画時
    requestAnimationFrame(resizeNow);

    // 編集終了時に保存（フォーカス外れ）
    textarea.addEventListener('blur', () => {
      vscode.postMessage({
        command: 'updateMemo',
        id: memo.id,
        content: textarea.value,
      });
    });

    // 削除
    delBtn.addEventListener('click', () => {
      vscode.postMessage({
        command: 'deleteMemo',
        id: memo.id,
      });
    });

    return container;
  }

  function render(memos) {
    if (!listEl) return;
    listEl.innerHTML = '';
    for (const memo of memos) {
      listEl.appendChild(createMemoElement(memo));
    }
    // 新規メモが下に追加される前提で下端へスクロール
    listEl.scrollTop = listEl.scrollHeight;
  }

  // 直近の状態があれば即時描画（UX向上）
  if (state.memos?.length) {
    render(state.memos);
  }

  // Extension からの状態更新
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg?.type === 'setMemos' && Array.isArray(msg.memos)) {
      state = { memos: msg.memos };
      vscode.setState(state);
      render(state.memos);

      if (msg.focusId && listEl) {
        // 新規作成直後のメモにフォーカス
        const focus = () => {
          const target = listEl.querySelector(`.memo-container[data-memo-id="${msg.focusId}"] .memo-textarea`);
          if (target) {
            target.focus();
            try {
              target.setSelectionRange(target.value.length, target.value.length);
            } catch {}
            target.scrollIntoView({ block: 'nearest' });
          }
        };
        // レイアウト確定後にフォーカス
        requestAnimationFrame(focus);
      }
    }
  });
})();