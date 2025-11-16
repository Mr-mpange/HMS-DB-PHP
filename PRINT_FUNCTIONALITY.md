# Print Functionality Guide

This guide explains how to add professional print functionality to any page in the system.

## Features

- **Print Header**: Automatically displays hospital logo, name, and date on printed pages only
- **Clean Layout**: Hides buttons, navigation, and other UI elements when printing
- **Professional Formatting**: Optimized for A4 paper with proper margins and page breaks
- **Color Preservation**: Badges and important colors are preserved in print

## Quick Start

### 1. Import the PrintHeader Component

```tsx
import { PrintHeader } from '@/components/PrintHeader';
import { Printer } from 'lucide-react';
```

### 2. Add Print Button

```tsx
<Button onClick={() => window.print()}>
  <Printer className="h-4 w-4 mr-2" />
  Print
</Button>
```

### 3. Add PrintHeader to Your Page

```tsx
<div className="space-y-8">
  {/* Print Header - Only visible when printing */}
  <PrintHeader
    title="Invoice Report"
    subtitle="Detailed billing information"
    hospitalName="Medical Center"
    showDate={true}
    additionalInfo="Invoice #12345"
  />

  {/* Your content here */}
  <Card>
    {/* ... */}
  </Card>
</div>
```

### 4. Hide Elements from Print

Use the `print:hidden` class to hide elements when printing:

```tsx
<div className="print:hidden">
  <Button>This won't show in print</Button>
</div>
```

### 5. Add Print-Specific Styles

```tsx
<style>{`
  @media print {
    body * {
      visibility: hidden;
    }
    
    .space-y-8, .space-y-8 * {
      visibility: visible;
    }
    
    .print-header, .print-header * {
      visibility: visible !important;
    }
  }
`}</style>
```

## PrintHeader Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | 'Report' | Main title of the document |
| `subtitle` | string | undefined | Optional subtitle |
| `hospitalName` | string | 'Medical Center' | Hospital/clinic name |
| `showDate` | boolean | true | Show current date and time |
| `additionalInfo` | string | undefined | Extra information (e.g., period, invoice number) |

## Example: Invoice Print

```tsx
import { PrintHeader } from '@/components/PrintHeader';
import { Printer } from 'lucide-react';

export default function InvoiceDetail({ invoice }) {
  return (
    <div className="space-y-6">
      {/* Print Header */}
      <PrintHeader
        title="Invoice"
        hospitalName="City Medical Center"
        showDate={true}
        additionalInfo={`Invoice #${invoice.invoice_number}`}
      />

      {/* Print Button - Hidden when printing */}
      <div className="print:hidden flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
      </div>

      {/* Invoice Content */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Invoice details here */}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .space-y-6, .space-y-6 * {
            visibility: visible;
          }
          
          .print-header, .print-header * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
```

## Utility Classes

### Print-Specific Classes

- `print:hidden` - Hide element when printing
- `print:block` - Show element only when printing
- `print:break-inside-avoid` - Prevent page breaks inside element
- `no-print` - Alternative to print:hidden
- `print-page-break` - Force page break after element

### Example Usage

```tsx
{/* Hide navigation when printing */}
<nav className="print:hidden">
  {/* Navigation items */}
</nav>

{/* Prevent table from breaking across pages */}
<Table className="print:break-inside-avoid">
  {/* Table content */}
</Table>

{/* Show only in print */}
<div className="hidden print:block">
  <p>This appears only in printed version</p>
</div>
```

## Best Practices

1. **Test Your Prints**: Always test print preview before finalizing
2. **Use Semantic HTML**: Proper heading hierarchy (h1, h2, h3) for better print layout
3. **Avoid Fixed Heights**: Let content flow naturally for printing
4. **Consider Page Breaks**: Use `print:break-inside-avoid` for tables and cards
5. **Simplify Colors**: Important colors are preserved, but keep it minimal
6. **Remove Interactivity**: Hide buttons, inputs, and interactive elements

## Troubleshooting

### Content Not Showing in Print

Make sure your content container has the visibility rules:

```tsx
<style>{`
  @media print {
    .your-container, .your-container * {
      visibility: visible;
    }
  }
`}</style>
```

### Logo Not Displaying

The PrintHeader uses a circular badge with the first letter of the hospital name as a fallback. To use a custom logo, modify the PrintHeader component.

### Colors Not Printing

Add these CSS properties to preserve colors:

```css
-webkit-print-color-adjust: exact;
print-color-adjust: exact;
```

## Global Print Styles

All global print styles are defined in `src/styles/print.css` and automatically imported in `src/main.tsx`.

## Examples in Codebase

- **AdminReports**: `src/components/AdminReports.tsx` - Full report with multiple tables
- **PrintHeader**: `src/components/PrintHeader.tsx` - Reusable print header component

## Need Help?

Check the existing implementation in `AdminReports.tsx` for a complete working example.
