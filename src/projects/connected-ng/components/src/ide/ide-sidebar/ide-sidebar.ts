import { Component, computed, ContentChildren, input, model, QueryList, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { IdeSidebarTabDirective } from './ide-sidebar-tab.directive';

export interface IdeSidebarTab {
  id: string;
  label: string;
  icon: string;
  template?: TemplateRef<any>;
  component?: any;
  disabled?: boolean;
}

@Component({
  selector: 'cf-ide-sidebar',
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule
  ],
  templateUrl: './ide-sidebar.html',
  styleUrls: ['./ide-sidebar.scss', '../ide.scss'],
})
export class IdeSidebar {
  tabs = input<IdeSidebarTab[]>([]);
  animationDuration = input<string>('200ms');
  selectedIndex = model<number>(0);

  @ContentChildren(IdeSidebarTabDirective)
  tabDirectives!: QueryList<IdeSidebarTabDirective>;

  activeTabs = computed(() => {
    const inputTabs = this.tabs();
    return inputTabs;
  });
}
