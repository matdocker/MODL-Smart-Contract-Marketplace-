export interface Template {
    templateId: `0x${string}`;
    implementation: `0x${string}`;
    name: string;
    version: string;
    author: `0x${string}`;
    verified: boolean;
    templateType: number;
    auditHash: string;
    audited: boolean;
    category?: string;
    description?: string;
  }
  