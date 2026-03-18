import { Component, input } from '@angular/core';
import { ActionDescriptionWithAction, ActionTile } from '../../action-tile/action-tile';
import { Carousel } from "../../carousel/carousel/carousel";
import { CarouselItem } from "../../carousel/carousel-item/carousel-item";

@Component({
  selector: 'cn-floating-action-bar',
  imports: [Carousel, CarouselItem, ActionTile],
  templateUrl: './floating-action-bar.html',
  styleUrl: './floating-action-bar.scss',
})
export class FloatingActionBar {
  actions = input.required<ActionDescriptionWithAction[]>();

  handleItemClick(item: ActionDescriptionWithAction, $event: Event) {
    if (item.action) {
      $event.preventDefault();
      $event.stopPropagation();
      item.action();
      return;
    }
  }
}
