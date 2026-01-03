import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkOrderPanel } from './work-order-panel';

import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngb-datepicker',
  standalone: true,
  template: '',
})
export class NgbDatepickerStub { // trying to work around localize issue by mocking datepicker
  @Input() startDate: any;
}

describe('WorkOrderPanel', () => {
  let fixture: ComponentFixture<WorkOrderPanel>;
  let component: WorkOrderPanel;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkOrderPanel, NgbDatepickerStub],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
