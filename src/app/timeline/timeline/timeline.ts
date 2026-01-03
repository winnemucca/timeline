import { Component, inject, computed, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { effect } from '@angular/core';

import { Schedule } from '../../services/schedule';
import { WorkOrder, WorkOrderFormValue } from '../../models/work-order.model';
import { TIMESCALE_CONFIG } from '../../models/timescale.config';
import { Timescale } from '../../models/timescale-model';
import { WorkOrderPanel } from '../../panel/work-order-panel/work-order-panel';

interface PositionedWorkOrder {
  order: WorkOrder;
  lane: number;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, WorkOrderPanel],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Timeline {
  @ViewChild('rightColumn', { static: true })
  rightColumn!: ElementRef<HTMLDivElement>;

  readonly schedule = inject(Schedule);

  readonly leftColumnWidth = 220;
  readonly laneHeight = 40;

  readonly timescaleControl = new FormControl<Timescale>('day', {
    nonNullable: true,
  });

  readonly timescale = signal<Timescale>(this.timescaleControl.value);

  readonly scale = computed(() => TIMESCALE_CONFIG[this.timescale()]);

  constructor() {
    this.timescaleControl.valueChanges.subscribe((value) => {
      if (value) {
        this.timescale.set(value);
      }
    });

    effect(() => {
      // dependencies
      this.timescale();
      this.units();
      this.todayOffsetPx();

      requestAnimationFrame(() => {
        this.centerOnToday();
      });
    });
  }

  get pxPerUnit(): number {
    return this.scale().pxPerUnit;
  }

  private readonly today = this.startOfDay(new Date());

  readonly range = computed(() => {
    switch (this.timescale()) {
      case 'day':
        return {
          start: this.addDays(this.today, -14),
          end: this.addDays(this.today, 14),
        };

      case 'week':
        return {
          start: this.addDays(this.today, -56), // 8 weeks
          end: this.addDays(this.today, 56),
        };

      case 'month':
        return {
          start: this.addMonths(this.today, -6),
          end: this.addMonths(this.today, 6),
        };
    }
  });

  readonly units = computed(() => {
    const { start, end } = this.range();
    const units: Date[] = [];

    let current = new Date(start);

    while (current <= end) {
      units.push(new Date(current));

      switch (this.timescale()) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;

        case 'week':
          current.setDate(current.getDate() + 7);
          break;

        case 'month':
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
          break;
      }
    }

    return units;
  });

  readonly months = computed(() =>
    this.units().reduce<{ label: string; span: number }[]>((acc, unit) => {
      const label = unit.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      const last = acc.at(-1);
      if (!last || last.label !== label) {
        acc.push({ label, span: 1 });
      } else {
        last.span++;
      }

      return acc;
    }, []),
  );

  readonly todayOffsetPx = computed(() => {
    const units = this.units();
    if (!units.length) return null;

    const start = units[0];
    const end = units[units.length - 1];

    if (this.today < start || this.today > end) return null;

    return this.diffInUnits(start, this.today) * this.pxPerUnit;
  });

  positionedOrdersFor(workCenterId: string) {
    return computed(() => this.computePositionedOrders(workCenterId));
  }

  private computePositionedOrders(workCenterId: string): PositionedWorkOrder[] {
    const orders = this.schedule
      .workOrders()
      .filter((o) => o.workCenterId === workCenterId)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const lanes: WorkOrder[][] = [];

    for (const order of orders) {
      const laneIndex = lanes.findIndex((lane) =>
        lane.every((existing) => !this.overlaps(order, existing)),
      );

      if (laneIndex === -1) {
        lanes.push([order]);
      } else {
        lanes[laneIndex].push(order);
      }
    }

    return lanes.flatMap((lane, laneIndex) => lane.map((order) => ({ order, lane: laneIndex })));
  }

  getRowHeight(workCenterId: string): number {
    const positioned = this.computePositionedOrders(workCenterId);
    const maxLane = Math.max(0, ...positioned.map((p) => p.lane));
    return (maxLane + 1) * this.laneHeight + 16;
  }

  getBarStyle(pwo: PositionedWorkOrder) {
    const units = this.units();
    if (!units.length) return {};

    const timelineStart = units[0];

    const left = this.diffInUnits(timelineStart, pwo.order.startDate) * this.pxPerUnit;

    const width = (this.diffInUnits(pwo.order.startDate, pwo.order.endDate) + 1) * this.pxPerUnit;

    return {
      left: `${left}px`,
      width: `${width}px`,
      top: `${pwo.lane * this.laneHeight + 8}px`,
    };
  }

  activeMenuOrderId: string | null = null;

  toggleMenu(orderId: string) {
    this.activeMenuOrderId = this.activeMenuOrderId === orderId ? null : orderId;
  }

  editingOrder: WorkOrder | null = null;
  panelMode: 'create' | 'edit' | null = null;
  panelWorkCenterId: string | null = null;

  openCreatePanel(workCenterId: string) {
    this.editingOrder = null;
    this.panelWorkCenterId = workCenterId;
    this.panelMode = 'create';
    this.activeMenuOrderId = null;
  }

  openEditPanel(order: WorkOrder) {
    this.editingOrder = order;
    this.panelWorkCenterId = order.workCenterId;
    this.panelMode = 'edit';
    this.activeMenuOrderId = null;
  }

  onEmptyRowClick(workCenterId: string, event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.closest('.work-order-bar')) return;
    if (target.closest('.dropdown-menu')) return;
    if (target.closest('.dropdown-toggle')) return;

    this.openCreatePanel(workCenterId);
  }

  onPanelSave(form: WorkOrderFormValue) {
    // CREATE
    if (this.panelMode === 'create' && this.panelWorkCenterId) {
      const hasConflict = this.schedule.hasOverlap(
        this.panelWorkCenterId,
        form.startDate,
        form.endDate,
      );

      if (hasConflict) {
        alert('This work order overlaps another one in the same work center.');
        return;
      }

      this.schedule.createWorkOrder(form, this.panelWorkCenterId);
    }

    // EDIT
    if (this.panelMode === 'edit' && this.editingOrder) {
      const hasConflict = this.schedule.hasOverlap(
        this.editingOrder.workCenterId,
        form.startDate,
        form.endDate,
        this.editingOrder.docId,
      );

      if (hasConflict) {
        alert('This work order overlaps another one in the same work center.');
        return;
      }

      this.schedule.updateWorkOrder(this.editingOrder.docId, form);
    }

    this.closePanel();
  }

  closePanel() {
    this.panelMode = null;
    this.editingOrder = null;
    this.panelWorkCenterId = null;
  }

  onDelete(order: WorkOrder) {
    this.schedule.deleteWorkOrder(order.docId);
    this.activeMenuOrderId = null;
  }

  onEscape() {
    if (this.panelMode) {
      this.closePanel();
    }
  }

  /* HELPERS  */

  private centerOnToday() {
    const todayPx = this.todayOffsetPx();
    if (todayPx === null) return;

    const container = this.rightColumn.nativeElement;
    const containerWidth = container.clientWidth;

    // center today in viewport
    const targetScrollLeft = todayPx - containerWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });
  }

  private overlaps(a: WorkOrder, b: WorkOrder): boolean {
    return (
      a.startDate.getTime() <= b.endDate.getTime() && b.startDate.getTime() <= a.endDate.getTime()
    );
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private addMonths(d: Date, months: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  }

  private diffInUnits(a: Date, b: Date): number {
    switch (this.timescale()) {
      case 'day':
        return Math.floor((b.getTime() - a.getTime()) / 86400000);

      case 'week':
        return Math.floor((b.getTime() - a.getTime()) / (86400000 * 7));

      case 'month':
        return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    }
  }
}
