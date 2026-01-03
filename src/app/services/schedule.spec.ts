// import { TestBed } from '@angular/core/testing';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Schedule } from './schedule';
import { WorkOrderFormValue } from '../models/work-order.model';

// not using testbed here since this has no apis and everything is hard coded
vi.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('Schedule', () => {
  let schedule: Schedule;

  beforeEach(() => {
    schedule = new Schedule();
  });

  it('should expose initial work centers', () => {
    const centers = schedule.workCenters();

    expect(centers.length).toBeGreaterThanOrEqual(5);
    expect(centers[0].name).toBe('Extrusion Line A');
  });

  it('should map documents into work orders', () => {
    const orders = schedule.workOrders();

    expect(orders.length).toBe(8);
    expect(orders[0].startDate).toBeInstanceOf(Date);
    expect(orders[0].endDate).toBeInstanceOf(Date);
  });

  it('should create a new work order', () => {
    const form: WorkOrderFormValue = {
      name: 'New Order',
      status: 'open',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-05'),
    };

    schedule.createWorkOrder(form, 'wc-1');

    const orders = schedule.workOrders();
    const created = orders.find((o) => o.docId === 'test-uuid');

    expect(created).toBeDefined();
    expect(created?.name).toBe('New Order');
    expect(created?.workCenterId).toBe('wc-1');
  });

  it('should update an existing work order', () => {
    schedule.updateWorkOrder('wo-1', {
      name: 'Updated Order',
      status: 'complete',
      startDate: new Date('2025-12-21'),
      endDate: new Date('2025-12-27'),
    });

    const updated = schedule.workOrders().find((o) => o.docId === 'wo-1');

    expect(updated?.name).toBe('Updated Order');
    expect(updated?.status).toBe('complete');
  });

  it('should delete a work order', () => {
    schedule.deleteWorkOrder('wo-1');

    const orders = schedule.workOrders();
    expect(orders.find((o) => o.docId === 'wo-1')).toBeUndefined();
  });

  it('should detect overlapping work orders in the same work center', () => {
    const hasOverlap = schedule.hasOverlap('wc-1', new Date('2025-12-24'), new Date('2025-12-29'));

    expect(hasOverlap).toBe(true);
  });

  it('should ignore overlap for the same order when editing', () => {
    const hasOverlap = schedule.hasOverlap(
      'wc-1',
      new Date('2025-12-20'),
      new Date('2025-12-26'),
      'wo-1',
    );

    expect(hasOverlap).toBe(false);
  });
});
