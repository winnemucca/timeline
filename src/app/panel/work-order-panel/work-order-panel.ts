import { Component, input, output, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

import { WorkOrder, WorkOrderStatus, WorkOrderFormValue } from '../../models/work-order.model';

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  templateUrl: './work-order-panel.html',
  styleUrl: './work-order-panel.scss',
})
export class WorkOrderPanel {
  /* ---------------- INPUT SIGNALS ---------------- */

  readonly mode = input<'create' | 'edit'>();
  readonly order = input<WorkOrder | null>(null);

  /* ---------------- OUTPUTS ---------------- */

  readonly save = output<WorkOrderFormValue>();
  readonly cancel = output<void>();

  /* ---------------- FORM ---------------- */

  readonly form: FormGroup;

  readonly statusOptions: { label: string; value: WorkOrderStatus }[] = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Complete', value: 'complete' },
    { label: 'Blocked', value: 'blocked' },
  ];

  readonly title = computed(() =>
    this.mode() === 'create' ? 'Create Work Order' : 'Work Order Details',
  );

  readonly submitLabel = computed(() => (this.mode() === 'create' ? 'Create' : 'Save'));

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      status: ['open', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
    });

    /* Populate form on edit */
    effect(() => {
      const order = this.order();
      if (!order) return;

      this.form.reset({
        name: order.name,
        status: order.status,
        startDate: this.toDateStruct(order.startDate),
        endDate: this.toDateStruct(order.endDate),
      });
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    const raw = this.form.value;

    const value: WorkOrderFormValue = {
      name: raw.name,
      status: raw.status,
      startDate: this.fromDateStruct(raw.startDate),
      endDate: this.fromDateStruct(raw.endDate),
    };

    this.save.emit(value);
  }

  onCancel() {
    this.cancel.emit();
  }

  /* ---------------- DATE HELPERS ---------------- */

  private toDateStruct(date: Date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  private fromDateStruct(d: { year: number; month: number; day: number }): Date {
    return new Date(d.year, d.month - 1, d.day);
  }
}
