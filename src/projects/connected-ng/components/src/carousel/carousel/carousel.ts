import { Component, computed, ContentChildren, ElementRef, input, output, QueryList, signal, viewChild } from '@angular/core';
import { CarouselItem } from '../carousel-item/carousel-item';
import { MatIcon } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';


/**
 * Configures how many items are visible at different container widths.
 * - A `number` shows that many items at all sizes.
 * - A `Record<number, number>` maps minimum container widths (px) to visible item counts.
 *   Example: `{ 0: 1, 768: 2, 1024: 3 }` — 1 item below 768px, 2 below 1024px, 3 at 1024px+.
 */
export type CarouselVisibleItems = number | Record<number, number>;

@Component({
  selector: 'cn-carousel',
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
  imports: [MatIcon, MatButtonModule],
})
export class Carousel {
  @ContentChildren(CarouselItem) items!: QueryList<CarouselItem>;

  showIndicators = input<boolean>(true);
  showChevrons = input<boolean>(true);
  activeIndex = input<number>(0);
  visibleItems = input<CarouselVisibleItems>({ 0: 1, 786: 2, 1280: 3 });

  itemCount = signal<number>(0);
  visibleCount = signal<number>(1);

  /** Number of distinct scroll positions (pages). */
  pageCount = computed(() => Math.max(1, this.itemCount() - this.visibleCount() + 1));

  // Output when the active index changes
  activeIndexChange = output<number>();

  carouselContainer = viewChild<ElementRef<HTMLDivElement>>('carouselContainer');

  currentIndex = signal<number>(0);

  canScrollPrev = computed(() => this.currentIndex() > 0);
  canScrollNext = computed(() => this.currentIndex() < this.pageCount() - 1);

  isDragging = signal(false);
  private dragStartX = 0;
  private dragScrollLeft = 0;

  private resizeObserver: ResizeObserver | null = null;

  ngAfterContentInit() {
    this.itemCount.set(this.items.length);
  }

  ngAfterViewInit() {
    this.currentIndex.set(this.activeIndex());
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  onScroll(event: Event) {
    let container = event.target as HTMLElement;
    let scrollLeft = container.scrollLeft;
    let stride = this.getItemStride(container);
    if (stride <= 0)
      return;

    let index = Math.round(scrollLeft / stride);
    let maxIndex = this.pageCount() - 1;
    let clamped = Math.max(0, Math.min(index, maxIndex));

    if (clamped !== this.currentIndex()) {
      this.currentIndex.set(clamped);
      this.activeIndexChange.emit(clamped);
    }
  }

  scrollToIndex(index: number) {
    let container = this.carouselContainer()?.nativeElement;
    if (!container)
      return;

    let stride = this.getItemStride(container);
    container.scrollTo({
      left: stride * index + 1,
      behavior: 'smooth'
    });
  }

  scrollPrev() {
    if (this.canScrollPrev())
      this.scrollToIndex(this.currentIndex() - 1);
  }

  scrollNext() {
    if (this.canScrollNext())
      this.scrollToIndex(this.currentIndex() + 1);
  }

  onDragStart(event: MouseEvent) {
    let container = this.carouselContainer()?.nativeElement;
    if (!container)
      return;

    this.isDragging.set(true);
    this.dragStartX = event.pageX - container.offsetLeft;
    this.dragScrollLeft = container.scrollLeft;
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging())
      return;

    event.preventDefault();

    let container = this.carouselContainer()?.nativeElement;

    if (!container)
      return;

    let x = event.pageX - container.offsetLeft;
    let walk = x - this.dragStartX;

    container.scrollLeft = this.dragScrollLeft - walk;
  }

  onDragEnd() {
    this.isDragging.set(false);
  }

  getIndicatorArray() {
    return Array.from({ length: this.pageCount() }, (_, i) => i);
  }

  private getItemStride(container: HTMLElement) {
    let count = this.itemCount();
    if (count <= 1)
      return container.offsetWidth;

    return container.scrollWidth / count;
  }

  private setupResizeObserver() {
    let container = this.carouselContainer()?.nativeElement;

    if (!container)
      return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        this.applyVisibleCount(entry.contentRect.width);
      }
    });

    this.resizeObserver.observe(container);

    this.applyVisibleCount(container.clientWidth);
  }

  private applyVisibleCount(containerWidth: number) {
    let config = this.visibleItems();
    let count: number;

    if (typeof config === 'number') {
      count = config;
    } else {
      let breakpoints = Object.keys(config).map(Number).sort((a, b) => a - b);

      count = breakpoints[0] === 0 ? config[0] : 1;

      for (let bp of breakpoints) {
        if (containerWidth >= bp) {
          count = config[bp];
          continue;
        }

        break;
      }
    }

    this.visibleCount.set(count);

    let container = this.carouselContainer()?.nativeElement;

    if (container)
      container.style.setProperty('--visible-items', String(count));
  }
}
