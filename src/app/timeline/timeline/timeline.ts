import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Schedule } from '../../services/schedule';
import { WorkOrder, WorkOrderFormValue } from '../../models/work-order.model';
import { TIMESCALE_CONFIG } from '../../models/timescale.config';
import { Timescale } from '../../models/timescale-model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
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
  /* ---------------- DI ---------------- */

  readonly schedule = inject(Schedule);

  /* ---------------- CONSTANTS ---------------- */

  readonly leftColumnWidth = 220;
  readonly laneHeight = 40;

  /* ---------------- DATE RANGE ---------------- */

  private readonly today = this.startOfDay(new Date());
  readonly rangeStart = this.addDays(this.today, -14);
  readonly rangeEnd = this.addDays(this.today, 14);

  // timeline.ts
  editingOrder: WorkOrder | null = null;
  panelMode: 'create' | 'edit' | null = null;
  panelWorkCenterId: string | null = null;

  readonly timescaleControl = new FormControl<Timescale>('day', {
    nonNullable: true,
  });

  get timescale(): Timescale {
    return this.timescaleControl.value;
  }

  get scale() {
    return TIMESCALE_CONFIG[this.timescale];
  }

  get unitMs() {
    return this.scale.unitMs;
  }

  get pxPerUnit() {
    return this.scale.pxPerUnit;
  }

  /* ---------------- GRID UNITS ---------------- */

  readonly units = computed(() => {
    const units: Date[] = [];
    let current = new Date(this.rangeStart);

    while (current <= this.rangeEnd) {
      units.push(new Date(current));
      current = new Date(current.getTime() + this.unitMs);
    }

    return units;
  });

  /* ---------------- MONTH HEADER ---------------- */

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

  /* ---------------- TODAY INDICATOR ---------------- */

  readonly todayOffsetPx = computed(() => {
    if (this.today < this.rangeStart || this.today > this.rangeEnd) return null;
    return this.diffInUnits(this.rangeStart, this.today) * this.pxPerUnit;
  });

  /* ---------------- POSITIONED WORK ORDERS ---------------- */

  positionedOrdersFor(workCenterId: string) {
    return computed(() => this.computePositionedOrders(workCenterId));
  }

  openEditPanel(order: WorkOrder) {
    this.editingOrder = order;
    this.panelWorkCenterId = order.workCenterId;
    this.panelMode = 'edit';
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

  /* ---------------- BAR POSITIONING ---------------- */

  getBarStyle(pwo: PositionedWorkOrder) {
    const left = this.diffInUnits(this.rangeStart, pwo.order.startDate) * this.pxPerUnit;

    const width = (this.diffInUnits(pwo.order.startDate, pwo.order.endDate) + 1) * this.pxPerUnit;

    return {
      left: `${left}px`,
      width: `${width}px`,
      top: `${pwo.lane * this.laneHeight + 8}px`,
    };
  }

  activeMenuOrderId: string | null = null;

  openMenu(orderId: string) {
    this.activeMenuOrderId = orderId;
  }

  closeMenu() {
    this.activeMenuOrderId = null;
  }

  // onEdit(order: WorkOrder) {
  //   this.closeMenu();
  //   // will open panel in step 5
  // }

  onCreate(form: WorkOrderFormValue, workCenterId: string) {
    this.schedule.createWorkOrder(form, workCenterId);
  }

  onEdit(form: WorkOrderFormValue, existing: WorkOrder) {
    this.schedule.updateWorkOrder(existing.docId, form);
  }

  onDelete(order: WorkOrder) {
    this.schedule.deleteWorkOrder(order.docId);
    this.closeMenu();
  }

  /* ---------------- HELPERS ---------------- */

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

  private diffInUnits(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / this.unitMs);
  }
}
