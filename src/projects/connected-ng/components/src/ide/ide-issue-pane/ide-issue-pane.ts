import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subscription } from 'rxjs';
import { IssueService } from '../services/issue-service';
import { IIssueItem, IssueSeverity } from '../services/dtos/issue-item';
import { SelectionService } from '../services/selection-service';
import { IdeItemId } from '../ide-item-id';

export interface IssueGroup {
  documentName: string;
  issues: IIssueItem[];
}

/** How often (ms) the pane re-fetches issues from the backend. */
const POLL_INTERVAL_MS = 10_000;

@Component({
  selector: 'cf-ide-issue-pane',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './ide-issue-pane.html',
  styleUrl: './ide-issue-pane.scss',
})
export class IdeIssuePane implements OnInit, OnDestroy {
  context = input.required<string>();

  private issueService = inject(IssueService);
  private selectionService = inject(SelectionService);
  private subscriptions = new Subscription();

  protected readonly IssueSeverity = IssueSeverity;

  /** Derived directly from the service signal — no local copy. */
  protected issues = this.issueService.issues;

  /** Which severity filters are active (true = shown). */
  protected showErrors = signal(true);
  protected showWarnings = signal(true);
  protected showSuggestions = signal(true);

  /** Set of collapsed document names. */
  protected collapsedGroups = signal<Set<string>>(new Set());

  protected errorCount = computed(() =>
    this.issues().filter((i) => i.severity === IssueSeverity.Error).length
  );
  protected warningCount = computed(() =>
    this.issues().filter((i) => i.severity === IssueSeverity.Warning).length
  );
  protected suggestionCount = computed(() =>
    this.issues().filter((i) => i.severity === IssueSeverity.Suggestion).length
  );

  protected groupedIssues = computed<IssueGroup[]>(() => {
    const filtered = this.issues().filter((i) => {
      if (i.severity === IssueSeverity.Error && !this.showErrors()) return false;
      if (i.severity === IssueSeverity.Warning && !this.showWarnings()) return false;
      if (i.severity === IssueSeverity.Suggestion && !this.showSuggestions()) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => b.severity - a.severity);
    const map = new Map<string, IIssueItem[]>();
    for (const issue of sorted) {
      const key = issue.documentName || '(unknown document)';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(issue);
    }
    return Array.from(map.entries()).map(([documentName, issues]) => ({
      documentName,
      issues,
    }));
  });

  protected isGroupCollapsed(documentName: string): boolean {
    return this.collapsedGroups().has(documentName);
  }

  protected toggleGroup(documentName: string): void {
    const current = new Set(this.collapsedGroups());
    if (current.has(documentName)) {
      current.delete(documentName);
    } else {
      current.add(documentName);
    }
    this.collapsedGroups.set(current);
  }

  protected toggleFilter(severity: IssueSeverity): void {
    if (severity === IssueSeverity.Error) {
      this.showErrors.set(!this.showErrors());
    } else if (severity === IssueSeverity.Warning) {
      this.showWarnings.set(!this.showWarnings());
    } else {
      this.showSuggestions.set(!this.showSuggestions());
    }
  }

  ngOnInit(): void {
    this.issueService.refresh(this.context());
    this.subscriptions.add(
      interval(POLL_INTERVAL_MS).subscribe(() =>
        this.issueService.refresh(this.context())
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  selectItem(issue: IIssueItem): void {
    if (!issue.editorItem) {
      return;
    }
    this.selectionService.select({
      id: issue.editorItem,
      type: IdeItemId.scheme(issue.editorItem),
      currentEditor: 'IdeIssuePane',
    });
  }

  protected severityIcon(severity: IssueSeverity): string {
    switch (severity) {
      case IssueSeverity.Error:
        return 'error';
      case IssueSeverity.Warning:
        return 'warning';
      case IssueSeverity.Suggestion:
        return 'lightbulb';
    }
  }

  protected severityLabel(severity: IssueSeverity): string {
    switch (severity) {
      case IssueSeverity.Error:
        return 'Error';
      case IssueSeverity.Warning:
        return 'Warning';
      case IssueSeverity.Suggestion:
        return 'Suggestion';
    }
  }
}
