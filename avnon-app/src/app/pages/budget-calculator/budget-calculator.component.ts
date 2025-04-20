import { Component, ViewChild } from '@angular/core';
import { BudgetHeaderComponent } from '../../features/budget-header/budget-header.component';
import { ExelFileBudgetComponent } from '../../features/exel-file-budget/exel-file-budget.component';
import { DateRangeOutput } from '../../model/date.model';

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
    if (this.exelFileBudget) {
      this.exelFileBudget.onDateRangeChanged(dateRange);
    }
  }
}
