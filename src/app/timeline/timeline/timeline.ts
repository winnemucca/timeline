import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

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
})
export class Timeline {
  /* ================= DI ================= */

  readonly schedule = inject(Schedule);

  /* ================= CONSTANTS ================= */

  readonly leftColumnWidth = 220;
  readonly laneHeight = 40;

  /* ================= TIMESCALE ================= */

  readonly timescaleControl = new FormControl<Timescale>('day', {
    nonNullable: true,
  });

  // readonly timescale = computed<Timescale>(() => this.timescaleControl.value);
  readonly timescale = signal<Timescale>(this.timescaleControl.value);

  readonly scale = computed(() => TIMESCALE_CONFIG[this.timescale()]);

  constructor() {
    this.timescaleControl.valueChanges.subscribe((value) => {
      if (value) {
        this.timescale.set(value);
      }
    });
  }

  get pxPerUnit(): number {
    return this.scale().pxPerUnit;
  }

  /* ================= DATE RANGE ================= */

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

  /* ================= GRID UNITS ================= */

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

  /* ================= MONTH HEADER ================= */

  readonly months = computed(() =>
    this.units().reduce<{ label: string; span: number }[]>((acc, unit) => {
      const label = unit.toLocaleDateString('en-US', {
        month: 'long',
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

  /* ================= TODAY INDICATOR ================= */

  readonly todayOffsetPx = computed(() => {
    const units = this.units();
    if (!units.length) return null;

    const start = units[0];
    const end = units[units.length - 1];

    if (this.today < start || this.today > end) return null;

    return this.diffInUnits(start, this.today) * this.pxPerUnit;
  });

  /* ================= POSITIONING ================= */

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

  /* ================= MENU ================= */

  activeMenuOrderId: string | null = null;

  toggleMenu(orderId: string) {
    this.activeMenuOrderId = this.activeMenuOrderId === orderId ? null : orderId;
  }

  /* ================= PANEL ================= */

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

  onPanelSave(form: WorkOrderFormValue) {
    if (this.panelMode === 'create' && this.panelWorkCenterId) {
      this.schedule.createWorkOrder(form, this.panelWorkCenterId);
    }

    if (this.panelMode === 'edit' && this.editingOrder) {
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

  /* ================= HELPERS ================= */

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
