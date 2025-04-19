import { Component, ViewChild } from '@angular/core';
import { BudgetHeaderComponent } from '../../features/budget-header/budget-header.component';
import { ExelFileBudgetComponent } from '../../features/exel-file-budget/exel-file-budget.component';

// Define the DateRangeOutput interface
interface DateRangeOutput {
  startDate: Date;
  endDate: Date;
  startMonth: string;
  endMonth: string;
}

@Component({
  selector: 'app-budget-calculator',
  standalone: true,
  imports: [BudgetHeaderComponent, ExelFileBudgetComponent],
  templateUrl: './budget-calculator.component.html',
  styleUrl: './budget-calculator.component.scss',
})
export class BudgetCalculatorComponent {
  @ViewChild(ExelFileBudgetComponent) exelFileBudget!: ExelFileBudgetComponent;

  onDateRangeChanged(dateRange: DateRangeOutput): void {
    // If the exel-file-budget component is initialized, call its method
    if (this.exelFileBudget) {
      this.exelFileBudget.onDateRangeChanged(dateRange);
    }
  }
}
