import { Component, ElementRef, HostListener, input, viewChild, ViewChild } from '@angular/core';
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

  actionBar = viewChild<ElementRef<HTMLElement>>('actionBar');

  actionBarHeight = 0;

  ngAfterViewInit() {
    this.updateActionBarHeight();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateActionBarHeight();
  }

  private updateActionBarHeight() {
    if (this.actionBar())
      this.actionBarHeight = this.actionBar()!.nativeElement?.offsetHeight ?? 0;
  }
}
