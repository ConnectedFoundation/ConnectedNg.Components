export const IdeScheme = {
  Workflow: 'workflow',
  WorkflowNode: 'workflownode',
  CustomCsharpCode: 'customcsharpcode',
  Script: 'script',
  ScriptsFolder: 'scriptsfolder',
} as const;

export type IdeSchemeType = (typeof IdeScheme)[keyof typeof IdeScheme];

export const IdeItemId = {
  /** Create a scheme-prefixed ID, e.g. `workflow://some-guid`. */
  create(scheme: IdeSchemeType, value: string): string {
    return `${scheme}://${value}`;
  },

  /** Extract the scheme part of an ID, e.g. `"workflow"`. Returns `""` if no scheme. */
  scheme(id: string): string {
    const idx = id.indexOf('://');
    return idx !== -1 ? id.substring(0, idx) : '';
  },

  /** Extract the raw value after the scheme separator, e.g. the GUID. Returns the id unchanged if no scheme. */
  value(id: string): string {
    const idx = id.indexOf('://');
    return idx !== -1 ? id.substring(idx + 3) : id;
  },

  /** Returns true when the id starts with the given scheme. Handles null/undefined safely. */
  hasScheme(id: string | undefined | null, scheme: IdeSchemeType): boolean {
    return id?.startsWith(`${scheme}://`) ?? false;
  },
};
