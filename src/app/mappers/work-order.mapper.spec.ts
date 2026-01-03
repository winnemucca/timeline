import { mapDocumentToWorkOrder } from './work-order.mapper';
import { WorkOrderDocument } from '../models/work-order.dto';


describe('mapDocumentToWorkOrder', () => {
  it('maps dates correctly', () => {

    const doc: WorkOrderDocument = {
      docId: 'wo-1',
      docType: 'workOrder',
      data: {
        name: 'Order A',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-12-20',
        endDate: '2025-12-26',
      },
    };

    const result = mapDocumentToWorkOrder(doc);

    expect(result.startDate).toBeInstanceOf(Date);
  });
});
