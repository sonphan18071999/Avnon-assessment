import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

interface DateRangeOutput {
  startDate: Date;
  endDate: Date;
  startMonth: string;
  endMonth: string;
}

@Component({
  selector: 'app-budget-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  templateUrl: './budget-header.component.html',
  styleUrl: './budget-header.component.scss',
})
export class BudgetHeaderComponent implements OnInit {
  @Output() dateRangeChanged = new EventEmitter<DateRangeOutput>();
  @Output() exportBudget = new EventEmitter<DateRangeOutput>();

  public allMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  public selectedStartMonth: string = this.allMonths[1];
  public selectedEndMonth: string = this.allMonths[2];
  public displayedMonths: string[] = [];
  public months: string[] = [];

  ngOnInit(): void {
    this.dateRange.valueChanges.subscribe(() => {
      this.applyDateFilter();
    });

    this.applyDateFilter();
  }

  dateRange = new FormGroup(
    {
      start: new FormControl<Date | null>(
        new Date(new Date().getFullYear(), 0, 1),
        [Validators.required]
      ),
      end: new FormControl<Date | null>(
        new Date(new Date().getFullYear(), 11, 1),
        [Validators.required]
      ),
    },
    { validators: this.dateRangeValidator }
  );

  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('start')?.value;
    const end = group.get('end')?.value;

    if (start && end) {
      return start <= end ? null : { invalidDateRange: true };
    }
    return null;
  }

  applyDateFilter(): void {
    const startDate = this.dateRange.get('start')?.value;
    const endDate = this.dateRange.get('end')?.value;

    if (startDate && endDate) {
      const startMonth = this.allMonths[startDate.getMonth()];
      const endMonth = this.allMonths[endDate.getMonth()];

      this.selectedStartMonth = startMonth;
      this.selectedEndMonth = endMonth;
      this.applyMonthFilter();

      this.dateRangeChanged.emit({
        startDate,
        endDate,
        startMonth,
        endMonth,
      });
    }
  }

  applyMonthFilter(): void {
    const startIndex = this.allMonths.indexOf(this.selectedStartMonth);
    const endIndex = this.allMonths.indexOf(this.selectedEndMonth);

    if (startIndex > -1 && endIndex > -1) {
      if (startIndex <= endIndex) {
        this.displayedMonths = this.allMonths.slice(startIndex, endIndex + 1);
      } else {
        this.displayedMonths = [
          ...this.allMonths.slice(startIndex),
          ...this.allMonths.slice(0, endIndex + 1),
        ];
      }
    } else {
      this.displayedMonths = [...this.allMonths];
    }

    this.months = this.displayedMonths;
  }

  setMonthAndClose(
    date: Date,
    datepicker: any,
    controlName: 'start' | 'end'
  ): void {
    const selectedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    this.dateRange.controls[controlName].setValue(selectedMonth);
    datepicker.close();
  }

  onSubmit(): void {
    if (this.dateRange.valid) {
      const startDate = this.dateRange.get('start')?.value;
      const endDate = this.dateRange.get('end')?.value;

      if (startDate && endDate) {
        const exportData: DateRangeOutput = {
          startDate,
          endDate,
          startMonth: this.allMonths[startDate.getMonth()],
          endMonth: this.allMonths[endDate.getMonth()],
        };

        this.exportBudget.emit(exportData);
      }
    }
  }

  hasDateRangeError(): boolean {
    return this.dateRange.errors?.['invalidDateRange'] === true;
  }
}
