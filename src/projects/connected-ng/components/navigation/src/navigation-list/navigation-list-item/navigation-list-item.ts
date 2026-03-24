// navigation-list-item.component.ts
import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NavigationItem } from '../navigation-item';

@Component({
  selector: 'cn-navigation-list-item',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatBadgeModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
  ],
  styleUrl: './navigation-list-item.scss',
  templateUrl: './navigation-list-item.html',
})
export class NavigationListItem {
  private router = inject(Router);

  item = input.required<NavigationItem>();
  isCollapsed = input<boolean>(false);
  nestedMenuOpen = signal<boolean>(false);

  toggleNested(item: NavigationItem) {
    if (!item.children)
      return;

    this.nestedMenuOpen.set(!this.nestedMenuOpen());
  }
  /*end nested*/

  navigate(section: NavigationItem) {
    if (section.action) {
      section.action();
      return;
    }

    if (!section.route)
      return;

    this.router.navigate([section.route]);
  }
}
