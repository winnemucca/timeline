import { Injectable, signal, computed } from '@angular/core';
import { WorkCenter } from '../models/work-center.model';
import { WorkOrder, WorkOrderFormValue } from '../models/work-order.model';
import { WorkOrderDocument } from '../models/work-order.dto';
import { mapDocumentToWorkOrder, mapWorkOrderToDocument } from '../mappers/work-order.mapper';
import { v4 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class Schedule {
  private readonly workOrderDocuments = signal<WorkOrderDocument[]>([
    {
      docId: 'wo-1',
      docType: 'workOrder',
      data: {
        name: 'Order A',
        workCenterId: 'wc-1',
        status: 'in-progress',
        startDate: '2025-12-20',
        endDate: '2025-12-26',
      },
    },
    {
      docId: 'wo-2',
      docType: 'workOrder',
      data: {
        name: 'Order B',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-12-28',
        endDate: '2026-01-02',
      },
    },
    {
      docId: 'wo-3',
      docType: 'workOrder',
      data: {
        name: 'Order C',
        workCenterId: 'wc-2',
        status: 'blocked',
        startDate: '2025-12-22',
        endDate: '2025-12-30',
      },
    },
    {
      docId: 'wo-4',
      docType: 'workOrder',
      data: {
        name: 'Order D',
        workCenterId: 'wc-2',
        status: 'complete',
        startDate: '2026-01-02',
        endDate: '2026-01-06',
      },
    },
    {
      docId: 'wo-5',
      docType: 'workOrder',
      data: {
        name: 'Order E',
        workCenterId: 'wc-3',
        status: 'open',
        startDate: '2025-12-10',
        endDate: '2025-12-15',
      },
    },
    {
      docId: 'wo-6',
      docType: 'workOrder',
      data: {
        name: 'Order F',
        workCenterId: 'wc-4',
        status: 'in-progress',
        startDate: '2025-12-18',
        endDate: '2025-12-22',
      },
    },
    {
      docId: 'wo-7',
      docType: 'workOrder',
      data: {
        name: 'Order G',
        workCenterId: 'wc-5',
        status: 'complete',
        startDate: '2026-01-05',
        endDate: '2026-01-10',
      },
    },
    {
      docId: 'wo-8',
      docType: 'workOrder',
      data: {
        name: 'Order H',
        workCenterId: 'wc-5',
        status: 'blocked',
        startDate: '2026-01-12',
        endDate: '2026-01-16',
      },
    },
  ]);

  readonly workCenters = signal<WorkCenter[]>([
    { id: 'wc-1', name: 'Extrusion Line A' },
    { id: 'wc-2', name: 'CNC Machine 1' },
    { id: 'wc-3', name: 'Assembly Station' },
    { id: 'wc-4', name: 'Quality Control' },
    { id: 'wc-5', name: 'Packaging Line' },
  ]);

  readonly workOrders = computed<WorkOrder[]>(() =>
    this.workOrderDocuments().map(mapDocumentToWorkOrder),
  );

  createWorkOrder(form: WorkOrderFormValue, workCenterId: string) {
    const order: WorkOrder = {
      docId: uuid(),
      workCenterId,
      name: form.name,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    const document = mapWorkOrderToDocument(order);

    this.workOrderDocuments.update((docs) => [...docs, document]);
  }

  updateWorkOrder(docId: string, form: WorkOrderFormValue) {
    this.workOrderDocuments.update((docs) =>
      docs.map((doc) =>
        doc.docId === docId
          ? {
              ...doc,
              data: {
                ...doc.data,
                name: form.name,
                status: form.status,
                startDate: form.startDate.toISOString().slice(0, 10),
                endDate: form.endDate.toISOString().slice(0, 10),
              },
            }
          : doc,
      ),
    );
  }

  deleteWorkOrder(docId: string) {
    this.workOrderDocuments.update((docs) => docs.filter((d) => d.docId !== docId));
  }

  hasOverlap(workCenterId: string, startDate: Date, endDate: Date, ignoreDocId?: string): boolean {
    return this.workOrders()
      .filter((o) => o.workCenterId === workCenterId)
      .filter((o) => o.docId !== ignoreDocId)
      .some((o) => startDate <= o.endDate && endDate >= o.startDate);
  }
}
