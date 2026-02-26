import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  private itemSelectedSubject = new Subject<ItemSelectedArgs>();

  // Expose as observables (read-only)
  itemSelected$ = this.itemSelectedSubject.asObservable();

  selectItem(item: SelectableItem, sender: any) {
    this.itemSelectedSubject.next(new ItemSelectedArgs(item, sender));
  }
}

export class SelectableItem {
  id: string;
  type: string;
  data: any;
  project: string;

  constructor(id: string, type: string, project: string, data?: any) {
    this.id = id;
    this.type = type;
    this.project = project;
    this.data = data;
  }
}

export class ItemSelectedArgs {
  item: SelectableItem;
  sender: any;

  constructor(item: SelectableItem, sender: any) {
    this.item = item;
    this.sender = sender;
  }
}

