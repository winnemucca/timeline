export type WorkOrderStatus = 'open' | 'planned' | 'in-progress' | 'complete' | 'blocked';

export interface WorkOrder {
  docId: string;
  name: string;
  workCenterId: string;
  status: WorkOrderStatus;
  startDate: Date;
  endDate: Date;
}

export interface WorkOrderFormValue {
  name: string;
  status: WorkOrderStatus;
  startDate: Date;
  endDate: Date;
}
