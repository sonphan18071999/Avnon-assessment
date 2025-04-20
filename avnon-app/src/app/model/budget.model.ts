export interface GeneralIncome {
  sales: number;
  commission: number;
  subTotal: number;
  [key: string]: number;
}

export interface OtherIncome {
  training: number;
  consulting: number;
  subTotal: number;
  [key: string]: number;
}

export interface OperationalExpenses {
  managementFees: number;
  cloudHosting: number;
  subTotal: number;
  [key: string]: number;
}

export interface SalariesAndWages {
  fullTimeDevSalaries: number;
  partTimeDevSalaries: number;
  remoteSalaries: number;
  subTotal: number;
  [key: string]: number;
}

export interface CustomCategoryRow {
  id: string;
  label: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expenses';
  rows: CustomCategoryRow[];
  values: { [month: string]: { [rowId: string]: number, subTotal: number } };
}

export interface CustomCategories {
  [categoryId: string]: {
    subTotal: number;
    [rowId: string]: number;
  };
}

export interface Budget {
  income: Income;
  expenses: Expenses;
  totalExpenses: number;
  profitLoss: number;
  openingBalance: number;
  closingBalance: number;
  customCategories: CustomCategories;
}

export interface Income {
  generalIncome: GeneralIncome;
  otherIncome: OtherIncome;
  [key: string]: GeneralIncome | OtherIncome;
}

export interface Expenses {
  operationalExpenses: OperationalExpenses;
  salariesAndWages: SalariesAndWages;
  [key: string]: OperationalExpenses | SalariesAndWages;
}

