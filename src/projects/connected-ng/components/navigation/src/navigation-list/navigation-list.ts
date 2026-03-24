import { Component, inject, input, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from "@angular/material/select";
import { NavigationListItem } from './navigation-list-item/navigation-list-item';
import { A11yModule } from "@angular/cdk/a11y";
import { NavigationItem } from './navigation-item';


@Component({
  selector: 'cn-navigation-list',
  imports: [
    MatListModule,
    NavigationListItem,
    MatBadgeModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    A11yModule
  ],
  templateUrl: './navigation-list.html',
  styleUrl: './navigation-list.scss'
})
export class NavigationList {
  isCollapsed = input<boolean>(false);
  navigationItems = input<NavigationItem[]>([]);
  router = inject(Router);

  nestedMenuOpen = signal(false);
}


