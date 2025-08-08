export interface Memo {
  id: string;       // UUID
  content: string;  // メモ内容
  createdAt: number;// タイムスタンプ
}

export interface MemoState {
  memos: Memo[];
}