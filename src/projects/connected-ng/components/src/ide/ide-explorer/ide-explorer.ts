import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Subscription } from 'rxjs';
import { IdeExplorerTemplateDirective } from './ide-explorer-template';
import { IdeExplorerItemService, IExplorerItem } from '../services/explorer-item-service';
import { SelectionService, SelectedItem } from '../services/selection-service';

export type ExplorerId = string;

export interface ExplorerNode<TItem = IExplorerItem> {
  id: ExplorerId;
  item: TItem;
  templateKey: string;
  children: ExplorerNode<TItem>[];
  isDraggable: boolean;
}

export interface ExplorerDropContext<TItem = IExplorerItem> {
  /** The node being dragged */
  draggedNode: ExplorerNode<TItem>;
  /** The parent node where the item will be dropped (null if dropped at root level) */
  targetParentNode: ExplorerNode<TItem> | null;
  /** The index within the target parent's children where the item will be inserted */
  targetIndex: number;
  /** The current parent node of the dragged item (null if at root level) */
  sourceParentNode: ExplorerNode<TItem> | null;
  /** The current index of the dragged item within its parent's children */
  sourceIndex: number;
}

export interface IdeExplorerMoveEvent {
  movedId: ExplorerId;
  previousParentId: ExplorerId | null;
  previousIndex: number;
  newParentId: ExplorerId | null;
  newIndex: number;
}

export interface IdeExplorerSelectionItem<TItem = IExplorerItem> {
  id: ExplorerId;
  item: TItem;
}

@Component({
  selector: 'cf-ide-explorer',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ide-explorer.html',
  styleUrl: './ide-explorer.scss',
})
export class IdeExplorer<TItem extends IExplorerItem = IExplorerItem> implements OnInit, OnDestroy {
  // ---------------- Inputs ----------------
  context = input.required<string>();

  /**
   * Validation function to control whether a drop operation is allowed.
   * Return true to allow the drop, false to prevent it.
   *
   * Example: Prevent dragging items between different projects:
   * ```typescript
   * canDropFn = (context: ExplorerDropContext<MyItem>) => {
   *   const sourceProjectId = context.sourceParentNode?.item.projectId ?? context.draggedNode.item.projectId;
   *   const targetProjectId = context.targetParentNode?.item.projectId ?? 'root';
   *   return sourceProjectId === targetProjectId;
   * };
   * ```
   */
  canDropFunction = input<(context: ExplorerDropContext<TItem>) => boolean>(() => true);

  /** Provide your own expand control template (chevron/icon). Optional. */
  expandControlTemplate = input<TemplateRef<any> | null>(null);

  /** Fallback template used when no string key or function selector matches a node. Optional. */
  defaultTemplate = input<TemplateRef<any> | null>(null);

  isMultiSelectEnabled = input<boolean>(true);
  nodeIndentationPixels = input<number>(16);
  autoExpandHoverDelayMilliseconds = input<number>(450);
  autoExpandRoots = input<boolean>(false);

  // ---------------- Outputs ----------------
  itemClicked = output<{ id: ExplorerId; item: TItem }>();
  itemDoubleClicked = output<{ id: ExplorerId; item: TItem }>();
  activeItemChanged = output<IdeExplorerSelectionItem<TItem> | null>();
  selectionChanged = output<IdeExplorerSelectionItem<TItem>[]>();
  moved = output<IdeExplorerMoveEvent>();

  // ---------------- Template mapping ----------------
  private templateDirectives = contentChildren(IdeExplorerTemplateDirective);

  // ---------------- Services ----------------
  private explorerItemService = inject(IdeExplorerItemService);
  private selectionService = inject(SelectionService);

  // ---------------- Internal state ----------------
  private items = signal<TItem[]>([]);

  private templateEntries = computed(() =>
    this.templateDirectives().map(d => ({ matcher: d.templateKey, templateRef: d.templateRef }))
  );

  stringify(data: any) { return JSON.stringify(data) }

  resolveTemplate(templateKey: string, item: TItem): TemplateRef<any> | undefined {
    const entries = this.templateEntries();

    // Exact string match first
    for (const entry of entries) {
      if (typeof entry.matcher === 'string' && entry.matcher === templateKey) {
        return entry.templateRef;
      }
    }

    // Function selector match
    for (const entry of entries) {
      if (typeof entry.matcher === 'function' && entry.matcher(item)) {
        return entry.templateRef;
      }
    }

    // Fall back to the defaultTemplate input, if provided
    return this.defaultTemplate() ?? undefined;
  }

  // ---------------- State ----------------
  rootNodes = signal<ExplorerNode<TItem>[]>([]);
  activeNodeId = signal<ExplorerId | null>(null);

  private selectedNodeIds = signal<Set<ExplorerId>>(new Set());
  private lastSelectionAnchorId = signal<ExplorerId | null>(null);

  private expandedNodeIds = signal<Set<ExplorerId>>(new Set());

  // HTML5 Drag/drop state
  private draggedNode = signal<ExplorerNode<TItem> | null>(null);
  private dragOverNodeId = signal<ExplorerId | null>(null);
  private dropPosition = signal<'before' | 'after' | 'inside' | null>(null);
  private isCurrentDropValid = signal<boolean>(false);
  private autoExpandTimeoutHandle: number | null = null;
  private subscriptions = new Subscription();

  ngOnInit() {
    this.loadExplorerItems();

    // Listen to selection service and select matching items
    if (this.selectionService.$selected) {
      this.subscriptions.add(
        this.selectionService.$selected.subscribe(selected => {
          if (!selected?.id) return;

          // Only respond to selections from other editors
          if (selected.currentEditor === 'IdeExplorer') return;

          // Find the node with matching ID
          const node = this.findNodeById(this.rootNodes(), selected.id);
          if (node) {
            // Set as active node (but don't propagate back to selection service)
            this.activeNodeId.set(node.id);
            this.activeItemChanged.emit({ id: node.id, item: node.item });
          }
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.clearAutoExpandTimeout();
  }

  loadExplorerItems() {
    this.explorerItemService.query({
      context: this.context()
    }).subscribe(items => {
      this.items.set(items as TItem[]);
    });
  }

  constructor() {
    effect(() => {
      let nodes = this.buildTreeFromFlatData(this.items());

      untracked(() => {
        this.rootNodes.set(nodes);

        // Keep active item valid
        let active = this.activeNodeId();

        if (active && !this.findNodeById(nodes, active)) {
          this.activeNodeId.set(null);
          this.activeItemChanged.emit(null);
        }

        // Prune selection to existing ids
        let selected = this.selectedNodeIds();
        let pruned = new Set<ExplorerId>();

        for (let id of selected) {
          if (this.findNodeById(nodes, id)) {
            pruned.add(id);
          }
        }

        if (pruned.size !== selected.size) {
          this.selectedNodeIds.set(pruned);
          this.selectionChanged.emit(this.getSelectionItems(pruned));
        }

        // Optionally expand all root nodes
        if (this.autoExpandRoots()) {
          let expanded = new Set(this.expandedNodeIds());

          for (let rootNode of nodes) {
            expanded.add(rootNode.id);
          }

          this.expandedNodeIds.set(expanded);
        }
      });
    });
  }

  // ---------------- Rendering helpers ----------------
  trackNodeById = (node: ExplorerNode<TItem>) => node.id;

  // ---------------- Expand/collapse ----------------
  isNodeExpanded(nodeId: ExplorerId): boolean {
    return this.expandedNodeIds().has(nodeId);
  }

  toggleNodeExpansion(node: ExplorerNode<TItem>, event: MouseEvent) {
    event.stopPropagation();
    let expanded = new Set(this.expandedNodeIds());

    if (expanded.has(node.id)) {
      expanded.delete(node.id);
    }
    else {
      expanded.add(node.id);
    }

    this.expandedNodeIds.set(expanded);
  }

  private expandNode(nodeId: ExplorerId) {
    let expanded = new Set(this.expandedNodeIds());

    if (!expanded.has(nodeId)) {
      expanded.add(nodeId);
      this.expandedNodeIds.set(expanded);
    }
  }

  // ---------------- Click / double click ----------------
  handleClick(node: ExplorerNode<TItem>, event: MouseEvent) {
    this.itemClicked.emit({ id: node.id, item: node.item });

    // In IDE explorers, clicking a node makes it active (unless multi-selecting)
    let isMultiSelectModifier = event.ctrlKey || event.metaKey || event.shiftKey;

    if (!isMultiSelectModifier || !this.isMultiSelectEnabled()) {
      this.activeNodeId.set(node.id);
      this.activeItemChanged.emit({ id: node.id, item: node.item });

      // Notify selection service on user click
      const selectDto: SelectedItem = {
        id: node.item.id,
        currentEditor: 'IdeExplorer',
        type: node.item.type,
        context: this.context()
      };
      this.selectionService.select(selectDto);
    }

    this.updateSelectionFromClick(node.id, event);
  }

  handleDoubleClick(node: ExplorerNode<TItem>, _event: MouseEvent) {
    this.itemDoubleClicked.emit({ id: node.id, item: node.item });
    this.activeNodeId.set(node.id);
    this.activeItemChanged.emit({ id: node.id, item: node.item });

    // Notify selection service on user double-click
    const selectDto: SelectedItem = {
      id: node.item.id,
      currentEditor: 'IdeExplorer',
      type: node.item.type,
      context: this.context()
    };
    this.selectionService.select(selectDto);

    // Toggle expansion on double-click if node has children
    if (node.children.length > 0) {
      this.toggleNodeExpansion(node, _event as any as MouseEvent);
    }
  }

  // ---------------- Selection ----------------
  isNodeSelected(nodeId: ExplorerId): boolean {
    return this.selectedNodeIds().has(nodeId);
  }

  /**
   * Set the selected items programmatically from outside the component.
   * Also sets the active item to the first selected item (or clears it if none selected).
   * @param nodeIds Array of node IDs to select. Pass empty array to clear selection and active item.
   * @param emitEvent Whether to emit the selectionChanged and activeItemChanged events (default: true)
   */
  setSelectedItems(nodeIds: ExplorerId[], emitEvent: boolean = true): void {
    const validIds = new Set<ExplorerId>();
    const rootNodes = this.rootNodes();

    // Validate that all IDs exist in the tree
    for (const id of nodeIds) {
      if (this.findNodeById(rootNodes, id)) {
        validIds.add(id);
      }
    }

    this.selectedNodeIds.set(validIds);

    // Set active item and selection anchor
    if (validIds.size > 0) {
      const firstId = nodeIds.find(id => validIds.has(id))!;
      this.activeNodeId.set(firstId);
      this.lastSelectionAnchorId.set(Array.from(validIds)[validIds.size - 1]);

      if (emitEvent) {
        const firstNode = this.findNodeById(rootNodes, firstId);
        if (firstNode) {
          this.activeItemChanged.emit({ id: firstNode.id, item: firstNode.item });
        }
      }
    } else {
      this.activeNodeId.set(null);
      this.lastSelectionAnchorId.set(null);

      if (emitEvent) {
        this.activeItemChanged.emit(null);
      }
    }

    if (emitEvent) {
      this.selectionChanged.emit(this.getSelectionItems(validIds));
    }
  }

  private updateSelectionFromClick(nodeId: ExplorerId, event: MouseEvent) {
    let isTogglePressed = event.ctrlKey || event.metaKey;
    let isRangePressed = event.shiftKey;

    let currentSelection = new Set(this.selectedNodeIds());

    if (!this.isMultiSelectEnabled()) {
      currentSelection.clear();
      currentSelection.add(nodeId);
      this.lastSelectionAnchorId.set(nodeId);
      this.selectedNodeIds.set(currentSelection);
      this.selectionChanged.emit(this.getSelectionItems(currentSelection));
      return;
    }

    if (isRangePressed) {
      let anchor = this.lastSelectionAnchorId();

      if (!anchor) {
        currentSelection.clear();
        currentSelection.add(nodeId);
        this.lastSelectionAnchorId.set(nodeId);
      }
      else {
        let visibleIds = this.getVisibleNodeIdsInOrder();
        let anchorIndex = visibleIds.indexOf(anchor);
        let targetIndex = visibleIds.indexOf(nodeId);

        if (anchorIndex !== -1 && targetIndex !== -1) {
          let start = Math.min(anchorIndex, targetIndex);
          let end = Math.max(anchorIndex, targetIndex);
          currentSelection.clear();

          for (let index = start; index <= end; index++) {
            currentSelection.add(visibleIds[index]);
          }
        }
        else {
          currentSelection.clear();
          currentSelection.add(nodeId);
          this.lastSelectionAnchorId.set(nodeId);
        }
      }
    }
    else if (isTogglePressed) {
      if (currentSelection.has(nodeId)) {
        currentSelection.delete(nodeId);
      }
      else {
        currentSelection.add(nodeId);
      }

      this.lastSelectionAnchorId.set(nodeId);
    }
    else {
      currentSelection.clear();
      currentSelection.add(nodeId);
      this.lastSelectionAnchorId.set(nodeId);
    }

    this.selectedNodeIds.set(currentSelection);
    this.selectionChanged.emit(this.getSelectionItems(currentSelection));
  }

  private getSelectionItems(selectedIds: Set<ExplorerId>): IdeExplorerSelectionItem<TItem>[] {
    const items: IdeExplorerSelectionItem<TItem>[] = [];

    for (const id of selectedIds) {
      const node = this.findNodeById(this.rootNodes(), id);
      if (node) {
        items.push({ id: node.id, item: node.item });
      }
    }

    return items;
  }

  private getVisibleNodeIdsInOrder(): ExplorerId[] {
    let ids: ExplorerId[] = [];
    let visit = (nodes: ExplorerNode<TItem>[]) => {
      for (let node of nodes) {
        ids.push(node.id);

        if (node.children.length > 0 && this.isNodeExpanded(node.id)) {
          visit(node.children);
        }
      }
    };
    visit(this.rootNodes());
    return ids;
  }

  // ---------------- HTML5 Drag & Drop ----------------
  onDragStart(event: DragEvent, node: ExplorerNode<TItem>) {
    if (!node.isDraggable) {
      event.preventDefault();
      return;
    }

    this.draggedNode.set(node);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', node.id);
    }
  }

  onDragOver(event: DragEvent, node: ExplorerNode<TItem>) {
    event.preventDefault();

    const draggedNode = this.draggedNode();
    if (!draggedNode || draggedNode.id === node.id) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      return;
    }

    // Check for cycles
    if (this.isIdInSubtree(draggedNode, node.id)) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      this.isCurrentDropValid.set(false);
      return;
    }

    // Determine drop position based on mouse position
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const height = rect.height;

    let position: 'before' | 'after' | 'inside';
    if (node.children.length > 0 && this.isNodeExpanded(node.id)) {
      // For expanded nodes with children, drop inside
      position = 'inside';
    } else if (relativeY < height * 0.33) {
      position = 'before';
    } else if (relativeY > height * 0.67) {
      position = 'after';
    } else {
      position = 'inside';
    }

    // Determine target parent and index for validation
    const sourceParentNode = this.findParentNodeByChildId(this.rootNodes(), draggedNode.id);
    const sourceArray = sourceParentNode ? sourceParentNode.children : this.rootNodes();
    const sourceIndex = sourceArray.findIndex(n => n.id === draggedNode.id);

    let targetParentNode: ExplorerNode<TItem> | null;
    let targetIndex: number;

    if (position === 'inside') {
      targetParentNode = node;
      targetIndex = 0;
    } else {
      targetParentNode = this.findParentNodeByChildId(this.rootNodes(), node.id);
      const targetArray = targetParentNode ? targetParentNode.children : this.rootNodes();
      const targetNodeIndex = targetArray.findIndex(n => n.id === node.id);
      targetIndex = position === 'before' ? targetNodeIndex : targetNodeIndex + 1;
    }

    // Validate the drop using the canDropFunction
    const dropContext: ExplorerDropContext<TItem> = {
      draggedNode,
      targetParentNode,
      targetIndex,
      sourceParentNode,
      sourceIndex,
    };

    const isDropAllowed = this.canDropFunction()(dropContext);
    this.isCurrentDropValid.set(isDropAllowed);

    if (isDropAllowed) {
      this.dragOverNodeId.set(node.id);
      this.dropPosition.set(position);

      // Auto-expand after hover delay
      if (position === 'inside' && !this.isNodeExpanded(node.id) && node.children.length > 0) {
        this.clearAutoExpandTimeout();
        this.autoExpandTimeoutHandle = window.setTimeout(() => {
          this.expandNode(node.id);
        }, this.autoExpandHoverDelayMilliseconds());
      }

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    } else {
      // Clear visual indicators if drop not allowed
      this.dragOverNodeId.set(null);
      this.dropPosition.set(null);
      this.clearAutoExpandTimeout();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
    }
  }

  onDragLeave(event: DragEvent) {
    // Only clear if we're really leaving (not entering a child)
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      this.dragOverNodeId.set(null);
      this.dropPosition.set(null);
      this.isCurrentDropValid.set(false);
      this.clearAutoExpandTimeout();
    }
  }

  onDrop(event: DragEvent, targetNode: ExplorerNode<TItem>) {
    event.preventDefault();

    const draggedNode = this.draggedNode();
    const position = this.dropPosition();

    if (!draggedNode || !position) {
      this.resetDragState();
      return;
    }

    // Find source parent and index
    const sourceParentNode = this.findParentNodeByChildId(this.rootNodes(), draggedNode.id);
    const sourceArray = sourceParentNode ? sourceParentNode.children : this.rootNodes();
    const sourceIndex = sourceArray.findIndex(n => n.id === draggedNode.id);

    // Determine target parent and index based on drop position
    let targetParentNode: ExplorerNode<TItem> | null;
    let targetIndex: number;

    if (position === 'inside') {
      targetParentNode = targetNode;
      targetIndex = 0;
    } else {
      targetParentNode = this.findParentNodeByChildId(this.rootNodes(), targetNode.id);
      const targetArray = targetParentNode ? targetParentNode.children : this.rootNodes();
      const targetNodeIndex = targetArray.findIndex(n => n.id === targetNode.id);
      targetIndex = position === 'before' ? targetNodeIndex : targetNodeIndex + 1;
    }

    // Check if drop is allowed
    const dropContext: ExplorerDropContext<TItem> = {
      draggedNode,
      targetParentNode,
      targetIndex,
      sourceParentNode,
      sourceIndex,
    };

    if (!this.canDropFunction()(dropContext)) {
      this.resetDragState();
      return;
    }

    // Check if this is actually a move
    const previousParentId = sourceParentNode ? sourceParentNode.id : null;
    const newParentId = targetParentNode ? targetParentNode.id : null;
    const isSameParent = previousParentId === newParentId;
    const isSamePosition = isSameParent && sourceIndex === targetIndex;

    if (isSamePosition) {
      this.resetDragState();
      return;
    }

    // Emit move event
    this.moved.emit({
      movedId: draggedNode.id,
      previousParentId,
      previousIndex: sourceIndex,
      newParentId,
      newIndex: targetIndex,
    });

    this.resetDragState();
  }

  onDragEnd() {
    this.resetDragState();
  }

  private resetDragState() {
    this.draggedNode.set(null);
    this.dragOverNodeId.set(null);
    this.dropPosition.set(null);
    this.isCurrentDropValid.set(false);
    this.clearAutoExpandTimeout();
  }

  getDragOverClass(nodeId: ExplorerId): string {
    if (this.dragOverNodeId() === nodeId && this.isCurrentDropValid()) {
      const position = this.dropPosition();
      return position ? `drag-over-${position}` : '';
    }
    return '';
  }

  getRowCursorStyle(): string {
    const draggedNode = this.draggedNode();
    if (!draggedNode) {
      return 'default';
    }
    // When dragging, show 'no-drop' cursor by default
    return 'no-drop';
  }

  getRowCursorStyleForNode(nodeId: ExplorerId, isDraggable: boolean): string {
    const draggedNode = this.draggedNode();

    // Not in a drag operation
    if (!draggedNode) {
      return isDraggable ? 'grab' : 'default';
    }

    // This is the node being dragged
    if (draggedNode.id === nodeId) {
      return 'grabbing';
    }

    // During drag, show cursor based on drop validity
    if (this.dragOverNodeId() === nodeId && this.isCurrentDropValid()) {
      return 'move';
    }

    return 'no-drop';
  }

  private clearAutoExpandTimeout() {
    if (this.autoExpandTimeoutHandle !== null) {
      window.clearTimeout(this.autoExpandTimeoutHandle);
      this.autoExpandTimeoutHandle = null;
    }
  }

  // ---------------- Tree building ----------------
  private buildTreeFromFlatData(items: TItem[]): ExplorerNode<TItem>[] {
    let nodeById = new Map<ExplorerId, ExplorerNode<TItem>>();
    let parentById = new Map<ExplorerId, ExplorerId | null>();
    let sortKeyById = new Map<ExplorerId, number | string | undefined>();

    for (let item of items) {
      let id = String(item.id);
      let parentId = item.parent == null ? null : String(item.parent);
      let sortKey = (item as any).sortKey;
      let isDraggable = (item as any).isDraggable;

      nodeById.set(id, {
        id: id,
        item,
        templateKey: item.type,
        children: [],
        isDraggable: isDraggable !== false,
      });

      parentById.set(id, parentId);
      sortKeyById.set(id, sortKey);
    }

    let rootNodes: ExplorerNode<TItem>[] = [];

    for (let [id, node] of nodeById.entries()) {
      let parentId = parentById.get(id) ?? null;

      if (!parentId) {
        rootNodes.push(node);
      }
      else {
        let parentNode = nodeById.get(parentId);

        if (parentNode) {
          parentNode.children.push(node);
        }
        else {
          rootNodes.push(node);
        }
      }
    }

    let sortRecursively = (nodes: ExplorerNode<TItem>[]) => {
      nodes.sort((left, right) => {
        let leftSortKey = sortKeyById.get(left.id);
        let rightSortKey = sortKeyById.get(right.id);

        if (leftSortKey == null && rightSortKey == null) {
          return left.id.localeCompare(right.id);
        }

        if (leftSortKey == null) {
          return 1;
        }

        if (rightSortKey == null) {
          return -1;
        }

        if (typeof leftSortKey === 'number' && typeof rightSortKey === 'number') {
          return leftSortKey - rightSortKey;
        }

        return String(leftSortKey).localeCompare(String(rightSortKey));
      });

      for (let node of nodes) {
        sortRecursively(node.children);
      }
    };

    sortRecursively(rootNodes);
    return rootNodes;
  }

  // ---------------- Tree utilities ----------------
  private findNodeById(nodes: ExplorerNode<TItem>[], nodeId: ExplorerId): ExplorerNode<TItem> | null {
    let stack: ExplorerNode<TItem>[] = [...nodes];

    while (stack.length) {
      let node = stack.pop()!;

      if (node.id === nodeId) {
        return node;
      }

      for (let child of node.children) {
        stack.push(child);
      }
    }

    return null;
  }

  private findParentNodeByChildId(
    nodes: ExplorerNode<TItem>[],
    childId: ExplorerId
  ): ExplorerNode<TItem> | null {
    let stack: ExplorerNode<TItem>[] = [...nodes];

    while (stack.length) {
      let node = stack.pop()!;

      for (let child of node.children) {
        if (child.id === childId) {
          return node;
        }

        stack.push(child);
      }
    }

    return null;
  }

  private isIdInSubtree(rootNode: ExplorerNode<TItem>, maybeDescendantId: ExplorerId): boolean {
    let stack: ExplorerNode<TItem>[] = [...rootNode.children];

    while (stack.length) {
      let node = stack.pop()!;

      if (node.id === maybeDescendantId) {
        return true;
      }

      for (let child of node.children) {
        stack.push(child);
      }
    }

    return false;
  }
}
