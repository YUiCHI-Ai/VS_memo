import { Memo as IMemo } from '../types';
import { generateUUID } from '../utils/uuid';

export class Memo implements IMemo {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;

    constructor(content: string = '', id?: string) {
        this.validateContent(content);
        
        this.id = id || generateUUID();
        this.content = content;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    private validateContent(content: string): void {
        const MAX_LENGTH = 10000;
        if (content.length > MAX_LENGTH) {
            throw new Error(`Content too long. Maximum length is ${MAX_LENGTH} characters.`);
        }
    }

    update(content: string): void {
        this.validateContent(content);
        this.content = content;
        this.updatedAt = Date.now();
    }

    toJSON(): IMemo {
        return {
            id: this.id,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data: IMemo): Memo {
        const memo = new Memo(data.content, data.id);
        memo.createdAt = data.createdAt;
        memo.updatedAt = data.updatedAt;
        return memo;
    }
}