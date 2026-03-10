import { Component, ContentChildren, ElementRef, input, output, QueryList, signal, viewChild } from '@angular/core';
import { CarouselItem } from '../carousel-item/carousel-item';

@Component({
  selector: 'cn-carousel',
  imports: [],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
})
export class Carousel {
  @ContentChildren(CarouselItem) items!: QueryList<CarouselItem>;

  showIndicators = input<boolean>(true);
  activeIndex = input<number>(0);

  itemCount = signal<number>(0);

  // Output when the active index changes
  activeIndexChange = output<number>();

  carouselContainer = viewChild<ElementRef<HTMLDivElement>>('carouselContainer');

  currentIndex = signal<number>(0);

  ngAfterContentInit(): void {
    // Set item count from content children
    this.itemCount.set(this.items.length);
  }

  ngAfterViewInit(): void {
    // Sync with input
    this.currentIndex.set(this.activeIndex());
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth;

    // Calculate which card is currently in view
    const index = Math.round(scrollLeft / cardWidth);

    // Update current index
    if (index !== this.currentIndex() && index >= 0 && index < this.itemCount()) {
      this.currentIndex.set(index);
      this.activeIndexChange.emit(index);
    }
  }

  scrollToIndex(index: number): void {
    const container = this.carouselContainer()?.nativeElement;
    if (container) {
      // Scroll slightly past the target to ensure scroll-snap activates
      // Adding 1px ensures the snap point is crossed
      const scrollWidth = container.clientWidth;
      container.scrollTo({
        left: scrollWidth * index + 1,
        behavior: 'smooth'
      });
    }
  }

  getIndicatorArray(): number[] {
    return Array.from({ length: this.itemCount() }, (_, i) => i);
  }
}
