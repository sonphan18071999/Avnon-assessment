# Avnon-assessment

## Budget Excel Table

An interactive budget management tool with Excel-like functionality built with Angular.

### Features

- **Monthly Budget Tracking**: View and manage your budget across multiple months
- **Categorized Structure**: Pre-defined categories for Income and Expenses
- **Custom Categories**: Add your own custom income and expense categories
- **Dynamic Row Addition**: Add new rows to any category
- **Editable Labels**: Customize the names of your categories and rows
- **Real-time Calculations**: Automatically calculates subtotals, total expenses, profit/loss, and closing balances
- **Visual Indicators**: Color-coded profit (green) and loss (red) for quick financial health assessment
- **Context Menu**: Right-click on cells to access additional options like "Apply to all"
- **Responsive Design**: Works well on different screen sizes with horizontal scrolling
- **Accessible Design**: Keyboard navigation and ARIA labels for better accessibility

### How to Use

1. Navigate through the different income and expense categories
2. Enter values in the input fields for each month
3. Add custom rows using the "+" buttons
4. Add custom categories with the "New Income Category" or "New Expense Category" buttons
5. Right-click on a cell to access the context menu
6. View calculated totals at the bottom of the table

The budget table automatically calculates:
- Subtotals for each category
- Total expenses
- Profit/Loss (difference between income and expenses)
- Opening and closing balances

### Implementation Details

The budget table is implemented as an Angular component with:
- Dynamic templates using *ngFor directives
- Two-way data binding with ngModel
- Event handling for focus, changes, and context menu
- Custom CSS for styling the table to look like a spreadsheet
- Responsive design with overflow scrolling