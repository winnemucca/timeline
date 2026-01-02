import { WorkOrderDocument } from '../models/work-order.dto';
import { WorkOrder } from '../models/work-order.model';

export function mapDocumentToWorkOrder(doc: WorkOrderDocument): WorkOrder {
  return {
    docId: doc.docId,
    name: doc.data.name,
    workCenterId: doc.data.workCenterId,
    status: doc.data.status,
    startDate: new Date(doc.data.startDate),
    endDate: new Date(doc.data.endDate),
  };
}

// in case i have to map back
export function mapWorkOrderToDocument(wo: WorkOrder): WorkOrderDocument {
  return {
    docId: wo.docId,
    docType: 'workOrder',
    data: {
      name: wo.name,
      workCenterId: wo.workCenterId,
      status: wo.status,
      startDate: wo.startDate.toISOString(),
      endDate: wo.endDate.toISOString(),
    },
  };
}
