import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StackNavigationShell, EmptyPage, StackPageInfo } from '@connected-ng/components';

@Component({
  selector: 'cn-code-list-container',
  imports: [StackNavigationShell],
  templateUrl: './code-list-container.html',
  styleUrl: './code-list-container.scss',
})
export class CodeListContainer {
  rootPage = input<StackPageInfo<unknown>>(EmptyPage);
  route = inject(ActivatedRoute);

  /**
   * Child path segments to reconstruct navigation.
   * These are the segments after the code list key (e.g., ['new'] or ['edit', '1005'])
   */
  childPath = computed(() => {
    const url = this.route.snapshot.url;
    const segments = url.slice(1).map(segment => segment.path);
    console.log('[CodeListContainer] childPath computed:', { fullUrl: url.map(s => s.path), childPath: segments });
    return segments;
  });
}
