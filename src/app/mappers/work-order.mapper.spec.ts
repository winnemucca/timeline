import { mapDocumentToWorkOrder } from './work-order.mapper';
describe('mapDocumentToWorkOrder', () => {
  it('maps dates correctly', () => {
    const doc = {
      docId: '1',
      docType: 'workOrder',
      data: {
        name: 'Test',
        workCenterId: 'wc-1',
        status: 'planned',
        startDate: '2025-01-01',
        endDate: '2025-01-05',
      },
    };

    const result = mapDocumentToWorkOrder(doc);

    expect(result.startDate).toBeInstanceOf(Date);
  });
});
