import { nf } from '../generated/proto_bundle.js';

export class TargetListManager {
    private selectedId: string | null = null;
    private hoveredId: string | null = null;
    
    // Callbacks for external components
    public onTargetSelect: ((id: string | null) => void) | null = null;
    public onTargetHover: ((id: string | null) => void) | null = null;
    public sendFn: ((items: Array<nf.control.ControlItem>) => void) | null = null

    constructor() {
        // Setup background click handler for the list container to clear selection
        // We wait for DOM to be ready or check purely on click events if container exists
        const container = document.getElementById('target-list');
        if (container) {
            container.parentElement?.addEventListener('click', (e) => {
                // If the click target is the container itself or the panel (not a task-item)
                const target = e.target as HTMLElement;
                if (!target.closest('.task-item')) {
                    this.setSelectedId(null);
                }
            });
            // Also handle mouse leave on the container to clear hover
            container.addEventListener('mouseleave', () => {
                this.setHoveredId(null);
            });
        }
    }

    // --- State Management ---

    public setSelectedId(id: string | null) {
        if (this.selectedId !== id) {
            this.selectedId = id;
            this.refreshStyles();
            if (this.onTargetSelect) this.onTargetSelect(id);
        }
    }

    public getSelectedId(): string | null {
        return this.selectedId;
    }

    public setHoveredId(id: string | null) {
        if (this.hoveredId !== id) {
            this.hoveredId = id;
            this.refreshStyles();
            if (this.onTargetHover) this.onTargetHover(id);
        }
    }

    public getHoveredId(): string | null {
        return this.hoveredId;
    }

    // --- DOM Updates ---

    public updateList(targets: nf.telemetry.IOneTarget[]) {

        const container = document.getElementById('target-list');
        if (!container) return;
        
        container.innerHTML = '';

        targets.forEach(target => {
            const div = document.createElement('div');
            div.className = 'task-item';
            
            const tid = target.id ?? '';
            div.dataset.id = tid;

            // Map Proto Status to CSS Class
            switch (target.status) {
                case nf.telemetry.TargetStatus.TARGETSTATUS_SELECTED:
                    div.classList.add('status-selected');
                    break;
                case nf.telemetry.TargetStatus.TARGETSTATUS_PICKED_UP:
                    div.classList.add('status-picked-up');
                    break;
                case nf.telemetry.TargetStatus.TARGETSTATUS_SEEN:
                default:
                    div.classList.add('status-seen');
                    break;
            }

            // Info Span (Left side)
            const infoSpan = document.createElement('span');
            infoSpan.className = 'task-text-span';
            const rawId = tid;
            const name = rawId.substring(0, 8);
            const source = target.source ?? '';
            const coords = this.formatPos(target.position);
            infoSpan.textContent = `(${source}) ${name} ${coords}`;
            div.appendChild(infoSpan);

            // Delete Button (right side)
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✗';
            deleteBtn.className = 'task-delete';
            div.appendChild(deleteBtn);

            // Initial Style check
            this.applyStylesToElement(div, tid);

            // --- Interaction Handlers ---
            
            // Click handler for delete
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop bubbling so we don't re-select or deselect immediately
                if (this.sendFn) {
                    const item = nf.control.ControlItem.create({
                        deleteTarget: {
                            targetId: tid
                        }
                    })
                    this.sendFn([item]);
                }
            });

            // Selection (Click)
            div.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent container from clearing selection
                this.setSelectedId(tid);
            });

            // Hover (Mouse Enter)
            div.addEventListener('mouseenter', () => {
                this.setHoveredId(tid);
            });

            // Note: We handle mouseleave on the parent container to clear hover
            // to prevent flickering when moving between items.

            container.appendChild(div);
        });
    }

    public deleteSelectedItem() {
        if (this.selectedId && this.sendFn) {
            const item = nf.control.ControlItem.create({
                deleteTarget: {
                    targetId: this.selectedId
                }
            })
            this.sendFn([item]);
        }
    }

    private refreshStyles() {
        const container = document.getElementById('target-list');
        if (!container) return;

        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            const div = children[i] as HTMLElement;
            const tid = div.dataset.id;
            if (tid) {
                this.applyStylesToElement(div, tid);
            }
        }
    }

    private applyStylesToElement(div: HTMLElement, tid: string) {
        const isSelected = (tid === this.selectedId);
        const isHovered = (tid === this.hoveredId);
        const deleteBtn = div.querySelector('.task-delete') as HTMLElement;

        // Apply 'target-mouse-selected' (orange background) if selected
        if (isSelected) {
            div.classList.add('target-mouse-selected');
        } else {
            div.classList.remove('target-mouse-selected');
        }

        // isHovered
        if (isHovered) {
            div.classList.add('target-mouse-hovered');
        } else {
            div.classList.remove('target-mouse-hovered');
        }

        if (isSelected || isHovered) {
            if (deleteBtn) deleteBtn.style.display = 'block';
        } else {
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    }

    private formatPos(pos: nf.common.IVec3 | null | undefined): string {
        if (!pos) return '';
        const x = (pos.x ?? 0).toFixed(2);
        const y = (pos.y ?? 0).toFixed(2);
        return `(${x}, ${y})`;
    }
}