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
import { Budget, CustomCategory } from '../../model/budget.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import {
  MatDatepicker,
} from '@angular/material/datepicker';

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
    MatMenuModule,
  ],
  templateUrl: './exel-file-budget.component.html',
  styleUrl: './exel-file-budget.component.scss',
})
export class ExelFileBudgetComponent implements OnInit, AfterViewInit {
  @ViewChild('budgetTable') budgetTable!: ElementRef;
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

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
  contextMenuPosition = { x: '0px', y: '0px' };
  rightClickedCell: {
    month: string;
    property: string;
    path: string;
    element: HTMLElement;
  } | null = null;

  customGeneralIncomeRows: { id: string; label: string }[] = [];
  customOtherIncomeRows: { id: string; label: string }[] = [];
  customOperationalExpenseRows: { id: string; label: string }[] = [];
  customSalaryExpenseRows: { id: string; label: string }[] = [];

  customIncomeCategories: CustomCategory[] = [];
  customExpenseCategories: CustomCategory[] = [];

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
      if (this.rightClickedCell) {
        this.rightClickedCell = null;
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
        income: {
          generalIncome: {
            sales: 0,
            commission: 0,
            subTotal: 0,
          },
          otherIncome: {
            training: 0,
            consulting: 0,
            subTotal: 0,
          }
        },
        expenses: {
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
          }
        },
        totalExpenses: 0,
        profitLoss: 0,
        openingBalance: index === 0 ? 0 : 0,
        closingBalance: 0,
        customCategories: {}
      };
    });

    this.updateAllOpeningBalances();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.currentCell) return;

    if (event.key === 'Enter') {
      const { row, col } = this.currentCell;
      const tableRows = this.budgetTable.nativeElement.querySelectorAll('tbody tr');
      const inputRows = Array.from(tableRows as NodeListOf<Element>).filter(
        (tr) => tr.querySelector('input:not(.category-name-input):not(.label-input)')
      );
      
      const currentRow = inputRows[row];
      if (!currentRow) return;
      
      const rowText = currentRow.querySelector('td')?.textContent?.trim();
      
      if (this.isLastRowInCategory(row, rowText)) {
        this.addCustomRowForCategory(rowText);
        event.preventDefault();
        return;
      }
    }

    if (event.key === 'Tab') {
      event.preventDefault(); 
      
      const allFocusableElements = this.getAllFocusableElements();
      if (allFocusableElements.length === 0) return;
      
      const currentElement = document.activeElement;
      const currentIndex = allFocusableElements.findIndex(el => el === currentElement);
      
      if (currentIndex === -1) return;
      
      let nextIndex = event.shiftKey ? 
                       (currentIndex - 1 + allFocusableElements.length) % allFocusableElements.length : 
                       (currentIndex + 1) % allFocusableElements.length;
                       
      allFocusableElements[nextIndex].focus();
      
      const target = allFocusableElements[nextIndex];
      if (target.tagName === 'INPUT' && 
          !target.classList.contains('category-name-input') && 
          !target.classList.contains('label-input')) {
        this.updateCurrentCellFromElement(target as HTMLElement);
      }
      
      return;
    }

    const { row, col } = this.currentCell;
    let newRow = row;
    let newCol = col;

    const tableRows = this.budgetTable.nativeElement.querySelectorAll('tbody tr');
    const inputRows = Array.from(tableRows as NodeListOf<Element>).filter(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length === 0) return false;
      
      const hasNumericInput = Array.from(inputs).some(input => 
        !input.classList.contains('category-name-input') && 
        !input.classList.contains('label-input')
      );
      
      return hasNumericInput;
    });
    
    const totalRows = inputRows.length;
    const totalCols = this.displayedMonths.length;

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
          newCol = totalCols - 1;
        }
        break;
      case 'ArrowRight':
        if (col < totalCols - 1) {
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

  isLastRowInCategory(rowIndex: number, rowText?: string): boolean {
    const tableRows = this.budgetTable.nativeElement.querySelectorAll('tbody tr');
    const inputRows = Array.from(tableRows as NodeListOf<Element>).filter(
      (tr) => tr.querySelector('input')
    );
    
    if (rowIndex >= inputRows.length - 1) return false;
    
    const nextRow = inputRows[rowIndex + 1]?.closest('tr')?.nextElementSibling;
    if (nextRow && nextRow.querySelector('th')) {
      return true;
    }
    
    const nextRowText = inputRows[rowIndex + 1]?.querySelector('td')?.textContent?.trim();
    if (nextRowText === 'Subtotal') {
      return true;
    }
    
    return false;
  }

  addCustomCategory(type: 'income' | 'expenses'): void {
    const id = `custom_${type}_${Date.now()}`;
    const name = ''; 
    
    const newCategory: CustomCategory = {
      id,
      name,
      type,
      rows: [],
      values: {}
    };
    
    this.allMonths.forEach(month => {
      newCategory.values[month] = { subTotal: 0 };
      
      if (!this.budgetData[month]['customCategories']) {
        this.budgetData[month]['customCategories'] = {};
      }
      
      this.budgetData[month]['customCategories'][id] = {
        subTotal: 0
      };
    });
    
    if (type === 'income') {
      this.customIncomeCategories.push(newCategory);
    } else {
      this.customExpenseCategories.push(newCategory);
    }
    
    this.updateAllTotals();
  }
  
  addCustomRowToCategory(categoryId: string): void {
    let category = this.findCustomCategory(categoryId);
    
    if (!category) return;
    
    const rowId = `row_${Date.now()}`;
    const label = '';
    
    category.rows.push({ id: rowId, label });
    
    this.allMonths.forEach(month => {
      category.values[month][rowId] = 0;
      this.budgetData[month]['customCategories'][categoryId][rowId] = 0;
    });
    
    this.updateAllTotals();
  }
  
  findCustomCategory(categoryId: string): CustomCategory | undefined {
    return [...this.customIncomeCategories, ...this.customExpenseCategories]
      .find(cat => cat.id === categoryId);
  }
  
  updateCustomCategoryValue(month: string, categoryId: string, rowId: string, value: number): void {
    const category = this.findCustomCategory(categoryId);
    if (!category) return;
    
    category.values[month][rowId] = value;
    this.budgetData[month]['customCategories'][categoryId][rowId] = value;
    
    this.updateCategorySubtotal(month, categoryId);
    this.calculateTotals(month);
  }
  
  updateCategorySubtotal(month: string, categoryId: string): void {
    const category = this.findCustomCategory(categoryId);
    if (!category) return;
    
    let subtotal = 0;
    category.rows.forEach(row => {
      subtotal += +category.values[month][row.id] || 0;
    });
    
    category.values[month].subTotal = subtotal;
    this.budgetData[month]['customCategories'][categoryId].subTotal = subtotal;
  }

  addCustomRowForCategory(rowText?: string): void {
    let category = '';
    
    if (rowText === 'generalIncome' || rowText === 'otherIncome' || 
        rowText === 'operationalExpenses' || rowText === 'salariesAndWages') {
      category = rowText;
    } else {
      if (rowText && rowText.includes('Sales') || rowText && rowText.includes('Commission')) {
        category = 'generalIncome';
      } else if (rowText && rowText.includes('Training') || rowText && rowText.includes('Consulting')) {
        category = 'otherIncome';  
      } else if (rowText && rowText.includes('Management') || rowText && rowText.includes('Cloud')) {
        category = 'operationalExpenses';
      } else if (rowText && rowText.includes('Dev') || rowText && rowText.includes('Remote')) {
        category = 'salariesAndWages';
      }
    }
    
    if (!category) return;
    
    const id = `custom_${category}_${Date.now()}`;
    const label = '';
    
    if (category === 'generalIncome') {
      this.customGeneralIncomeRows.push({ id, label });
      this.allMonths.forEach(month => {
        (this.budgetData[month].income.generalIncome as any)[id] = 0;
      });
    } else if (category === 'otherIncome') {
      this.customOtherIncomeRows.push({ id, label });
      this.allMonths.forEach(month => {
        (this.budgetData[month].income.otherIncome as any)[id] = 0;
      });
    } else if (category === 'operationalExpenses') {
      this.customOperationalExpenseRows.push({ id, label });
      this.allMonths.forEach(month => {
        (this.budgetData[month].expenses.operationalExpenses as any)[id] = 0;
      });
    } else if (category === 'salariesAndWages') {
      this.customSalaryExpenseRows.push({ id, label });
      this.allMonths.forEach(month => {
        (this.budgetData[month].expenses.salariesAndWages as any)[id] = 0;
      });
    }
    
    this.allMonths.forEach(month => {
      this.calculateTotals(month);
    });
  }

  formatCategoryName(category: string): string {
    if (category === 'generalIncome') return 'General Income';
    if (category === 'otherIncome') return 'Other Income';
    if (category === 'operationalExpenses') return 'Operational Expense';
    if (category === 'salariesAndWages') return 'Salary Expense';
    return category;
  }

  calculateTotals(month: string): void {
    const budget = this.budgetData[month];

    const sales = +budget.income.generalIncome.sales || 0;
    const commission = +budget.income.generalIncome.commission || 0;
    
    let customGeneralIncomeTotal = 0;
    this.customGeneralIncomeRows.forEach(row => {
      customGeneralIncomeTotal += +(budget.income.generalIncome as any)[row.id] || 0;
    });
    
    const training = +budget.income.otherIncome.training || 0;
    const consulting = +budget.income.otherIncome.consulting || 0;
    
    let customOtherIncomeTotal = 0;
    this.customOtherIncomeRows.forEach(row => {
      customOtherIncomeTotal += +(budget.income.otherIncome as any)[row.id] || 0;
    });
    
    const managementFees = +budget.expenses.operationalExpenses.managementFees || 0;
    const cloudHosting = +budget.expenses.operationalExpenses.cloudHosting || 0;
    
    let customOperationalExpenseTotal = 0;
    this.customOperationalExpenseRows.forEach(row => {
      customOperationalExpenseTotal += +(budget.expenses.operationalExpenses as any)[row.id] || 0;
    });
    
    const fullTimeDevSalaries = +budget.expenses.salariesAndWages.fullTimeDevSalaries || 0;
    const partTimeDevSalaries = +budget.expenses.salariesAndWages.partTimeDevSalaries || 0;
    const remoteSalaries = +budget.expenses.salariesAndWages.remoteSalaries || 0;
    
    let customSalaryExpenseTotal = 0;
    this.customSalaryExpenseRows.forEach(row => {
      customSalaryExpenseTotal += +(budget.expenses.salariesAndWages as any)[row.id] || 0;
    });

    budget.income.generalIncome.sales = sales;
    budget.income.generalIncome.commission = commission;
    budget.income.otherIncome.training = training;
    budget.income.otherIncome.consulting = consulting;
    budget.expenses.operationalExpenses.managementFees = managementFees;
    budget.expenses.operationalExpenses.cloudHosting = cloudHosting;
    budget.expenses.salariesAndWages.fullTimeDevSalaries = fullTimeDevSalaries;
    budget.expenses.salariesAndWages.partTimeDevSalaries = partTimeDevSalaries;
    budget.expenses.salariesAndWages.remoteSalaries = remoteSalaries;

    budget.income.generalIncome.subTotal = sales + commission + customGeneralIncomeTotal;
    budget.income.otherIncome.subTotal = training + consulting + customOtherIncomeTotal;
    budget.expenses.operationalExpenses.subTotal = managementFees + cloudHosting + customOperationalExpenseTotal;
    budget.expenses.salariesAndWages.subTotal =
      fullTimeDevSalaries + partTimeDevSalaries + remoteSalaries + customSalaryExpenseTotal;

    let customIncomesTotal = 0;
    this.customIncomeCategories.forEach(category => {
      if (budget['customCategories'] && 
          budget['customCategories'][category.id]) {
        customIncomesTotal += budget['customCategories'][category.id].subTotal || 0;
      }
    });
    
    let customExpensesTotal = 0;
    this.customExpenseCategories.forEach(category => {
      if (budget['customCategories'] && 
          budget['customCategories'][category.id]) {
        customExpensesTotal += budget['customCategories'][category.id].subTotal || 0;
      }
    });

    budget.totalExpenses =
      budget.expenses.operationalExpenses.subTotal + 
      budget.expenses.salariesAndWages.subTotal +
      customExpensesTotal;

    budget.profitLoss =
      budget.income.generalIncome.subTotal +
      budget.income.otherIncome.subTotal +
      customIncomesTotal -
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

  updateAllTotals(): void {
    this.allMonths.forEach(month => {
      this.calculateTotals(month);
    });
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
    const target = event.target as HTMLElement;
    if (!target) return;
    
    const tableRows = this.budgetTable.nativeElement.querySelectorAll('tbody tr');
    const inputRows = Array.from(tableRows as NodeListOf<Element>).filter(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length === 0) return false;
      
      const hasNumericInput = Array.from(inputs).some(input => 
        !input.classList.contains('category-name-input') && 
        !input.classList.contains('label-input')
      );
      
      return hasNumericInput;
    });
    
    const currentRow = Array.from(inputRows).findIndex(row => row.contains(target));
    if (currentRow === -1) return;
    
    const valueInputs = Array.from(inputRows[currentRow].querySelectorAll('input')).filter(input => 
      !input.classList.contains('category-name-input') && 
      !input.classList.contains('label-input')
    );
    
    const currentCol = valueInputs.findIndex(input => input === target);
    if (currentCol === -1) return;
    
    this.currentCell = { row: currentRow, col: currentCol };
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

  focusCell(row: number, col: number): void {
    setTimeout(() => {
      const tableRows = this.budgetTable.nativeElement.querySelectorAll('tbody tr');
      const inputRows = Array.from(tableRows as NodeListOf<Element>).filter(tr => {
        const inputs = tr.querySelectorAll('input');
        if (inputs.length === 0) return false;
        
        const hasNumericInput = Array.from(inputs).some(input => 
          !input.classList.contains('category-name-input') && 
          !input.classList.contains('label-input')
        );
        
        return hasNumericInput;
      });

      if (row >= 0 && row < inputRows.length && inputRows[row]) {
        const allInputs = inputRows[row].querySelectorAll('input');
        const valueInputs = Array.from(allInputs).filter(input => 
          !input.classList.contains('category-name-input') && 
          !input.classList.contains('label-input')
        );
        
        if (valueInputs.length > 0 && col >= 0 && col < valueInputs.length) {
          this.currentCell = { row, col };
          (valueInputs[col] as HTMLInputElement).focus();
        }
      }
    });
  }

  onRightClick(event: MouseEvent, month: string, property: string): void {
    event.preventDefault();
    
    const targetInput = event.target as HTMLInputElement;
    
    if (!targetInput) return;
    
    this.contextMenuPosition = { 
      x: `${event.clientX}px`, 
      y: `${event.clientY}px` 
    };
    
    this.rightClickedCell = {
      month,
      property,
      path: property,
      element: targetInput
    };
    
    setTimeout(() => {
      this.menuTrigger.openMenu();
    });
    
    event.stopPropagation();
  }

  applyToAllCells(): void {
    if (!this.rightClickedCell) return;

    const { month, property } = this.rightClickedCell;

    const pathParts = property.split('.');
    let value: number = 0;

    if (pathParts[0] === 'customCategory') {
      const categoryId = pathParts[1];
      const rowId = pathParts[2]; 
      
      if (this.budgetData[month]['customCategories'] && 
          this.budgetData[month]['customCategories'][categoryId]) {
        value = +this.budgetData[month]['customCategories'][categoryId][rowId] || 0;
        
        this.months.forEach(m => {
          if (m !== month) {
            if (this.budgetData[m]['customCategories'] && 
                this.budgetData[m]['customCategories'][categoryId]) {
              this.budgetData[m]['customCategories'][categoryId][rowId] = value;
              this.updateCategorySubtotal(m, categoryId);
              this.calculateTotals(m);
            }
          }
        });
      }
      
      this.rightClickedCell = null;
      return;
    }

    if (pathParts.length === 1) {
      value = +this.budgetData[month][pathParts[0]] || 0;
    } else if (pathParts.length === 2) {
      const category = pathParts[0] as keyof ExtendedBudget;
      const field = pathParts[1];
      value = +(this.budgetData[month][category] as any)[field] || 0;
    } else if (pathParts.length === 3) {
      const category = pathParts[0] as keyof ExtendedBudget;
      const subcategory = pathParts[1];
      const field = pathParts[2];
      value = +((this.budgetData[month][category] as any)[subcategory] as any)[field] || 0;
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
        } else if (pathParts.length === 3) {
          const category = pathParts[0] as keyof ExtendedBudget;
          const subcategory = pathParts[1];
          const field = pathParts[2];
          ((this.budgetData[m][category] as any)[subcategory] as any)[field] = value;
        }

        this.calculateTotals(m);
      }
    });

    this.rightClickedCell = null;
    this.updateAllOpeningBalances();
  }

  getAllFocusableElements(): HTMLElement[] {
    const tableElement = this.budgetTable.nativeElement;
    if (!tableElement) return [];
    
    const inputs = Array.from(tableElement.querySelectorAll('input'));
    const addRowButtons = Array.from(tableElement.querySelectorAll('.add-row-icon'));
    const addCategoryButtons = Array.from(tableElement.querySelectorAll('.add-category-icon'));
    
    return [...inputs, ...addRowButtons, ...addCategoryButtons] as HTMLElement[];
  }
  
  updateCurrentCellFromElement(element: HTMLElement): void {
    const tableRows = this.budgetTable.nativeElement.querySelectorAll('tbody tr');
    const inputRows = Array.from(tableRows as NodeListOf<Element>).filter(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length === 0) return false;
      
      const hasNumericInput = Array.from(inputs).some(input => 
        !input.classList.contains('category-name-input') && 
        !input.classList.contains('label-input')
      );
      
      return hasNumericInput;
    });
    
    const currentRow = Array.from(inputRows).findIndex(row => row.contains(element));
    if (currentRow === -1) return;
    
    const valueInputs = Array.from(inputRows[currentRow].querySelectorAll('input')).filter(input => 
      !input.classList.contains('category-name-input') && 
      !input.classList.contains('label-input')
    );
    
    const currentCol = valueInputs.findIndex(input => input === element);
    if (currentCol === -1) return;
    
    this.currentCell = { row: currentRow, col: currentCol };
  }
}
