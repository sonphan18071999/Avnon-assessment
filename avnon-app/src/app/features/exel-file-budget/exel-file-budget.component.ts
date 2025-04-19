import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ViewChild,
  Renderer2,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Budget } from '../../model/budget.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { BudgetHeaderComponent } from '../budget-header/budget-header.component';

interface DateRangeOutput {
  startDate: Date;
  endDate: Date;
  startMonth: string;
  endMonth: string;
}

interface ExtendedBudget extends Budget {
  [key: string]: any;
}

@Component({
  selector: 'app-exel-file-budget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
    BudgetHeaderComponent,
  ],
  templateUrl: './exel-file-budget.component.html',
  styleUrl: './exel-file-budget.component.scss',
})
export class ExelFileBudgetComponent implements OnInit, AfterViewInit {
  @ViewChild('budgetTable') budgetTable!: ElementRef;

  months: string[] = [
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

  budgetData: { [month: string]: ExtendedBudget } = {};
  currentCell: { row: number; col: number } | null = null;
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuCellInfo: {
    month: string;
    property: string;
    path: string;
  } | null = null;

  allMonths: string[] = [
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
  selectedStartMonth: string = 'January';
  selectedEndMonth: string = 'December';
  displayedMonths: string[] = [...this.allMonths];

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (this.contextMenuVisible) {
        this.contextMenuVisible = false;
      }
    });
  }

  setMonthAndClose(
    normalizedMonthAndYear: Date,
    datepicker: MatDatepicker<Date>,
    controlName: 'start' | 'end'
  ): void {
    const date = new Date(
      normalizedMonthAndYear.getFullYear(),
      normalizedMonthAndYear.getMonth(),
      1
    );

    if (datepicker) {
      datepicker.close();
    }
  }

  ngOnInit(): void {
    this.allMonths.forEach((month, index) => {
      this.budgetData[month] = {
        generalIncome: {
          sales: 0,
          commission: 0,
          subTotal: 0,
        },
        otherIncome: {
          training: 0,
          consulting: 0,
          subTotal: 0,
        },
        operationalExpenses: {
          managementFees: 0,
          cloudHosting: 0,
          subTotal: 0,
        },
        salariesAndWages: {
          fullTimeDevSalaries: 0,
          partTimeDevSalaries: 0,
          remoteSalaries: 0,
          subTotal: 0,
        },
        totalExpenses: 0,
        profitLoss: 0,
        openingBalance: index === 0 ? 0 : 0,
        closingBalance: 0,
      };
    });

    this.updateAllOpeningBalances();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.currentCell) return;

    const { row, col } = this.currentCell;
    let newRow = row;
    let newCol = col;

    const tableRows =
      this.budgetTable.nativeElement.querySelectorAll('tbody tr');
    const inputRows = Array.from(tableRows as NodeListOf<Element>).filter(
      (tr) => tr.querySelector('input')
    );
    const totalRows = inputRows.length;

    switch (event.key) {
      case 'ArrowUp':
        if (row > 0) {
          newRow = row - 1;
        }
        break;
      case 'ArrowDown':
        if (row < totalRows - 1) {
          newRow = row + 1;
        }
        break;
      case 'ArrowLeft':
        if (col > 0) {
          newCol = col - 1;
        } else if (row > 0) {
          newRow = row - 1;
          newCol = this.months.length - 1;
        }
        break;
      case 'ArrowRight':
        if (col < this.months.length - 1) {
          newCol = col + 1;
        } else if (row < totalRows - 1) {
          newRow = row + 1;
          newCol = 0;
        }
        break;
      default:
        return;
    }

    if (newRow !== row || newCol !== col) {
      this.focusCell(newRow, newCol);
      event.preventDefault();
    }
  }

  focusCell(row: number, col: number): void {
    setTimeout(() => {
      const targetRows =
        this.budgetTable.nativeElement.querySelectorAll('tbody tr');
      const inputRows = Array.from(targetRows as NodeListOf<Element>).filter(
        (tr) => tr.querySelector('input')
      );

      if (row >= 0 && row < inputRows.length && inputRows[row]) {
        const inputs = inputRows[row].querySelectorAll('input');
        if (inputs && inputs.length > col && col >= 0) {
          this.currentCell = { row, col };
          (inputs[col] as HTMLInputElement).focus();
        }
      }
    });
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    if (event.target instanceof HTMLInputElement) {
      event.preventDefault();

      const input = event.target as HTMLInputElement;
      const td = input.closest('td');
      if (!td) return;

      const tr = td.closest('tr');
      const headerRow = this.el.nativeElement.querySelector(
        'table thead tr:first-child'
      );

      if (!tr || !headerRow) return;

      const cellIndex = Array.from(tr.cells).indexOf(td);
      if (cellIndex <= 0) return;

      const monthCell = headerRow.cells[cellIndex];
      if (!monthCell) return;

      const month = monthCell.textContent?.trim() || '';
      if (!month || !this.months.includes(month)) return;

      let property = '';
      let path = '';

      const ngModelAttr = Array.from(input.attributes).find(
        (attr) =>
          attr.name.startsWith('ng-reflect-model') ||
          attr.name.startsWith('[(ngModel)]')
      );

      if (ngModelAttr) {
        path = ngModelAttr.value.replace(`budgetData[${month}].`, '');
      }

      if (path.includes('generalIncome')) {
        if (path.includes('sales')) property = 'generalIncome.sales';
        else if (path.includes('commission'))
          property = 'generalIncome.commission';
      } else if (path.includes('otherIncome')) {
        if (path.includes('training')) property = 'otherIncome.training';
        else if (path.includes('consulting'))
          property = 'otherIncome.consulting';
      } else if (path.includes('operationalExpenses')) {
        if (path.includes('managementFees'))
          property = 'operationalExpenses.managementFees';
        else if (path.includes('cloudHosting'))
          property = 'operationalExpenses.cloudHosting';
      } else if (path.includes('salariesAndWages')) {
        if (path.includes('fullTimeDevSalaries'))
          property = 'salariesAndWages.fullTimeDevSalaries';
        else if (path.includes('partTimeDevSalaries'))
          property = 'salariesAndWages.partTimeDevSalaries';
        else if (path.includes('remoteSalaries'))
          property = 'salariesAndWages.remoteSalaries';
      }

      if (property) {
        this.contextMenuX = event.clientX;
        this.contextMenuY = event.clientY;
        this.contextMenuVisible = true;
        this.contextMenuCellInfo = {
          month,
          property,
          path,
        };

        event.stopPropagation();
      }
    }
  }

  applyToAllCells(): void {
    if (!this.contextMenuCellInfo) return;

    const { month, property } = this.contextMenuCellInfo;

    const pathParts = property.split('.');
    let value: number = 0;

    if (pathParts.length === 1) {
      value = +this.budgetData[month][pathParts[0]] || 0;
    } else if (pathParts.length === 2) {
      const category = pathParts[0] as keyof ExtendedBudget;
      const field = pathParts[1];
      value = +(this.budgetData[month][category] as any)[field] || 0;
    }

    this.months.forEach((m) => {
      if (m !== month) {
        if (pathParts.length === 1) {
          const key = pathParts[0] as keyof ExtendedBudget;
          this.budgetData[m][key] = value;
        } else if (pathParts.length === 2) {
          const category = pathParts[0] as keyof ExtendedBudget;
          const field = pathParts[1];
          (this.budgetData[m][category] as any)[field] = value;
        }

        this.calculateTotals(m);
      }
    });

    this.contextMenuVisible = false;
    this.updateAllOpeningBalances();
  }

  calculateTotals(month: string): void {
    const budget = this.budgetData[month];

    const sales = +budget.generalIncome.sales || 0;
    const commission = +budget.generalIncome.commission || 0;
    const training = +budget.otherIncome.training || 0;
    const consulting = +budget.otherIncome.consulting || 0;
    const managementFees = +budget.operationalExpenses.managementFees || 0;
    const cloudHosting = +budget.operationalExpenses.cloudHosting || 0;
    const fullTimeDevSalaries =
      +budget.salariesAndWages.fullTimeDevSalaries || 0;
    const partTimeDevSalaries =
      +budget.salariesAndWages.partTimeDevSalaries || 0;
    const remoteSalaries = +budget.salariesAndWages.remoteSalaries || 0;

    budget.generalIncome.sales = sales;
    budget.generalIncome.commission = commission;
    budget.otherIncome.training = training;
    budget.otherIncome.consulting = consulting;
    budget.operationalExpenses.managementFees = managementFees;
    budget.operationalExpenses.cloudHosting = cloudHosting;
    budget.salariesAndWages.fullTimeDevSalaries = fullTimeDevSalaries;
    budget.salariesAndWages.partTimeDevSalaries = partTimeDevSalaries;
    budget.salariesAndWages.remoteSalaries = remoteSalaries;

    budget.generalIncome.subTotal = sales + commission;
    budget.otherIncome.subTotal = training + consulting;
    budget.operationalExpenses.subTotal = managementFees + cloudHosting;
    budget.salariesAndWages.subTotal =
      fullTimeDevSalaries + partTimeDevSalaries + remoteSalaries;

    budget.totalExpenses =
      budget.operationalExpenses.subTotal + budget.salariesAndWages.subTotal;

    budget.profitLoss =
      budget.generalIncome.subTotal +
      budget.otherIncome.subTotal -
      budget.totalExpenses;

    budget.closingBalance = budget.openingBalance + budget.profitLoss;

    const monthIndex = this.allMonths.indexOf(month);
    if (monthIndex < this.allMonths.length - 1) {
      const nextMonth = this.allMonths[monthIndex + 1];
      this.budgetData[nextMonth].openingBalance = budget.closingBalance;

      if (this.displayedMonths.includes(nextMonth)) {
        this.calculateTotals(nextMonth);
      }
    }
  }

  updateAllOpeningBalances(): void {
    this.budgetData[this.allMonths[0]].openingBalance = 0;

    for (let i = 1; i < this.allMonths.length; i++) {
      const prevMonth = this.allMonths[i - 1];
      const currentMonth = this.allMonths[i];
      this.budgetData[currentMonth].openingBalance =
        this.budgetData[prevMonth].closingBalance;
    }

    if (this.displayedMonths.length > 0) {
      this.calculateTotals(this.displayedMonths[0]);

      for (let i = 1; i < this.displayedMonths.length; i++) {
        const currentMonth = this.displayedMonths[i];
        this.calculateTotals(currentMonth);
      }
    }
  }

  onInputFocus(event: FocusEvent, rowIndex: number, colIndex: number): void {
    this.currentCell = { row: rowIndex, col: colIndex };
  }

  onDateRangeChanged(dateRange: DateRangeOutput): void {
    this.selectedStartMonth = dateRange.startMonth;
    this.selectedEndMonth = dateRange.endMonth;

    this.filterMonthsByRange();
  }

  filterMonthsByRange(): void {
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

    this.updateAllOpeningBalances();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.focusCell(0, 0);
    }, 100);
  }
}
