import { format } from 'date-fns';

interface PrintHeaderProps {
  title?: string;
  subtitle?: string;
  hospitalName?: string;
  showDate?: boolean;
  additionalInfo?: string;
}

export function PrintHeader({ 
  title = 'Report',
  subtitle,
  hospitalName = 'Medical Center',
  showDate = true,
  additionalInfo
}: PrintHeaderProps) {
  return (
    <div className="hidden print:block print-header">
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
        {/* Logo - Using first letter as fallback */}
        <div className="flex items-center justify-center mb-3">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {hospitalName.charAt(0).toUpperCase()}
          </div>
        </div>
        
        {/* Hospital Name */}
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {hospitalName}
        </h1>
        
        {/* Title */}
        <h2 className="text-xl text-gray-700 mb-2">
          {title}
        </h2>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-base text-gray-600 mb-2">
            {subtitle}
          </p>
        )}
        
        {/* Date and Additional Info */}
        <div className="text-sm text-gray-600 space-y-1">
          {showDate && (
            <p>
              <span className="font-semibold">Date: </span>
              {format(new Date(), 'MMMM dd, yyyy - HH:mm')}
            </p>
          )}
          {additionalInfo && (
            <p>{additionalInfo}</p>
          )}
        </div>
      </div>
      
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .print-header, .print-header * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
