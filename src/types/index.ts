export interface Memo {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

export interface WebviewMessage {
    command: 'createMemo' | 'updateMemo' | 'deleteMemo' | 'loadMemos';
    id?: string;
    content?: string;
}

export interface ExtensionMessage {
    command: 'setMemos' | 'memoCreated' | 'memoUpdated' | 'memoDeleted';
    memos?: Memo[];
    memo?: Memo;
    id?: string;
}

export interface StoredState {
    version: string;
    memos: Memo[];
    lastModified: number;
}