export enum Type {
  TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
  NULL = "NULL",
}

export interface Schema {
  type: Type;
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
  properties?: {
    [k: string]: Schema;
  };
  required?: string[];
  items?: Schema;
}
