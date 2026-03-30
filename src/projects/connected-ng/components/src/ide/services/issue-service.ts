import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { configurationValue, ConnectedServiceBase } from '@connected-ng/core';
import { IIssueItem } from './dtos/issue-item';

export const ISSUE_SERVICE_CONFIG = new InjectionToken<IssueServiceConfiguration>('ISSUE_SERVICE_CONFIG');

export class IssueServiceConfiguration {
  baseUrl = configurationValue.required<string>('Issue service base URL');
}

export interface IIssueQueryDto {
  context: string;
}

@Injectable({
  providedIn: 'root',
})
export class IssueService extends ConnectedServiceBase {
  private configuration = inject(ISSUE_SERVICE_CONFIG);

  override serviceUrl = 'services/ide/issues';

  override getBaseUrl(): string {
    return this.configuration.baseUrl();
  }

  /** Live list of issues — updated by polling and imperative add/clear calls. */
  readonly issues = signal<IIssueItem[]>([]);

  readonly query = this.createGetOperation<IIssueQueryDto, IIssueItem[]>('query');

  /** Fetch issues from the backend and push them into the signal. */
  refresh(context: string): void {
    this.query({ context }).subscribe({
      next: (items) => this.issues.set(items),
    });
  }

  /** Imperatively add one or more issues (e.g. from a local validator). */
  add(items: IIssueItem | IIssueItem[]): void {
    const toAdd = Array.isArray(items) ? items : [items];
    this.issues.update((current) => {
      const ids = new Set(toAdd.map((i) => i.id));
      return [...current.filter((i) => !ids.has(i.id)), ...toAdd];
    });
  }

  /** Remove all issues, or only those matching a predicate. */
  clear(predicate?: (item: IIssueItem) => boolean): void {
    if (predicate) {
      this.issues.update((current) => current.filter((i) => !predicate(i)));
    } else {
      this.issues.set([]);
    }
  }
}
