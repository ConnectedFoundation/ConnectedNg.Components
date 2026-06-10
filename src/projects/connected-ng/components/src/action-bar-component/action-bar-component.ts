import { afterRenderEffect, Component, ElementRef, HostListener, input, viewChild } from '@angular/core';
import { FloatingActionBar } from './floating-action-bar/floating-action-bar';
import { ActionDescriptionWithAction } from '../action-tile/action-tile';


@Component({
  selector: 'cn-action-bar-component',
  imports: [FloatingActionBar],
  templateUrl: './action-bar-component.html',
  styleUrl: './action-bar-component.scss',
})
export class ActionBarComponent {
  actions = input.required<ActionDescriptionWithAction[]>();

  private actionBarElement = viewChild<ElementRef<HTMLElement>, ElementRef>('actionBarElement', { read: ElementRef, debugName: '' });

  actionBarHeight = 0;

  constructor() {
    afterRenderEffect(() => {
      if (this.actionBarElement() && this.actions()?.length)
        this.updateActionBarHeight();
    });
  }

  ngAfterViewInit() {
    this.updateActionBarHeight();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateActionBarHeight();
  }

  private updateActionBarHeight() {
    if (this.actionBarElement())
      this.actionBarHeight = this.actionBarElement()!.nativeElement?.offsetHeight ?? 0;
  }
} 
