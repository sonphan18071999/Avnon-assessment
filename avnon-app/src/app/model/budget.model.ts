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

export interface Budget {
  income: Income;
  expenses: Expenses;
  totalExpenses: number;
  profitLoss: number;
  openingBalance: number;
  closingBalance: number;
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

