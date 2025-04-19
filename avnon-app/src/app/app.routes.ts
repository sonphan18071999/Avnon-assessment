import { Routes } from '@angular/router';
import { ExelFileBudgetComponent } from './features/exel-file-budget/exel-file-budget.component';
import { BudgetCalculatorComponent } from './pages/budget-calculator/budget-calculator.component';

export const routes: Routes = [
  {
    path: 'budget-calculator',
    component: BudgetCalculatorComponent,
  },
  {
    path: '',
    redirectTo: 'budget-calculator',
    pathMatch: 'full',
  },
];
