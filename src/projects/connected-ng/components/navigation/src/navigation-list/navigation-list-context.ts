import { Injectable } from "@angular/core";
import { BehaviorSubject, map, Observable } from "rxjs";
import { NavigationItem } from "./navigation-item";

export interface NavigationContext {
  menu: string;
  flags: Record<string, boolean>;
}

const DEFAULT_GROUP = 'default';

@Injectable({
  providedIn: 'root'
})
export class NavigationListContextService {
  private readonly _groups = new Map<string, NavigationItem[]>();
  private readonly _items$ = new BehaviorSubject<NavigationItem[]>([]);

  readonly items$: Observable<NavigationItem[]> = this._items$.asObservable();

  /** Replaces all items belonging to the named group and re-emits the full item list. */
  setGroup(groupId: string, items: NavigationItem[]) {
    this._groups.set(groupId, items);
    this._emit();
  }

  private _emit() {
    const all = Array.from(this._groups.values()).flat();
    this._items$.next(all);
  }

  registerItems(items: NavigationItem[]) {
    const group = this._groups.get(DEFAULT_GROUP) ?? [];
    this._groups.set(DEFAULT_GROUP, [...group, ...items]);
    this._emit();
  }

  registerItem(item: NavigationItem, parent?: NavigationItem, index?: number) {
    if (parent) {
      const children = parent.children ?? [];
      const insertAt = index !== undefined ? Math.min(index, children.length) : children.length;
      parent.children = [...children.slice(0, insertAt), item, ...children.slice(insertAt)];
      this._emit();
    } else {
      const group = this._groups.get(DEFAULT_GROUP) ?? [];
      const insertAt = index !== undefined ? Math.min(index, group.length) : group.length;
      const updated = [...group.slice(0, insertAt), item, ...group.slice(insertAt)];
      this._groups.set(DEFAULT_GROUP, updated);
      this._emit();
    }
  }

  getMenu(menu: string, context?: Partial<Omit<NavigationContext, 'menu'>>): Observable<NavigationItem[]> {
    const ctx: NavigationContext = {
      menu,
      flags: context?.flags ?? {},
    };

    return this._items$.pipe(
      map(items => this.filterItems(items, ctx))
    );
  }

  private filterItems(items: NavigationItem[], ctx: NavigationContext): NavigationItem[] {
    return items
      .filter(item => this.isVisible(item, ctx))
      .map(item => ({
        ...item,
        children: item.children ? this.filterItems(item.children, ctx) : undefined
      }))
      .filter(item => !item.children || item.children.length > 0 || item.route || item.externalUrl);
  }

  private isVisible(item: NavigationItem, ctx: NavigationContext): boolean {
    if (!item.menus.includes(ctx.menu)) {
      return false;
    }

    if (item.featureFlag && !ctx.flags[item.featureFlag]) {
      return false;
    }

    return true;
  }
}
