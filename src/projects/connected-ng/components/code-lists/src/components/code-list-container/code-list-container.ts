import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StackNavigationShell, EmptyPage, StackPageInfo } from '@connected-ng/components/navigation';

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
   * These are the full URL segments (e.g., ['energy-sources', 'new'] or ['energy-costs', 'edit', '5'])
   * used with the code-lists root page to reconstruct the full navigation stack.
   */
  childPath = computed(() => {
    const url = this.route.snapshot.url;
    const segments = url.map(segment => segment.path);
    console.log('[CodeListContainer] childPath computed:', { fullUrl: url.map(s => s.path), childPath: segments });
    return segments;
  });
}
