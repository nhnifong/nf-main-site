import { nf } from '../generated/proto_bundle.js';

export class TargetListManager {
    private selectedId: string | null = null;
    private hoveredId: string | null = null;
    
    // Callbacks for external components
    public onTargetSelect: ((id: string | null) => void) | null = null;
    public onTargetHover: ((id: string | null) => void) | null = null;

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

            // Initial Style check
            this.applyStylesToElement(div, tid);

            // Text Content
            const rawId = tid;
            const name = rawId.substring(0, 8);
            const source = target.source ?? '';
            const coords = this.formatPos(target.position);
            div.textContent = `(${source}) ${name} ${coords}`;

            // --- Interaction Handlers ---
            
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
    }

    private formatPos(pos: nf.common.IVec3 | null | undefined): string {
        if (!pos) return '';
        const x = (pos.x ?? 0).toFixed(2);
        const y = (pos.y ?? 0).toFixed(2);
        return `(${x}, ${y})`;
    }
}