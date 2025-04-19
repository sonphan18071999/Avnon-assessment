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
  generalIncome: GeneralIncome;
  otherIncome: OtherIncome;
  operationalExpenses: OperationalExpenses;
  salariesAndWages: SalariesAndWages;
  totalExpenses: number;
  profitLoss: number;
  openingBalance: number;
  closingBalance: number;
}
