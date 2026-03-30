export enum IssueSeverity {
  Suggestion = 0,
  Warning = 1,
  Error = 2,
}

export interface IIssueItem {
  id: string;
  severity: IssueSeverity;
  message: string;
  code: string;
  documentName: string;
  editorItem: string;
}
